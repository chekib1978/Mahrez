/**
 * SUPABASE CACHE LAYER - React/Vite Version
 * À inclure dans index.html AVANT les scripts Vite
 */

(function() {
  'use strict';

  const CACHE_CONFIG = {
    TTL: {
      products: 6 * 60 * 60 * 1000,      // 6h - catalogue lourd, invalidé aux écritures
      web_categories: 24 * 60 * 60 * 1000, // 24h - structure fixe
      web_orders: 30 * 1000,             // 30s - client veut voir son statut
      web_order_items: 30 * 1000,        // 30s - lié aux commandes
      company_settings: 60 * 60 * 1000,  // 1h - paramètres quasi statiques
      web_product_reviews: 30 * 60 * 1000, // 30 min - avis rarement modifiés
      DEFAULT: 5 * 60 * 1000             // 5 min par défaut
    },
    MAX_ENTRIES: 300,
    DEBUG: false
  };

  const cache = new Map();
  const inFlight = new Map();
  const stats = { hits: 0, misses: 0, deduped: 0, bytesSaved: 0, bytesServed: 0 };

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

  function getCacheKey(url, options) {
    var normalized = typeof url === 'string' ? sortUrlParams(url) : url;
    var payload = options?.body || '';
    var raw = (options?.method || 'GET') + ':' + normalized + ':' + payload;
    return raw.length > 120 ? stableHash(raw) : raw;
  }

  function extractTable(url) {
    const match = url.match(/rest\/v1\/([^?]+)/);
    return match ? match[1].replace(/^rpc\//, '').split('?')[0] : null;
  }

  function getTTL(url) {
    const table = extractTable(url);
    if (!table) return CACHE_CONFIG.TTL.DEFAULT;
    
    for (const [key, ttl] of Object.entries(CACHE_CONFIG.TTL)) {
      if (table.includes(key) || key.includes(table)) return ttl;
    }
    return CACHE_CONFIG.TTL.DEFAULT;
  }

  function shouldCache(url, options) {
    return (options?.method || 'GET') === 'GET';
  }

  function estimateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  function isSupabaseRequest(url) {
    return typeof url === 'string' && (
      url.includes('supabase.co') ||
      url.includes('/rest/v1/')
    );
  }

  const originalFetch = window.fetch;
  
  window.fetch = async function(url, options = {}) {
    const method = options?.method || 'GET';
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!isSupabaseRequest(url)) {
      return originalFetch(url, options);
    }

    if (!isMutation && shouldCache(url, options)) {
      const key = getCacheKey(url, options);
      const now = Date.now();
      const cached = cache.get(key);

      if (cached && (now - cached.timestamp) < cached.ttl) {
        stats.hits++;
        stats.bytesSaved += estimateSize(cached.data);
        if (CACHE_CONFIG.DEBUG) console.log(`[CACHE HIT] ${extractTable(url)}`);
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
      }

      stats.misses++;

      const pending = inFlight.get(key);
      if (pending) {
        stats.deduped++;
        if (CACHE_CONFIG.DEBUG) console.log(`[DEDUP] ${extractTable(url)}`);
        return pending.then((res) => res.clone());
      }

      const promise = (async () => {
        try {
          const response = await originalFetch(url, options);
          const cloned = response.clone();

          if (response.ok) {
            const data = await cloned.json();
            stats.bytesServed += estimateSize(data);
            cache.set(key, { data, timestamp: now, ttl: getTTL(url) });

            if (cache.size > CACHE_CONFIG.MAX_ENTRIES) {
              const entries = Array.from(cache.entries());
              entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
              const toDelete = Math.floor(entries.length * 0.2);
              for (let i = 0; i < toDelete; i++) cache.delete(entries[i][0]);
            }
            if (CACHE_CONFIG.DEBUG) console.log(`[CACHE MISS] ${extractTable(url)}`);
          }
          return response;
        } catch (error) {
          console.error('[CACHE] Error:', error);
          throw error;
        } finally {
          inFlight.delete(key);
        }
      })();

      inFlight.set(key, promise);
      return promise;
    }

    const response = await originalFetch(url, options);

    if (isMutation && response.ok) {
      const table = extractTable(url);
      if (table) {
        let deleted = 0;
        for (const [key] of cache.entries()) {
          if (key.includes(table)) { cache.delete(key); deleted++; }
        }
        if (CACHE_CONFIG.DEBUG && deleted > 0) {
          console.log(`[CACHE] Invalidated ${deleted} entries for ${table}`);
        }
      }
    }

    return response;
  };

  window.SUPABASE_CACHE = {
    clear: () => {
      cache.clear();
      console.log('[CACHE] Cleared');
    },
    invalidate: (table) => {
      let deleted = 0;
      for (const [key] of cache.entries()) {
        if (key.includes(table)) {
          cache.delete(key);
          deleted++;
        }
      }
      console.log(`[CACHE] Invalidated ${deleted} entries for ${table}`);
    },
    getStats: () => {
      const total = stats.hits + stats.misses;
      const hitRate = total > 0 ? (stats.hits / total * 100).toFixed(1) : 0;
      return {
        entries: cache.size,
        hits: stats.hits,
        misses: stats.misses,
        deduped: stats.deduped,
        hitRate: hitRate + '%',
        bytesSaved: (stats.bytesSaved / 1024 / 1024).toFixed(2) + ' MB',
        bytesServed: (stats.bytesServed / 1024 / 1024).toFixed(2) + ' MB'
      };
    },
    showStats: function() {
      console.table(this.getStats());
    },
    setDebug: (enabled) => {
      CACHE_CONFIG.DEBUG = enabled;
    }
  };

  console.log('✅ Supabase Cache (React) activated');

})();
