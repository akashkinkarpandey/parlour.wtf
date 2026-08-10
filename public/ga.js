// Google Analytics 4 init, deliberately deferred until *after* LCP.
//
// The old version was loaded synchronously from Layout.astro's <head>
// as an async gtag.js script — which sounds cheap, but on mobile it
// meaningfully delayed the hero image (LCP) by competing for main
// thread and connection budget. Since GA has no user-visible role on
// this page, we push its bootstrap into requestIdleCallback (or a
// setTimeout fallback) so it always runs after the first paint.
//
// Kept as a static file rather than inline <script> so the strict CSP
// (script-src, no 'unsafe-inline') still applies. Measurement ID must
// match site.gaId in src/config/site.ts.
(function () {
  var GA_ID = 'G-0C9JYKP0XH';
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  function bootGA() {
    if (window.__gaBooted) return;
    window.__gaBooted = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { transport_type: 'beacon' });
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(bootGA, { timeout: 4000 });
    } else {
      setTimeout(bootGA, 2500);
    }
  }

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
})();
