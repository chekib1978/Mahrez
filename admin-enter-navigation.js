/**
 * ADMIN ENTER NAVIGATION
 *
 * Restores the old POS-style workflow:
 * - Enter validates the currently visible article/result dropdown row.
 * - If no dropdown is open, Enter moves to the next useful field.
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

  var RESULT_CONTAINER_SELECTOR = [
    '[id*="suggest" i]', '[class*="suggest" i]',
    '[id*="autocomplete" i]', '[class*="autocomplete" i]',
    '[id*="dropdown" i]', '[class*="dropdown" i]',
    '[id*="result" i]', '[class*="result" i]',
    '[id*="search" i]', '[class*="search" i]',
    '[id*="article" i]', '[class*="article" i]',
    '[id*="product" i]', '[class*="product" i]'
  ].join(',');

  var RESULT_ITEM_SELECTOR = [
    '[role="option"]',
    '[data-product-id]', '[data-article-id]', '[data-id]',
    '[onclick]',
    '.active', '.highlighted', '.selected',
    'li', 'tr', '.row', '.item', 'button', 'a'
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

  function getFocusableElements(root) {
    var scope = root || document;
    return Array.from(scope.querySelectorAll(FIELD_SELECTOR)).filter(function (el) {
      return isVisible(el) && el.tabIndex !== -1;
    });
  }

  function closestModuleRoot(el) {
    return el.closest('.module-content, .modal, .content, main, form, body') || document;
  }

  function scoreDistance(a, b) {
    var ar = a.getBoundingClientRect();
    var br = b.getBoundingClientRect();
    return Math.abs(ar.left - br.left) + Math.abs(ar.top - br.top);
  }

  function isLikelyResultContainer(container, input) {
    if (!container || !isVisible(container)) return false;
    if (container === document.body || container === document.documentElement) return false;

    var rect = container.getBoundingClientRect();
    var inputRect = input.getBoundingClientRect();
    var nearInput = rect.top >= inputRect.top - 20 && rect.top <= inputRect.bottom + 500;
    var hasItems = container.querySelector(RESULT_ITEM_SELECTOR);
    return nearInput && hasItems;
  }

  function getResultItems(container) {
    return Array.from(container.querySelectorAll(RESULT_ITEM_SELECTOR)).filter(function (el) {
      if (!isVisible(el)) return false;
      if (el.matches('input, select, textarea')) return false;
      if (el.closest('thead')) return false;
      return true;
    });
  }

  function pickBestItem(items) {
    if (!items.length) return null;
    var active = items.find(function (el) {
      return el.matches('.active, .highlighted, .selected, [aria-selected="true"], [data-active="true"]');
    });
    return active || items[0];
  }

  function clickItem(item) {
    if (!item) return false;
    item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    item.click();
    item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    return true;
  }

  function validateVisibleResultForInput(input) {
    var root = closestModuleRoot(input);
    var containers = Array.from(root.querySelectorAll(RESULT_CONTAINER_SELECTOR))
      .filter(function (container) { return isLikelyResultContainer(container, input); })
      .sort(function (a, b) { return scoreDistance(a, input) - scoreDistance(b, input); });

    for (var i = 0; i < containers.length; i++) {
      var item = pickBestItem(getResultItems(containers[i]));
      if (clickItem(item)) return true;
    }

    // Fallback for simple tables/lists displayed under article search fields.
    var inputName = String(input.id || input.name || input.placeholder || '').toLowerCase();
    var looksLikeArticleSearch = /article|produit|product|code|barre|designation|désignation|rechercher|search/.test(inputName);
    if (!looksLikeArticleSearch) return false;

    var fallbackItems = Array.from(root.querySelectorAll('tbody tr, [onclick], [data-product-id], [data-article-id]'))
      .filter(function (el) {
        if (!isVisible(el)) return false;
        var rect = el.getBoundingClientRect();
        var inputRect = input.getBoundingClientRect();
        return rect.top >= inputRect.bottom - 10 && rect.top <= inputRect.bottom + 600;
      })
      .sort(function (a, b) { return scoreDistance(a, input) - scoreDistance(b, input); });

    return clickItem(pickBestItem(fallbackItems));
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
    if (!target || !target.matches || !target.matches(FIELD_SELECTOR)) return;
    if (isTextAreaMultiline(target)) return;

    if (validateVisibleResultForInput(target)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (target.tagName === 'BUTTON') return;

    if (moveToNextField(target)) {
      event.preventDefault();
    }
  }, true);

  window.ADMIN_ENTER_NAVIGATION = {
    enabled: true,
    focusables: function () { return getFocusableElements(closestModuleRoot(document.activeElement)).length; },
    testValidateResult: function () { return validateVisibleResultForInput(document.activeElement); }
  };

  console.log('✅ Admin Enter Navigation actif, Entrée valide les listes articles puis passe au champ suivant');
})();
