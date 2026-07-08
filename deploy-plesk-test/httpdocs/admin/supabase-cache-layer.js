/**
 * SUPABASE CACHE LAYER - Version Professionnelle Anti-Egress & Anti-OOM
 *
 * Combine le cache mémoire RAM (LRU avec taille mémoire globale bornée),
 * la persistance asynchrone IndexedDB (sur disque, aucun impact sur la RAM),
 * la coalescence de requêtes identiques en cours de traitement,
 * le pattern Stale-While-Revalidate (SWR),
 * et l'invalidation automatique en cascade lors des écritures.
 *
 * AUCUNE modification requise dans app.js ou les autres modules.
 */
(function () {
    'use strict';

    if (window.__SUPABASE_CACHE_INSTALLED__) return;
    window.__SUPABASE_CACHE_INSTALLED__ = true;

    var NATIVE_FETCH = window.fetch.bind(window);
    var URL_MARKER = '/rest/v1/';

    // --- CONFIGURATION DU CACHE & TTL ---
    var DEFAULT_TTL_MS = 60 * 1000;          // 1 min — tables opérationnelles courantes
    var LONG_TTL_MS = 60 * 60 * 1000;        // 1h — tables rarement modifiées
    var MEDIUM_TTL_MS = 10 * 60 * 1000;      // 10 min — tables opérationnelles critiques
    var HEAVY_TTL_MS = 6 * 60 * 60 * 1000;   // 6h — gros catalogues, invalidés à l'écriture

    var MEDIUM_TTL_TABLES = {
        web_orders: true,
        web_order_items: true,
        sales: true,
        sale_items: true,
        purchases: true,
        purchase_items: true,
        customers: true,
        stock_operations: true,
        customer_payments: true,
        fridge_sales: true,
        supplier_returns: true,
        supplier_return_items: true,
        mutuelle_bordereaux: true,
        mutuelle_bordereau_lignes: true
    };

    var LONG_TTL_TABLES = {
        products: true,
        company_settings: true,
        web_categories: true,
        backoffice_users: true,
        mutuelles: true,
        suppliers: true
    };

    var RPC_CACHEABLE_PREFIX = 'get_';
    var RPC_TTL_MS = 600 * 1000;             // 600s — bundles RPC de lecture (10 minutes)

    // --- DOUBLE GARDE-FOU ANTI-OOM (LIMITES MÉMOIRE STRICTES) ---
    var MAX_RAM_ENTRY_SIZE = 30 * 1024 * 1024;  // 30 Mo max par entrée en RAM. Permet de cacher les grands catalogues de produits.
    var MAX_RAM_TOTAL_SIZE = 250 * 1024 * 1024; // 250 Mo max de taille cumulée en RAM (évite le cache thrashing).
    var TARGET_RAM_SIZE = 180 * 1024 * 1024;    // Cible de nettoyage à 180 Mo en cas de dépassement.

    var SWR_WINDOW_MS = 12 * 60 * 60 * 1000;  // 12 heures — fenêtre Stale-While-Revalidate
    var CLEANUP_INTERVAL_MS = 60 * 1000;      // 1 minute — intervalle de nettoyage régulier

    // --- INVALIDATIONS EN CASCADE ---
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
        stock_operations: ['stock_operations'],
        fridge_sales: ['fridge_sales'],
        supplier_returns: ['supplier_returns', 'supplier_return_items'],
        supplier_return_items: ['supplier_returns', 'supplier_return_items'],
        mutuelle_bordereaux: ['mutuelle_bordereaux', 'mutuelle_bordereau_lignes', 'customers'],
        mutuelle_bordereau_lignes: ['mutuelle_bordereaux', 'mutuelle_bordereau_lignes', 'customers']
    };

    var cache = new Map(); // structure : key -> { state, text, headers, status, table, expiry, ts }
    var stats = { hits: 0, misses: 0, coalesced: 0, invalidated: 0, bypassed: 0, rpcHits: 0, oomBlocked: 0 };

    // --- PERSISTANCE INDEXEDDB (SUR DISQUE, SANS IMPACT RAM) ---
    var IDB_NAME = 'supabase_cache_v2';
    var IDB_STORE = 'entries';
    var idb = null;

    // --- MECANISME DE DÉMARRAGE ET DE WARM-UP SYNCHRONE ---
    var resolveWarmPromise;
    var warmPromise = new Promise(function (resolve) {
        resolveWarmPromise = resolve;
    });

    // Sécurité : Résoudre le warmPromise après 250ms max pour ne pas bloquer l'application en cas de problème d'IndexedDB
    var warmTimeout = setTimeout(function () {
        resolveWarmPromise();
    }, 250);

    function idbOpen() {
        try {
            var req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = function (e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains(IDB_STORE)) {
                    d.createObjectStore(IDB_STORE, { keyPath: 'k' });
                }
            };
            req.onsuccess = function (e) {
                idb = e.target.result;
                idbWarm();
            };
            req.onerror = function () {
                idb = null;
                clearTimeout(warmTimeout);
                resolveWarmPromise();
            };
        } catch (e) {
            idb = null;
            clearTimeout(warmTimeout);
            resolveWarmPromise();
        }
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
        if (!idb) {
            clearTimeout(warmTimeout);
            resolveWarmPromise();
            return;
        }
        try {
            var tx = idb.transaction(IDB_STORE, 'readonly');
            var req = tx.objectStore(IDB_STORE).getAll();
            req.onsuccess = function () {
                var t = Date.now();
                var toDelete = [];
                var currentRamSize = getCacheMemorySize();

                (req.result || []).forEach(function (row) {
                    if (row.expiry > t) {
                        // Charger en RAM si pas déjà présent et respecte la limite de taille
                        if (!cache.has(row.k) && row.text && row.text.length <= MAX_RAM_ENTRY_SIZE) {
                            var entrySize = row.text.length * 2;
                            if (currentRamSize + entrySize <= MAX_RAM_TOTAL_SIZE) {
                                cache.set(row.k, {
                                    state: 'fresh', text: row.text, headers: row.headers,
                                    status: row.status, table: row.table, expiry: row.expiry, ts: t
                                });
                                currentRamSize += entrySize;
                            }
                        }
                    } else {
                        toDelete.push(row.k);
                    }
                });

                if (toDelete.length) {
                    try {
                        var txD = idb.transaction(IDB_STORE, 'readwrite');
                        var store = txD.objectStore(IDB_STORE);
                        toDelete.forEach(function (k) { store.delete(k); });
                    } catch (e) {}
                }
                clearTimeout(warmTimeout);
                resolveWarmPromise();
            };
            req.onerror = function () {
                clearTimeout(warmTimeout);
                resolveWarmPromise();
            };
        } catch (e) {
            clearTimeout(warmTimeout);
            resolveWarmPromise();
        }
    }

    idbOpen();

    // --- FONCTIONS UTILITAIRES DE TAILLE MÉMOIRE ---
    function getCacheMemorySize() {
        var size = 0;
        cache.forEach(function (entry) {
            if (entry.text) {
                size += entry.text.length * 2; // approximation UTF-16 en RAM
            }
        });
        return size;
    }

    function evictRAMIfNeeded() {
        var currentSize = getCacheMemorySize();
        if (currentSize <= MAX_RAM_TOTAL_SIZE) return;

        while (currentSize > TARGET_RAM_SIZE && cache.size > 0) {
            var oldestKey = null;
            var oldestTs = Infinity;
            cache.forEach(function (entry, key) {
                if (entry.state !== 'inflight' && entry.ts < oldestTs) {
                    oldestTs = entry.ts;
                    oldestKey = key;
                }
            });

            if (oldestKey) {
                var entry = cache.get(oldestKey);
                if (entry && entry.text) {
                    currentSize -= entry.text.length * 2;
                }
                cache.delete(oldestKey);
                idbDel(oldestKey);
            } else {
                break;
            }
        }
    }

    // --- EXTRACTION ET CONSTITUTION DES CLÉS ---
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
        if (table === 'products') return HEAVY_TTL_MS;
        if (table === 'web_categories') return 24 * 60 * 60 * 1000;
        if (MEDIUM_TTL_TABLES[table]) return MEDIUM_TTL_MS;
        return LONG_TTL_TABLES[table] ? LONG_TTL_MS : DEFAULT_TTL_MS;
    }

    function isRpcCacheable(table) {
        if (!table || table.indexOf('rpc:') !== 0) return false;
        var fnName = table.slice(4);
        return fnName.indexOf('get_') === 0 || 
               fnName.indexOf('read_') === 0 || 
               fnName.indexOf('fetch_') === 0 || 
               fnName.indexOf('rapport_') === 0 || 
               fnName.indexOf('calculate_') === 0;
    }

    // Tables de lecture à invalider en cascade quand un RPC de bundle est rafraîchi/
    // invalidé — permet de garder une cohérence avec le cache GET des mêmes tables.
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

    function stableHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return (hash >>> 0).toString(36);
    }

    function sortUrlParams(url) {
        var idx = url.indexOf('?');
        if (idx < 0) return url;
        var base = url.slice(0, idx);
        var params = url.slice(idx + 1).split('&').sort();
        return base + '?' + params.join('&');
    }

    function buildRpcKey(url, init) {
        var body = (init && init.body) ? String(init.body) : '';
        var raw = sortUrlParams(url) + '\nB=' + body;
        return raw.length > 200 ? stableHash(raw) : raw;
    }

    function readHeader(headers, name) {
        if (!headers) return '';
        if (typeof headers.get === 'function') return headers.get(name) || '';
        return headers[name] || headers[name.toLowerCase()] || '';
    }

    function buildKey(url, init) {
        var headers = (init && init.headers) || {};
        var range = readHeader(headers, 'Range') || readHeader(headers, 'range');
        var prefer = readHeader(headers, 'Prefer') || readHeader(headers, 'prefer');
        var raw = sortUrlParams(url) + '\nR=' + (range || '') + '\nP=' + (prefer || '');
        return raw.length > 200 ? stableHash(raw) : raw;
    }

    function serveFromCache(entry, isStale) {
        var hdrs = {};
        if (entry.headers) {
            if (typeof entry.headers.forEach === 'function') {
                entry.headers.forEach(function (v, k) { hdrs[k] = v; });
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
                idbDel(key);
                stats.invalidated++;
            }
        });
    }

    function purgeExpired() {
        var t = Date.now();
        cache.forEach(function (entry, key) {
            if (entry.state === 'fresh' && entry.expiry + SWR_WINDOW_MS <= t) {
                cache.delete(key);
                idbDel(key);
            }
        });
    }
    setInterval(purgeExpired, CLEANUP_INTERVAL_MS);

    // --- GESTION DU CYCLE DE VIE DES REQUÊTES EN CACHE ---
    function revalidateInBackground(input, init, url, key, ttl, table) {
        var existing = cache.get(key);
        if (existing && (existing.state === 'inflight' || existing.state === 'revalidating')) {
            return;
        }

        var originalEntry = existing;
        cache.set(key, { state: 'revalidating', table: table, original: originalEntry, ts: Date.now() });

        NATIVE_FETCH(input, init).then(function (response) {
            if (!response.ok) {
                if (originalEntry) cache.set(key, originalEntry);
                else cache.delete(key);
                return;
            }
            response.clone().text().then(function (text) {
                if (text.length > MAX_RAM_ENTRY_SIZE) {
                    stats.oomBlocked++;
                    cache.delete(key);
                    idbDel(key);
                    return;
                }

                var hdrs = {};
                response.headers.forEach(function (v, k) { hdrs[k] = v; });
                var entry = {
                    state: 'fresh',
                    text: text,
                    headers: hdrs,
                    status: response.status,
                    table: table,
                    expiry: Date.now() + ttl,
                    ts: Date.now()
                };
                cache.set(key, entry);
                idbPut(key, entry);
                evictRAMIfNeeded();
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
        var t = Date.now();

        var existing = cache.get(key);

        if (existing) {
            if (existing.state === 'fresh' && existing.expiry > t) {
                stats.hits++;
                existing.ts = t; // Update pour LRU
                if (table && table.indexOf('rpc:') === 0) stats.rpcHits++;
                var sizeKb = Math.round((existing.text ? existing.text.length : 0) / 1024);
                console.log('%c[CACHE HIT] %c' + table + ' (%c' + sizeKb + ' KB %csauvegardés)', 'color: #10b981; font-weight: bold;', 'color: inherit;', 'color: #3b82f6; font-weight: bold;', 'color: inherit;');
                return Promise.resolve(serveFromCache(existing, false));
            }
            if (existing.state === 'inflight') {
                stats.coalesced++;
                return existing.promise.then(function () {
                    var e = cache.get(key);
                    return e ? serveFromCache(e, false) : new Response('[]', { status: 200 });
                });
            }
            if (existing.state === 'revalidating') {
                stats.hits++;
                existing.ts = t; // Update pour LRU
                if (table && table.indexOf('rpc:') === 0) stats.rpcHits++;
                var orig = existing.original || existing;
                var sizeKb = Math.round((orig.text ? orig.text.length : 0) / 1024);
                console.log('%c[CACHE STALE-HIT] %c' + table + ' (%c' + sizeKb + ' KB %csauvegardés, revalidation en cours)', 'color: #f59e0b; font-weight: bold;', 'color: inherit;', 'color: #3b82f6; font-weight: bold;', 'color: inherit;');
                return Promise.resolve(serveFromCache(orig, true));
            }
            if (existing.state === 'fresh' && t <= existing.expiry + SWR_WINDOW_MS) {
                stats.hits++;
                existing.ts = t; // Update pour LRU
                if (table && table.indexOf('rpc:') === 0) stats.rpcHits++;
                var sizeKb = Math.round((existing.text ? existing.text.length : 0) / 1024);
                console.log('%c[CACHE SWR-HIT] %c' + table + ' (%c' + sizeKb + ' KB %csauvegardés, revalidation lancée)', 'color: #f59e0b; font-weight: bold;', 'color: inherit;', 'color: #3b82f6; font-weight: bold;', 'color: inherit;');
                revalidateInBackground(input, init, url, key, ttl, table);
                return Promise.resolve(serveFromCache(existing, true));
            }
        }

        stats.misses++;

        var resolveHolder = {};
        var inflightPromise = new Promise(function (resolve, reject) {
            resolveHolder.resolve = resolve;
            resolveHolder.reject = reject;
        });

        cache.set(key, { state: 'inflight', promise: inflightPromise, table: table, ts: t });

        (function () {
            NATIVE_FETCH(input, init).then(function (response) {
                if (!response.ok) {
                    cache.delete(key);
                    resolveHolder.resolve(response);
                    return;
                }
                var clone = response.clone();
                clone.text().then(function (text) {
                    if (text.length > MAX_RAM_ENTRY_SIZE) {
                        stats.oomBlocked++;
                        cache.delete(key);
                        resolveHolder.resolve(response);
                        return;
                    }

                    var hdrs = {};
                    response.headers.forEach(function (v, k) { hdrs[k] = v; });
                    var entry = {
                        state: 'fresh',
                        text: text,
                        headers: hdrs,
                        status: response.status,
                        table: table,
                        expiry: Date.now() + ttl,
                        ts: Date.now()
                    };
                    cache.set(key, entry);
                    idbPut(key, entry);
                    evictRAMIfNeeded();
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

    // --- INTERCEPTION FETCH SUPABASE ---
    function supabaseFetch(input, init) {
        var url = (typeof input === 'string') ? input : ((input && input.url) || '');

        if (url.indexOf(URL_MARKER) < 0) {
            stats.bypassed++;
            return NATIVE_FETCH(input, init);
        }

        return warmPromise.then(function () {
            var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();

            if (method === 'GET' || method === 'HEAD') {
                return cachedGet(input, init, url);
            }

            var table = extractTable(url);

            // RPC POST de lecture (préfixés par get_*)
            if (method === 'POST' && isRpcCacheable(table)) {
                return cachedGet(input, init, url, buildRpcKey(url, init));
            }

            // Mutations : invalider le cache et passer à travers
            var cascade = INVALIDATION_CASCADE[table] || (table ? [table] : []);
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
        });
    }

    function setHas(arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === value) return true;
        }
        return false;
    }

    window.fetch = supabaseFetch;

    // --- API PUBLIQUE POUR DIAGNOSTIC ET ADMINISTRATION ---
    window.SUPABASE_CACHE = {
        enabled: true,
        clear: function () {
            cache.clear();
            stats.hits = stats.misses = stats.coalesced = stats.invalidated = stats.bypassed = stats.rpcHits = stats.oomBlocked = 0;
            if (idb) {
                try {
                    var tx = idb.transaction(IDB_STORE, 'readwrite');
                    tx.objectStore(IDB_STORE).clear();
                } catch (e) {}
            }
            console.log('[CACHE] Tout le cache a été vidé.');
        },
        stats: function () {
            var total = stats.hits + stats.misses;
            var ramBytes = getCacheMemorySize();
            return {
                hits: stats.hits,
                misses: stats.misses,
                coalesced: stats.coalesced,
                invalidated: stats.invalidated,
                bypassed: stats.bypassed,
                rpcHits: stats.rpcHits,
                oomBlocked: stats.oomBlocked,
                hitRate: total ? Math.round((stats.hits / total) * 100) : 0,
                entries: cache.size,
                ramUsage: (ramBytes / 1024 / 1024).toFixed(2) + ' MB'
            };
        },
        showStats: function () {
            var s = this.stats();
            console.table(s);
        },
        invalidate: function (table) {
            invalidateTables(INVALIDATION_CASCADE[table] || [table]);
            console.log('[CACHE] Table invalidée:', table);
        }
    };

    console.log('🚀 Supabase Cache Layer (Anti-Egress & Anti-OOM v6) activé — SUPABASE_CACHE.showStats()');
})();
