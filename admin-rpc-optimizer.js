/**
 * ADMIN RPC OPTIMIZER - SAFE MODE
 *
 * Converts selected heavy backoffice REST reads into slim RPC calls.
 * Safety rules:
 * - Products/customers are only optimized when the original request already has limit/range.
 * - This avoids returning thousands of rows repeatedly and causing browser OOM.
 * - If anything fails, it falls back to the original REST request.
 */
(function () {
  'use strict';

  if (window.__ADMIN_RPC_OPTIMIZER__) return;
  window.__ADMIN_RPC_OPTIMIZER__ = true;

  var previousFetch = window.fetch.bind(window);
  var REST_MARKER = '/rest/v1/';
  var DEFAULT_LIMIT = 200;
  var MAX_LIMIT = 500;
  var stats = { rpc: 0, fallback: 0, bypassed: 0, skippedNoLimit: 0 };

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

  function parseParams(url) {
    return new URLSearchParams(url.split('?')[1] || '');
  }

  function cloneHeaders(headers) {
    var out = {};
    if (!headers) return out;
    if (typeof headers.forEach === 'function') {
      headers.forEach(function (value, key) { out[key] = value; });
      return out;
    }
    for (var key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key)) out[key] = headers[key];
    }
    return out;
  }

  function buildRpcUrl(url, fnName) {
    return url.slice(0, url.indexOf(REST_MARKER) + REST_MARKER.length) + 'rpc/' + fnName;
  }

  function getLimit(params, headers, fallback) {
    var range = readHeader(headers, 'Range');
    if (range && /^\d+-\d+$/.test(range)) {
      var parts = range.split('-').map(Number);
      return Math.min(Math.max(parts[1] - parts[0] + 1, 1), MAX_LIMIT);
    }
    var value = Number(params.get('limit') || fallback || DEFAULT_LIMIT);
    if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT;
    return Math.min(value, MAX_LIMIT);
  }

  function getOffset(params, headers) {
    var range = readHeader(headers, 'Range');
    if (range && /^\d+-\d+$/.test(range)) return Number(range.split('-')[0]) || 0;
    var value = Number(params.get('offset') || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function hasExplicitPaging(params, headers) {
    return params.has('limit') || Boolean(readHeader(headers, 'Range'));
  }

  function canOptimize(params) {
    var allowed = { select: true, order: true, limit: true, offset: true };
    var ok = true;
    params.forEach(function (_value, key) {
      if (!allowed[key]) ok = false;
    });
    return ok;
  }

  function planFor(url, headers) {
    var table = extractTable(url);
    var params = parseParams(url);
    if (!canOptimize(params)) return null;

    // Big master data tables can OOM if the app repeatedly asks for full lists.
    // Optimize them only when the caller already requested a page/limit.
    if ((table === 'products' || table === 'customers') && !hasExplicitPaging(params, headers)) {
      stats.skippedNoLimit++;
      return null;
    }

    if (table === 'products') {
      return { fn: 'get_admin_products_light', body: { p_search: '', p_limit: getLimit(params, headers, DEFAULT_LIMIT), p_offset: getOffset(params, headers) } };
    }

    if (table === 'customers') {
      return { fn: 'get_admin_customers_light', body: { p_search: '', p_limit: getLimit(params, headers, DEFAULT_LIMIT), p_offset: getOffset(params, headers) } };
    }

    if (table === 'fridge_sales') {
      return { fn: 'get_admin_fridge_sales_recent', body: { p_limit: getLimit(params, headers, 300) } };
    }

    if (table === 'customer_payments') {
      return { fn: 'get_admin_customer_payments_recent', body: { p_limit: getLimit(params, headers, 300) } };
    }

    return null;
  }

  function fetchWithRpc(input, init) {
    var url = getUrl(input);
    var method = getMethod(input, init);

    if (method !== 'GET' || url.indexOf(REST_MARKER) < 0) {
      stats.bypassed++;
      return previousFetch(input, init);
    }

    var originalHeaders = (init && init.headers) || (input && input.headers) || {};
    var plan = planFor(url, originalHeaders);
    if (!plan) {
      stats.bypassed++;
      return previousFetch(input, init);
    }

    var headers = cloneHeaders(originalHeaders);
    headers['content-type'] = 'application/json';

    return previousFetch(buildRpcUrl(url, plan.fn), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(plan.body)
    }).then(function (response) {
      if (!response.ok) {
        stats.fallback++;
        return previousFetch(input, init);
      }
      stats.rpc++;
      return response;
    }).catch(function () {
      stats.fallback++;
      return previousFetch(input, init);
    });
  }

  window.fetch = fetchWithRpc;
  window.ADMIN_RPC_OPTIMIZER = {
    enabled: true,
    stats: function () { return Object.assign({}, stats); },
    showStats: function () { console.table(this.stats()); }
  };

  console.log('✅ Admin RPC Optimizer SAFE MODE actif');
})();
