/**
 * ADMIN ENTER NAVIGATION DISABLED
 *
 * The original app.js already owns Enter navigation and article selection.
 * This file is intentionally a no-op to avoid interfering with native behavior.
 */
(function () {
  'use strict';

  window.ADMIN_ENTER_NAVIGATION = {
    enabled: false,
    mode: 'disabled-native-app-js-only',
    reason: 'Original app.js Enter navigation must stay untouched.'
  };

  console.log('ℹ️ Admin Enter Navigation custom script disabled, native app.js logic only');
})();
