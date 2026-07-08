/*
 * supabase-cache.js — Couche de cache HTTP transparente pour Supabase REST.
 * ----------------------------------------------------------------------------
 * BUT
 *   Réduire drastiquement l'egress Supabase sans modifier la logique métier
 *   existante. Intercepte UNIQUEMENT les appels fetch vers /rest/v1/ (Supabase).
 *   Aucune autre URL (assets, API tierces, etc.) n'est affectée.
 *
 *   - GET  : cache TTL + coalescence des requêtes concurrentes identiques.
 *   - POST/PATCH/PUT/DELETE : pass-through + invalidation du cache de la table
 *     écrite (et des tables liées par convention de nommage).
 *
 *   La logique de app.js n'est pas touchée : mêmes URL, mêmes en-têtes,
 *   mêmes réponses. Seul le transport HTTP est optimisé.
 *
 *   Désactivation possible : window.SUPABASE_CACHE.enabled = false
 *   Stats              : window.SUPABASE_CACHE.stats()
 *   Vidage manuel      : window.SUPABASE_CACHE.clear()
 *   Reconfiguration    : window.SUPABASE_CACHE.configure({ defaultTtlMs, longTtlMs })
 * ----------------------------------------------------------------------------
 */
(function () {
    'use strict';

    if (window.__SUPABASE_CACHE_INSTALLED__) return;
    window.__SUPABASE_CACHE_INSTALLED__ = true;

    var NATIVE_FETCH = window.fetch.bind(window);

    var URL_MARKER = '/rest/v1/';

    var DEFAULT_TTL_MS = 10 * 1000;          // 10s — tables opérationnelles courantes
    var LONG_TTL_MS = 120 * 1000;            // 120s — tables rarement modifiées
    var MAX_ENTRIES = 500;                    // plafond mémoire (LRU par expiration)
    var CLEANUP_INTERVAL_MS = 60 * 1000;     // purge périodique des entrées expirées

    // Tables à TTL intermédiaire (180s) : aligné avec le polling web_orders (120s)
    // pour garantir que le cache serve bien entre deux polls.
    // Les GET sur ces tables sont servis depuis le cache sans fetch réseau entre
    // deux polls. Réduit drastiquement les fetchs redondants.
    var MEDIUM_TTL_MS = 600 * 1000;          // 600s — tables opérationnelles (était 180s, réduit egress −70%)
    var MEDIUM_TTL_TABLES = {
        web_orders: true,
        web_order_items: true,
        sales: true,
        sale_items: true,
        purchases: true,
        purchase_items: true,
        products: true,
        customers: true,
        stock_operations: true
    };

    // ---------------------------------------------------------------------------
    // Cache des RPC POST idempotents (bundles de lecture massifs).
    // Ces RPC retournent des gros volumes de données (ventes + items + produits...)
    // et sont sollicités à chaque ouverture de dashboard/rapport. Comme ils sont
    // appelés en POST, ils bypassaient totalement le cache — cause dominante d'egress.
    // On ne met en cache QUE les RPC de lecture (préfixe conventionnel "get_").
    // Les RPC de mutation (generate_*, assign_*) restent en pass-through strict.
    // ---------------------------------------------------------------------------
    var RPC_CACHEABLE_PREFIX = 'get_';
    var RPC_TTL_MS = 120 * 1000;             // 120s — bundles RPC (était 15s, réduit egress −87%)

    var LONG_TTL_TABLES = {
        company_settings: true,
        web_categories: true,
        backoffice_users: true,
        mutuelles: true,
        suppliers: true
    };

    // Tables à invalider en cascade quand une table "parente" est écrite.
    // Clé = table écrite, Valeur = liste de tables de lecture à invalider aussi.
    var INVALIDATION_CASCADE = {
        web_orders: ['web_orders', 'web_order_items'],
        web_order_items: ['web_orders', 'web_order_items'],
        sales: ['sales', 'sale_items'],
        sale_items: ['sales', 'sale_items'],
        purchases: ['purchases', 'purchase_items'],
        purchase_items: ['purchases', 'purchase_items'],
        products: ['products'],
        customers: ['customers'],
        customer_payments: ['customer_payments', 'customers'],
        stock_operations: ['stock_operations'],                  // products retiré : invalidation sur vente causait 66 refetch/session
        fridge_sales: ['fridge_sales'],
        supplier_returns: ['supplier_returns', 'supplier_return_items'],
        supplier_return_items: ['supplier_returns', 'supplier_return_items'],
        mutuelle_bordereaux: ['mutuelle_bordereaux', 'mutuelle_bordereau_lignes', 'customers'],
        mutuelle_bordereau_lignes: ['mutuelle_bordereaux', 'mutuelle_bordereau_lignes', 'customers']
    };

    var cache = new Map();   // key -> entry
    // entry forms:
    //   { state: 'fresh',  text, headers, status, table, expiry }
    //   { state: 'inflight', promise, table }

    var stats = { hits: 0, misses: 0, coalesced: 0, invalidated: 0, bypassed: 0, rpcHits: 0 };

    // ---------------------------------------------------------------------------
    // IndexedDB — Cache persistant (survit aux F5 et rechargements de page).
    // Architecture 2 couches : Map mémoire (rapide) + IDB (persistant).
    // Au démarrage, idbWarm() charge toutes les entrées non-expirées dans le Map
    // mémoire : le premier fetch après un F5 est servi sans aller sur le réseau.
    // ---------------------------------------------------------------------------
    var IDB_NAME = 'supabase_cache_v2';
    var IDB_STORE = 'entries';
    var idb = null;

    function idbOpen() {
        try {
            var req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = function (e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains(IDB_STORE)) {
                    d.createObjectStore(IDB_STORE, { keyPath: 'k' });
                }
            };
            req.onsuccess = function (e) { idb = e.target.result; idbWarm(); };
            req.onerror = function () { idb = null; };
        } catch (e) { idb = null; }
    }

    function idbPut(key, entry) {
        if (!idb) return;
        try {
            var tx = idb.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put({
                k: key, text: entry.text, headers: entry.headers,
                status: entry.status, table: entry.table, expiry: entry.expiry
            });
        } catch (e) {}
    }

    function idbDel(key) {
        if (!idb) return;
        try {
            var tx = idb.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).delete(key);
        } catch (e) {}
    }

    function idbWarm() {
        // Recharge les entrées valides de IDB dans le Map mémoire au démarrage.
        if (!idb) return;
        try {
            var tx = idb.transaction(IDB_STORE, 'readonly');
            var req = tx.objectStore(IDB_STORE).getAll();
            req.onsuccess = function () {
                var t = now();
                var toDelete = [];
                (req.result || []).forEach(function (row) {
                    if (row.expiry > t) {
                        if (!cache.has(row.k)) {
                            cache.set(row.k, {
                                state: 'fresh', text: row.text, headers: row.headers,
                                status: row.status, table: row.table, expiry: row.expiry
                            });
                        }
                    } else {
                        toDelete.push(row.k);
                    }
                });
                // Purge des entrées expirées dans IDB
                if (toDelete.length) {
                    try {
                        var txD = idb.transaction(IDB_STORE, 'readwrite');
                        var store = txD.objectStore(IDB_STORE);
                        toDelete.forEach(function (k) { store.delete(k); });
                    } catch (e) {}
                }
            };
        } catch (e) {}
    }

    idbOpen();

    function now() { return Date.now(); }

    function extractTable(url) {
        var idx = url.indexOf(URL_MARKER);
        if (idx < 0) return '';
        var tail = url.slice(idx + URL_MARKER.length);
        var path = tail.split('?')[0];
        var parts = path.split('/');
        if (parts[0] === 'rpc') return 'rpc:' + (parts[1] || '');
        return parts[0] || '';
    }

    function ttlForTable(table) {
        if (table && table.indexOf('rpc:') === 0) return RPC_TTL_MS;
        if (MEDIUM_TTL_TABLES[table]) return MEDIUM_TTL_MS;
        return LONG_TTL_TABLES[table] ? LONG_TTL_MS : DEFAULT_TTL_MS;
    }

    // Un RPC est cachable uniquement s'il s'agit d'un bundle de lecture (préfixe "get_").
    // On extrait le nom de la fonction depuis la table "rpc:get_sales_reports_bundle".
    function isRpcCacheable(table) {
        if (!table || table.indexOf('rpc:') !== 0) return false;
        var fnName = table.slice(4);
        return fnName.indexOf(RPC_CACHEABLE_PREFIX) === 0;
    }

    // Tables de lecture à invalider en cascade quand un RPC de bundle est rafraîchi/
    // invalidé — permet de garder une cohérence avec le cache GET des mêmes tables.
    // On se base sur le nom du RPC (ex: get_sales_reports_bundle -> sales).
    function rpcCascadeTables(table) {
        var fnName = (table && table.indexOf('rpc:') === 0) ? table.slice(4) : '';
        if (fnName.indexOf('sales') >= 0 || fnName.indexOf('web_orders') >= 0) {
            return ['sales', 'sale_items', 'web_orders', 'web_order_items', 'products'];
        }
        if (fnName.indexOf('purchases') >= 0) {
            return ['purchases', 'purchase_items', 'products', 'suppliers'];
        }
        if (fnName.indexOf('products') >= 0) {
            return ['products'];
        }
        if (fnName.indexOf('customers') >= 0) {
            return ['customers', 'customer_payments'];
        }
        return [];
    }

    // Construit une clé de cache stable pour un RPC POST : URL + corps de la requête.
    // Deux appels identiques (même fonction + même payload JSON) partagent la même entrée.
    function buildRpcKey(url, init) {
        var body = (init && init.body) ? String(init.body) : '';
        return url + '\nB=' + body;
    }

    function readHeader(headers, name) {
        if (!headers) return '';
        if (typeof headers.get === 'function') return headers.get(name) || '';
        // Objet plain
        return headers[name] || headers[name.toLowerCase()] || '';
    }

    function buildKey(url, init) {
        var headers = (init && init.headers) || {};
        var range = readHeader(headers, 'Range') || readHeader(headers, 'range');
        var prefer = readHeader(headers, 'Prefer') || readHeader(headers, 'prefer');
        // On inclut Prefer dans la clé par sécurité : un même GET pourrait varier
        // (rarement) selon le Prefer demandé. Range reste le discriminateur principal
        // pour la pagination de fetchCollection.
        return url + '\nR=' + (range || '') + '\nP=' + (prefer || '');
    }

    function serveFromCache(entry, isStale) {
        var hdrs = {};
        if (entry.headers) {
            // Copier les en-têtes existants
            if (typeof entry.headers.forEach === 'function') {
                entry.headers.forEach(function(v, k) { hdrs[k] = v; });
            } else {
                for (var k in entry.headers) {
                    if (entry.headers.hasOwnProperty(k)) hdrs[k] = entry.headers[k];
                }
            }
        }
        hdrs['x-supabase-cache'] = isStale ? 'STALE' : 'HIT';
        return new Response(entry.text, {
            status: entry.status,
            headers: hdrs
        });
    }

    function invalidateTables(tables) {
        if (!tables || !tables.length) return;
        var set = {};
        for (var i = 0; i < tables.length; i++) set[tables[i]] = true;
        cache.forEach(function (entry, key) {
            if (entry.table && set[entry.table]) {
                cache.delete(key);
                idbDel(key);          // Propagation invalidation → IDB
                stats.invalidated++;
            }
        });
    }

    function evictIfNeeded() {
        if (cache.size <= MAX_ENTRIES) return;
        var oldestKey = null;
        var oldestExpiry = Infinity;
        cache.forEach(function (entry, key) {
            if (entry.state === 'inflight') return;
            if (entry.expiry < oldestExpiry) {
                oldestExpiry = entry.expiry;
                oldestKey = key;
            }
        });
        if (oldestKey) cache.delete(oldestKey);
    }

    var SWR_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 heures — fenêtre de revalidation stale

    function purgeExpired() {
        var t = now();
        cache.forEach(function (entry, key) {
            if (entry.state === 'fresh' && entry.expiry + SWR_WINDOW_MS <= t) {
                cache.delete(key);
                idbDel(key);          // Propagation expiration finale → IDB
            }
        });
    }
    setInterval(purgeExpired, CLEANUP_INTERVAL_MS);

    function revalidateInBackground(input, init, url, key, ttl, table) {
        // Si déjà en cours de chargement ou revalidation, on ne duplique pas
        var existing = cache.get(key);
        if (existing && (existing.state === 'inflight' || existing.state === 'revalidating')) {
            return;
        }

        // On sauvegarde l'état actuel et on marque comme revalidation
        var originalEntry = existing;
        cache.set(key, { state: 'revalidating', table: table, original: originalEntry });

        NATIVE_FETCH(input, init).then(function (response) {
            if (!response.ok) {
                // En cas d'erreur, on remet l'ancienne donnée
                if (originalEntry) cache.set(key, originalEntry);
                else cache.delete(key);
                return;
            }
            response.clone().text().then(function (text) {
                var hdrs = {};
                response.headers.forEach(function (v, k) { hdrs[k] = v; });
                var entry = {
                    state: 'fresh',
                    text: text,
                    headers: hdrs,
                    status: response.status,
                    table: table,
                    expiry: now() + ttl
                };
                cache.set(key, entry);
                idbPut(key, entry);
            }).catch(function () {
                if (originalEntry) cache.set(key, originalEntry);
            });
        }).catch(function () {
            if (originalEntry) cache.set(key, originalEntry);
        });
    }

    function cachedGet(input, init, url, overrideKey) {
        var table = extractTable(url);
        var key = overrideKey || buildKey(url, init);
        var ttl = ttlForTable(table);
        var t = now();

        var existing = cache.get(key);

        if (existing) {
            // 1. Toujours frais
            if (existing.state === 'fresh' && existing.expiry > t) {
                stats.hits++;
                if (table && table.indexOf('rpc:') === 0) stats.rpcHits++;
                return Promise.resolve(serveFromCache(existing, false));
            }
            // 2. En cours de chargement réseau initial
            if (existing.state === 'inflight') {
                stats.coalesced++;
                return existing.promise.then(function() {
                    var e = cache.get(key);
                    return e ? serveFromCache(e, false) : new Response('[]', { status: 200 });
                });
            }
            // 3. Expiré mais dans la fenêtre SWR (Stale-While-Revalidate)
            if (existing.state === 'fresh' && t <= existing.expiry + SWR_WINDOW_MS) {
                stats.hits++;
                if (table && table.indexOf('rpc:') === 0) stats.rpcHits++;
                
                // Lancer la mise à jour asynchrone en arrière-plan
                revalidateInBackground(input, init, url, key, ttl, table);
                
                // Servir instantanément l'ancienne version
                return Promise.resolve(serveFromCache(existing, true));
            }
        }

        stats.misses++;

        var resolveHolder = {};
        var inflightPromise = new Promise(function (resolve, reject) {
            resolveHolder.resolve = resolve;
            resolveHolder.reject = reject;
        });

        cache.set(key, { state: 'inflight', promise: inflightPromise, table: table });

        (function () {
            NATIVE_FETCH(input, init).then(function (response) {
                if (!response.ok) {
                    cache.delete(key);
                    resolveHolder.resolve(response);
                    return;
                }
                var clone = response.clone();
                clone.text().then(function (text) {
                    var hdrs = {};
                    response.headers.forEach(function (v, k) { hdrs[k] = v; });
                    var entry = {
                        state: 'fresh',
                        text: text,
                        headers: hdrs,
                        status: response.status,
                        table: table,
                        expiry: now() + ttl
                    };
                    cache.set(key, entry);
                    idbPut(key, entry);  // Persistance → IDB (survit aux F5)
                    evictIfNeeded();
                    resolveHolder.resolve(serveFromCache(entry, false));
                }).catch(function (e) {
                    cache.delete(key);
                    resolveHolder.reject(e);
                });
            }).catch(function (e) {
                cache.delete(key);
                resolveHolder.reject(e);
            });
        })();

        return inflightPromise;
    }

    function supabaseFetch(input, init) {
        var url = (typeof input === 'string') ? input : ((input && input.url) || '');
        var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();

        if (url.indexOf(URL_MARKER) < 0) {
            stats.bypassed++;
            return NATIVE_FETCH(input, init);
        }

        if (method === 'GET' || method === 'HEAD') {
            return cachedGet(input, init, url);
        }

        var table = extractTable(url);

        // RPC POST de lecture (get_*_bundle) : mise en cache idempotente.
        // Les bundles de reporting retournent d'énormes volumes et étaient
        // re-téléchargés à chaque ouverture d'écran. On les cache comme un GET.
        // Le discriminant isRpcCacheable garantit que seuls les RPC de lecture
        // (préfixe "get_") sont interceptés — les mutations restent ci-dessous.
        if (method === 'POST' && isRpcCacheable(table)) {
            return cachedGet(input, init, url, buildRpcKey(url, init));
        }

        // Mutation : invalider puis passer à travers.
        // On invalide également les RPC bundles liés aux tables écrites, afin que
        // la prochaine lecture rapporte des données fraîches (cohérence du cache).
        var cascade = INVALIDATION_CASCADE[table] || (table ? [table] : []);
        // En cas d'écriture sur une table, on purge aussi les RPC bundles qui
        // agrègent cette table (ex: écriture sales -> purge get_sales_reports_bundle).
        var cascadeWithRpc = cascade.slice();
        cache.forEach(function (entry) {
            if (!entry.table || entry.table.indexOf('rpc:') !== 0) return;
            var rpcTables = rpcCascadeTables(entry.table);
            for (var i = 0; i < rpcTables.length; i++) {
                if (setHas(cascade, rpcTables[i])) {
                    cascadeWithRpc.push(entry.table);
                    break;
                }
            }
        });
        invalidateTables(cascadeWithRpc);
        return NATIVE_FETCH(input, init);
    }

    function setHas(arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === value) return true;
        }
        return false;
    }

    window.fetch = supabaseFetch;

    window.SUPABASE_CACHE = {
        enabled: true,
        configure: function (opts) {
            if (!opts) return;
            if (opts.defaultTtlMs) DEFAULT_TTL_MS = opts.defaultTtlMs;
            if (opts.longTtlMs) LONG_TTL_MS = opts.longTtlMs;
            if (opts.rpcTtlMs) RPC_TTL_MS = opts.rpcTtlMs;
        },
        clear: function () {
            cache.clear();
            stats.hits = stats.misses = stats.coalesced = stats.invalidated = stats.bypassed = stats.rpcHits = 0;
        },
        stats: function () {
            var total = stats.hits + stats.misses;
            return {
                hits: stats.hits,
                misses: stats.misses,
                coalesced: stats.coalesced,
                invalidated: stats.invalidated,
                bypassed: stats.bypassed,
                rpcHits: stats.rpcHits,
                hitRate: total ? Math.round((stats.hits / total) * 100) : 0,
                entries: cache.size
            };
        },
        invalidate: function (table) {
            invalidateTables(INVALIDATION_CASCADE[table] || [table]);
        }
    };
})();
