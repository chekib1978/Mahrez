/**
 * ADMIN ENTER NAVIGATION - NON INVASIVE FALLBACK
 *
 * Important:
 * - Does NOT replace the original app.js Enter logic.
 * - Registers after app.js has had time to attach its own handlers.
 * - If the native app logic handles Enter, this script stays out of the way.
 * - Only fallback behavior: if Enter was not handled, move to next field.
 *
 * No business logic changes: no calculations, sales, purchases, stock, or Supabase writes are changed here.
 */
(function () {
  'use strict';

  if (window.__ADMIN_ENTER_NAVIGATION__) return;
  window.__ADMIN_ENTER_NAVIGATION__ = true;

  var FIELD_SELECTOR = [
    'input:not([type="hidden"]):not([disabled]):not([readonly])',
    'select:not([disabled])',
    'textarea:not([disabled]):not([readonly])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])'
  ].join(',');

  function isVisible(el) {
    if (!el) return false;
    var rect = el.getBoundingClientRect();
    var style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  }

  function isTextAreaMultiline(el) {
    return el && el.tagName === 'TEXTAREA' && !el.dataset.enterNext;
  }

  function closestModuleRoot(el) {
    return el.closest('.module-content, .modal, .content, main, form, body') || document;
  }

  function getFocusableElements(root) {
    var scope = root || document;
    return Array.from(scope.querySelectorAll(FIELD_SELECTOR)).filter(function (el) {
      return isVisible(el) && el.tabIndex !== -1;
    });
  }

  function moveToNextField(current) {
    var root = closestModuleRoot(current);
    var fields = getFocusableElements(root);
    var index = fields.indexOf(current);

    if (index < 0) fields = getFocusableElements(document);
    index = fields.indexOf(current);
    if (index < 0 || fields.length === 0) return false;

    var next = fields[(index + 1) % fields.length];
    if (!next || next === current) return false;

    next.focus({ preventScroll: false });
    if (typeof next.select === 'function' && /^(INPUT|TEXTAREA)$/.test(next.tagName)) {
      try { next.select(); } catch (_e) {}
    }
    return true;
  }

  function installFallbackHandler() {
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      var target = event.target;
      if (!target || !target.matches || !target.matches(FIELD_SELECTOR)) return;
      if (target.tagName === 'BUTTON') return;
      if (isTextAreaMultiline(target)) return;

      // Let app.js native handlers run first. This fallback runs after the event cycle.
      setTimeout(function () {
        // If app.js selected an article or moved focus, do nothing.
        if (document.activeElement !== target) return;
        if (event.defaultPrevented) return;

        if (moveToNextField(target)) {
          // No stopPropagation here. Native app logic always wins.
        }
      }, 0);
    }, false);

    window.ADMIN_ENTER_NAVIGATION = {
      enabled: true,
      mode: 'non-invasive-fallback',
      focusables: function () { return getFocusableElements(closestModuleRoot(document.activeElement)).length; }
    };

    console.log('✅ Admin Enter Navigation fallback actif, logique native conservée');
  }

  // Script is loaded before app.js, so delay registration to avoid stealing priority
  // from the original keyboard logic in app.js.
  setTimeout(installFallbackHandler, 50);
})();
