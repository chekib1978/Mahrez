/**
 * ADMIN LOCAL TODAY DEFAULTS
 *
 * Fixes date defaults when the app shows yesterday because of UTC/timezone handling.
 * Uses the browser LOCAL date, not UTC.
 * Applies only to empty or old default date inputs in sales/purchases/history screens.
 * Does not touch calculations, stock, sales validation, or Supabase writes.
 */
(function () {
  'use strict';

  if (window.__ADMIN_LOCAL_TODAY_DEFAULTS__) return;
  window.__ADMIN_LOCAL_TODAY_DEFAULTS__ = true;

  function localTodayIso() {
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

  function looksLikeAdminDateScreen() {
    var text = String(document.body && document.body.innerText || '').toLowerCase();
    return /vente|achat|historique|journal|état|etat|détail|detail|facture|client|fourn/.test(text);
  }

  function isProbablyOldAutoDefault(value, today) {
    if (!value) return true;
    var inputDate = new Date(value + 'T00:00:00');
    var todayDate = new Date(today + 'T00:00:00');
    var diffDays = Math.round((todayDate - inputDate) / 86400000);
    return diffDays === 1;
  }

  function applyLocalTodayDefaults() {
    if (!looksLikeAdminDateScreen()) return;

    var today = localTodayIso();
    var inputs = Array.from(document.querySelectorAll('input[type="date"]')).filter(isVisible);

    inputs.forEach(function (input) {
      if (input.dataset.userChangedDate === 'true') return;

      if (!input.__localTodayBound) {
        input.addEventListener('input', function () { input.dataset.userChangedDate = 'true'; }, { once: true });
        input.addEventListener('change', function () { input.dataset.userChangedDate = 'true'; }, { once: true });
        input.__localTodayBound = true;
      }

      if (isProbablyOldAutoDefault(input.value, today)) {
        input.value = today;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  document.addEventListener('DOMContentLoaded', applyLocalTodayDefaults);
  document.addEventListener('click', function () { setTimeout(applyLocalTodayDefaults, 100); }, true);

  var observer = new MutationObserver(function () {
    clearTimeout(observer.__timer);
    observer.__timer = setTimeout(applyLocalTodayDefaults, 80);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.ADMIN_LOCAL_TODAY_DEFAULTS = {
    enabled: true,
    today: localTodayIso,
    apply: applyLocalTodayDefaults
  };

  setTimeout(applyLocalTodayDefaults, 100);
  setTimeout(applyLocalTodayDefaults, 500);
  setTimeout(applyLocalTodayDefaults, 1200);

  console.log('✅ Admin Local Today Defaults actif, dates par défaut = date locale du jour');
})();
