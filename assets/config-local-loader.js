(function () {
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
    var s = document.createElement('script');
    s.src = 'config.local.js';
    s.async = false;
    document.currentScript.parentNode.insertBefore(s, document.currentScript.nextSibling);
  }
})();
