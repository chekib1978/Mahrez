/**
 * ADMIN SALES DATE DEFAULTS
 *
 * Sets DU / AU date filters in sales detail screens to today's date by default.
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

  function isSalesDetailZone(root) {
    var text = String((root && root.innerText) || '').toLowerCase();
    return (
      text.indexOf('détail des ventes') >= 0 ||
      text.indexOf('detail des ventes') >= 0 ||
      text.indexOf('etat des ventes') >= 0 ||
      text.indexOf('état des ventes') >= 0 ||
      text.indexOf('journal des ventes') >= 0
    );
  }

  function markTouched(input) {
    if (!input || input.__salesDateTouched) return;
    input.__salesDateTouched = true;
  }

  function setDateInput(input, value) {
    if (!input || input.__salesDateTouched) return;
    if (input.value === value) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applySalesDateDefaults() {
    var today = todayIso();
    var candidates = Array.from(document.querySelectorAll('input[type="date"]'));

    candidates.forEach(function (input) {
      if (!input.__salesDateEventsBound) {
        input.addEventListener('input', function () { markTouched(input); }, { once: true });
        input.addEventListener('change', function () { markTouched(input); }, { once: true });
        input.__salesDateEventsBound = true;
      }
    });

    var zones = Array.from(document.querySelectorAll('.module-content, .content, .modal, main, form, body'))
      .filter(isSalesDetailZone);

    zones.forEach(function (zone) {
      var dateInputs = Array.from(zone.querySelectorAll('input[type="date"]'));
      if (dateInputs.length < 2) return;

      // In sales detail screens, the first two visible date inputs are DU and AU.
      var visible = dateInputs.filter(function (el) {
        var rect = el.getBoundingClientRect();
        var style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });

      visible.slice(0, 2).forEach(function (input) {
        if (!input.value || input.dataset.forceTodayDefault === 'true') {
          setDateInput(input, today);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', applySalesDateDefaults);
  document.addEventListener('click', function () { setTimeout(applySalesDateDefaults, 150); }, true);

  var observer = new MutationObserver(function () {
    clearTimeout(observer.__timer);
    observer.__timer = setTimeout(applySalesDateDefaults, 100);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.ADMIN_SALES_DATE_DEFAULTS = {
    enabled: true,
    apply: applySalesDateDefaults,
    today: todayIso
  };

  setTimeout(applySalesDateDefaults, 250);
  console.log('✅ Sales date defaults actif, DU/AU = date du jour');
})();
