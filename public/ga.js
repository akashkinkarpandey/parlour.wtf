// Google Analytics 4 init. Kept as a real static file (not an inline
// <script> in Layout.astro) so it loads via <script src> and doesn't get
// bundled back into the HTML as inline JS -- see the CSP note in Layout.astro.
// Measurement ID must match site.gaId in src/config/site.ts.
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-0C9JYKP0XH');
