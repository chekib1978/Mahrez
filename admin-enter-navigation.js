/**
 * ADMIN ENTER NAVIGATION
 *
 * Restores the old POS-style workflow: Enter moves to the next useful field.
 * It does not change business logic, calculations, sales, purchases, stock, or Supabase data.
 */
(function () {
  'use strict';

  if (window.__ADMIN_ENTER_NAVIGATION__) return;
  window.__ADMIN_ENTER_NAVIGATION__ = true;

  var SELECTOR = [
    'input:not([type="hidden"]):not([disabled]):not([readonly])',
    'select:not([disabled])',
    'textarea:not([disabled]):not([readonly])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])'
  ].join(',');

  function isVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    var style = getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }

  function isTextAreaMultiline(el) {
    return el && el.tagName === 'TEXTAREA' && !el.dataset.enterNext;
  }

  function getFocusableElements(root) {
    var scope = root || document;
    return Array.from(scope.querySelectorAll(SELECTOR)).filter(function (el) {
      return isVisible(el) && el.tabIndex !== -1;
    });
  }

  function closestModuleRoot(el) {
    return el.closest('.module-content, .modal, .content, main, form') || document;
  }

  function clickActiveSuggestion() {
    var candidates = [
      '.suggestion.active',
      '.suggestion.highlighted',
      '.autocomplete-item.active',
      '.autocomplete-item.highlighted',
      '.search-result.active',
      '.search-result.highlighted',
      '[data-active="true"]'
    ];

    for (var i = 0; i < candidates.length; i++) {
      var el = document.querySelector(candidates[i]);
      if (el && isVisible(el)) {
        el.click();
        return true;
      }
    }
    return false;
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

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

    var target = event.target;
    if (!target || !target.matches || !target.matches(SELECTOR)) return;
    if (isTextAreaMultiline(target)) return;

    if (clickActiveSuggestion()) {
      event.preventDefault();
      return;
    }

    if (target.tagName === 'BUTTON') return;

    if (moveToNextField(target)) {
      event.preventDefault();
    }
  }, true);

  window.ADMIN_ENTER_NAVIGATION = {
    enabled: true,
    focusables: function () { return getFocusableElements(closestModuleRoot(document.activeElement)).length; }
  };

  console.log('✅ Admin Enter Navigation actif, Entrée passe au champ suivant');
})();
