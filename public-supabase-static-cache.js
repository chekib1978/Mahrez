/**
 * PUBLIC SUPABASE STATIC CACHE v2
 *
 * Stops public visitors from hitting Supabase for heavy read-only storefront data.
 * Serve /static-data/products.json and /static-data/web_categories.json from the web server/CDN.
 */
(function () {
  'use strict';

  if (window.__PUBLIC_SUPABASE_STATIC_CACHE__) return;
  window.__PUBLIC_SUPABASE_STATIC_CACHE__ = true;

  var nativeFetch = window.fetch.bind(window);
  var REST_MARKER = '/rest/v1/';
  var STATIC_DIR = '/static-data/';
  var MANIFEST_URL = STATIC_DIR + 'manifest.json';
  var TABLES = { products: true, web_categories: true };
  var memory = new Map();
  var manifestPromise = null;
  var stats = { hits: 0, misses: 0, bypassed: 0, fallback: 0 };

  function getUrl(input) {
    return typeof input === 'string' ? input : (input && input.url) || '';
  }

  function getMethod(input, init) {
    return ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
  }

  function readHeader(headers, name) {
    if (!headers) return '';
    if (typeof headers.get === 'function') return headers.get(name) || '';
    return headers[name] || headers[name.toLowerCase()] || '';
  }

  function extractTable(url) {
    var idx = url.indexOf(REST_MARKER);
    if (idx < 0) return '';
    var tail = url.slice(idx + REST_MARKER.length);
    var path = tail.split('?')[0];
    if (!path || path.indexOf('rpc/') === 0) return '';
    return decodeURIComponent(path.split('/')[0] || '');
  }

  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = nativeFetch(MANIFEST_URL, { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; });
    }
    return manifestPromise;
  }

  function staticUrl(table, manifest) {
    var version = (manifest && manifest.version) || 'dev';
    return STATIC_DIR + table + '.json?v=' + encodeURIComponent(version);
  }

  function loadTable(table) {
    if (memory.has(table)) return Promise.resolve(memory.get(table));
    stats.misses++;
    return loadManifest().then(function (manifest) {
      return nativeFetch(staticUrl(table, manifest), { cache: 'force-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('static data missing: ' + table);
          return r.json();
        })
        .then(function (rows) {
          if (!Array.isArray(rows)) rows = [];
          memory.set(table, rows);
          return rows;
        });
    });
  }

  function parseParams(url) {
    var query = url.split('?')[1] || '';
    return new URLSearchParams(query);
  }

  function normalizeValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value !== '' && !isNaN(value)) return Number(value);
    return value;
  }

  function compare(rowValue, operator, rawValue) {
    var value = normalizeValue(String(rawValue).replace(/^"|"$/g, ''));
    if (operator === 'eq') return rowValue === value || String(rowValue) === String(value);
    if (operator === 'neq') return !(rowValue === value || String(rowValue) === String(value));
    if (operator === 'gt') return Number(rowValue) > Number(value);
    if (operator === 'gte') return Number(rowValue) >= Number(value);
    if (operator === 'lt') return Number(rowValue) < Number(value);
    if (operator === 'lte') return Number(rowValue) <= Number(value);
    if (operator === 'is') return value === null ? rowValue == null : rowValue === value;
    if (operator === 'in') {
      var list = String(rawValue).replace(/^\(|\)$/g, '').split(',').map(function (x) { return String(normalizeValue(x.trim())); });
      return list.indexOf(String(rowValue)) >= 0;
    }
    if (operator === 'like' || operator === 'ilike') {
      var pattern = String(rawValue).replace(/%|\*/g, '').toLowerCase();
      return String(rowValue || '').toLowerCase().indexOf(pattern) >= 0;
    }
    return true;
  }

  function applyFilterExpression(row, expression) {
    // Supports common Supabase OR format: designation.ilike.*term*,product_brand.ilike.*term*
    return expression.split(',').some(function (part) {
      var pieces = part.split('.');
      if (pieces.length < 3) return true;
      var field = pieces.shift();
      var operator = pieces.shift();
      var rawValue = pieces.join('.');
      return compare(row ? row[field] : undefined, operator, rawValue);
    });
  }

  function applySupabaseQuery(rows, params, rangeHeader) {
    var result = rows.slice();
    var reserved = { select: true, order: true, limit: true, offset: true, or: true };

    params.forEach(function (value, key) {
      if (reserved[key]) return;
      var dot = value.indexOf('.');
      if (dot < 0) return;
      var operator = value.slice(0, dot);
      var rawValue = value.slice(dot + 1);
      result = result.filter(function (row) {
        return compare(row ? row[key] : undefined, operator, rawValue);
      });
    });

    var orValue = params.get('or');
    if (orValue) {
      orValue = orValue.replace(/^\(|\)$/g, '');
      result = result.filter(function (row) { return applyFilterExpression(row, orValue); });
    }

    var order = params.get('order');
    if (order) {
      order.split(',').reverse().forEach(function (orderPart) {
        var orderPieces = orderPart.split('.');
        var field = orderPieces[0];
        var direction = (orderPieces[1] || 'asc').toLowerCase();
        result.sort(function (a, b) {
          var av = a ? a[field] : undefined;
          var bv = b ? b[field] : undefined;
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return direction === 'desc' ? 1 : -1;
          if (av > bv) return direction === 'desc' ? -1 : 1;
          return 0;
        });
      });
    }

    var totalBeforeSlice = result.length;
    var offset = Number(params.get('offset') || 0);
    var limit = params.get('limit');

    if (rangeHeader && /^\d+-\d+$/.test(rangeHeader)) {
      var parts = rangeHeader.split('-').map(Number);
      offset = parts[0];
      limit = String(parts[1] - parts[0] + 1);
    }

    if (offset || limit) {
      var end = limit ? offset + Number(limit) : undefined;
      result = result.slice(offset, end);
    }

    return { rows: result, total: totalBeforeSlice, from: offset, to: offset + result.length - 1 };
  }

  function staticFetch(input, init) {
    var url = getUrl(input);
    var method = getMethod(input, init);

    if (method !== 'GET' || url.indexOf(REST_MARKER) < 0) {
      stats.bypassed++;
      return nativeFetch(input, init);
    }

    var table = extractTable(url);
    if (!TABLES[table]) {
      stats.bypassed++;
      return nativeFetch(input, init);
    }

    var headers = (init && init.headers) || (input && input.headers) || {};
    var rangeHeader = readHeader(headers, 'Range');

    return loadTable(table)
      .then(function (rows) {
        var result = applySupabaseQuery(rows, parseParams(url), rangeHeader);
        stats.hits++;
        return new Response(JSON.stringify(result.rows), {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'content-range': result.from + '-' + result.to + '/' + result.total,
            'x-static-supabase-cache': 'HIT',
            'x-static-supabase-table': table
          }
        });
      })
      .catch(function () {
        stats.fallback++;
        return nativeFetch(input, init);
      });
  }

  window.fetch = staticFetch;
  window.STATIC_SUPABASE_CACHE = {
    enabled: true,
    clear: function () { memory.clear(); manifestPromise = null; },
    stats: function () { return Object.assign({ entries: memory.size }, stats); },
    showStats: function () { console.table(this.stats()); }
  };

  console.log('✅ Public Supabase Static Cache actif, produits/catégories sans egress navigateur');
})();
