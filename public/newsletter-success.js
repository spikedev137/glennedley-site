/* Only a verified Mailchimp success response may leave this page. */
(function () {
  'use strict';
  var form = document.getElementById('mc-embedded-subscribe-form');
  var error = document.getElementById('mce-error-response');
  var fallback = document.getElementById('newsletter-native-fallback');
  if (!form || !window.mc || !window.mc.ajaxOptions || typeof window.mc.mce_success_cb !== 'function') return;
  var original = window.mc.mce_success_cb;
  function failed(message) {
    if (error) { error.textContent = message; error.style.display = 'block'; }
    if (fallback) fallback.hidden = false;
  }
  function response(resp) {
    if (!resp || (resp.result !== 'success' && resp.result !== 'error') || typeof resp.msg !== 'string') {
      failed('We could not confirm your signup. Please try again or continue using Mailchimp’s form.');
      return;
    }
    original.apply(this, arguments);
    if (resp.result === 'success') window.location.assign('/thank-you/');
  }
  window.mc.mce_success_cb = response;
  window.mc.ajaxOptions.success = response;
  window.mc.ajaxOptions.timeout = 20000;
  var originalError = window.mc.ajaxOptions.error;
  window.mc.ajaxOptions.error = function () {
    if (typeof originalError === 'function') originalError.apply(this, arguments);
    failed('We could not confirm your signup because the connection failed. Please try again or continue using Mailchimp’s form.');
  };
  if (fallback) fallback.addEventListener('click', function () {
    if (form.reportValidity()) HTMLFormElement.prototype.submit.call(form);
  });
}());
