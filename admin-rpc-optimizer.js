/**
 * ADMIN RPC OPTIMIZER
 *
 * Converts selected heavy backoffice REST reads into slim RPC calls.
 * Load after supabase-cache-layer.js and before app.js.
 * If the RPC SQL is not installed yet, it silently falls back to the original REST request.
 */
(function () {
  'use strict';

  if (window.__ADMIN_RPC_OPTIMIZER__) return;
  window.__ADMIN_RPC_OPTIMIZER__ = true;

  var previousFetch = window.fetch.bind(window);
  var REST_MARKER = '/rest/v1/';
  var stats = { rpc: 0, fallback: 0, bypassed: 0 };

  function getUrl(input) {
    return typeof input === 'string' ? input : (input && input.url) || '';
  }

  function getMethod(input, init) {
    return ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
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

  function getLimit(params, fallback) {
    var value = Number(params.get('limit') || fallback);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return value;
  }

  function getOffset(params) {
    var value = Number(params.get('offset') || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function canOptimize(params) {
    // Only optimize simple list reads. Filtered/detail reads stay untouched.
    var allowed = { select: true, order: true, limit: true, offset: true };
    var ok = true;
    params.forEach(function (_value, key) {
      if (!allowed[key]) ok = false;
    });
    return ok;
  }

  function planFor(url) {
    var table = extractTable(url);
    var params = parseParams(url);
    if (!canOptimize(params)) return null;

    if (table === 'products') {
      return {
        fn: 'get_admin_products_light',
        body: { p_search: '', p_limit: getLimit(params, 2000), p_offset: getOffset(params) }
      };
    }

    if (table === 'customers') {
      return {
        fn: 'get_admin_customers_light',
        body: { p_search: '', p_limit: getLimit(params, 2000), p_offset: getOffset(params) }
      };
    }

    if (table === 'fridge_sales') {
      return {
        fn: 'get_admin_fridge_sales_recent',
        body: { p_limit: getLimit(params, 500) }
      };
    }

    if (table === 'customer_payments') {
      return {
        fn: 'get_admin_customer_payments_recent',
        body: { p_limit: getLimit(params, 500) }
      };
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

    var plan = planFor(url);
    if (!plan) {
      stats.bypassed++;
      return previousFetch(input, init);
    }

    var headers = cloneHeaders((init && init.headers) || (input && input.headers));
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

  console.log('✅ Admin RPC Optimizer actif, grosses lectures redirigées vers RPC slim');
})();
