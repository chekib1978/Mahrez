/**
 * ADMIN SALES DATE DEFAULTS
 *
 * Sets DU / AU date filters in sales detail screens to today's date by default.
 * Strong mode: detects the visible DU/AU date pair even when the module markup has no stable ids/classes.
 * Does not change sales logic, totals, stock, or Supabase data.
 */
(function () {
  'use strict';

  if (window.__ADMIN_SALES_DATE_DEFAULTS__) return;
  window.__ADMIN_SALES_DATE_DEFAULTS__ = true;

  function todayIso() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function isVisible(el) {
    if (!el) return false;
    var rect = el.getBoundingClientRect();
    var style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  }

  function getVisibleDateInputs() {
    return Array.from(document.querySelectorAll('input[type="date"]')).filter(isVisible);
  }

  function labelNearInput(input) {
    var rect = input.getBoundingClientRect();
    var nodes = Array.from(document.querySelectorAll('label, span, div, b, strong, td, th'));
    var best = '';
    var bestScore = Infinity;

    nodes.forEach(function (node) {
      if (!isVisible(node)) return;
      var text = String(node.textContent || '').trim().toLowerCase();
      if (text !== 'du' && text !== 'au') return;
      var nr = node.getBoundingClientRect();
      var sameLine = Math.abs(nr.top - rect.top) < 25;
      var leftOfInput = nr.left <= rect.left + 5;
      if (!sameLine || !leftOfInput) return;
      var score = Math.abs(nr.right - rect.left) + Math.abs(nr.top - rect.top);
      if (score < bestScore) {
        bestScore = score;
        best = text;
      }
    });

    return best;
  }

  function setDate(input, value) {
    if (!input || input.value === value) return false;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function moduleLooksLikeSalesDetails() {
    var text = String(document.body && document.body.innerText || '').toLowerCase();
    return text.indexOf('facturees') >= 0 ||
      text.indexOf('facturées') >= 0 ||
      text.indexOf('non facturees') >= 0 ||
      text.indexOf('non facturées') >= 0 ||
      text.indexOf('tous clients') >= 0 ||
      text.indexOf('tenir compte hr') >= 0 ||
      text.indexOf('detaillée') >= 0 ||
      text.indexOf('detaillee') >= 0 ||
      text.indexOf('détail') >= 0;
  }

  function applySalesDateDefaults() {
    if (!moduleLooksLikeSalesDetails()) return;

    var today = todayIso();
    var inputs = getVisibleDateInputs();
    if (inputs.length < 2) return;

    var du = null;
    var au = null;

    inputs.forEach(function (input) {
      var label = labelNearInput(input);
      if (label === 'du' && !du) du = input;
      if (label === 'au' && !au) au = input;
    });

    // Fallback: the screenshot/module shows DU then AU as the first two visible date inputs.
    if (!du || !au) {
      inputs.sort(function (a, b) {
        var ar = a.getBoundingClientRect();
        var br = b.getBoundingClientRect();
        return (ar.top - br.top) || (ar.left - br.left);
      });
      du = du || inputs[0];
      au = au || inputs[1];
    }

    var changed = false;
    changed = setDate(du, today) || changed;
    changed = setDate(au, today) || changed;

    if (changed) {
      console.log('[SalesDateDefaults] DU/AU réglés sur', today);
    }
  }

  document.addEventListener('DOMContentLoaded', applySalesDateDefaults);
  document.addEventListener('click', function () { setTimeout(applySalesDateDefaults, 100); }, true);

  var observer = new MutationObserver(function () {
    clearTimeout(observer.__timer);
    observer.__timer = setTimeout(applySalesDateDefaults, 80);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.ADMIN_SALES_DATE_DEFAULTS = {
    enabled: true,
    mode: 'force-du-au-today',
    apply: applySalesDateDefaults,
    today: todayIso
  };

  setTimeout(applySalesDateDefaults, 100);
  setTimeout(applySalesDateDefaults, 500);
  setTimeout(applySalesDateDefaults, 1200);

  console.log('✅ Sales date defaults actif, DU/AU forcés à la date du jour');
})();
