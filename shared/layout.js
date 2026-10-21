/* Shared site chrome. Edit here once; every page picks it up.
   Usage: <script src="/shared/layout.js"></script> in <head>,
          <site-header></site-header> and <site-footer></site-footer> in <body>. */
(function () {
  var BRAND = 'Sunnyside Goods';
  var LINKS = [
    ['Terms', '/terms/'],
    ['Privacy', '/privacy/'],
    ['Refunds', '/refunds/'],
    ['Shipping', '/shipping/'],
    ['Contact', '/contact/']
  ];

  var css = document.createElement('style');
  css.textContent =
    'site-header,site-footer{display:block;font-family:"Figtree",sans-serif;color:#2B2420;}' +
    'site-header .sg-in,site-footer .sg-in{max-width:1180px;margin:0 auto;padding:0 20px;box-sizing:border-box;}' +
    '@media(min-width:769px){site-header .sg-in,site-footer .sg-in{padding:0 48px;}}' +
    'site-header .sg-in{display:flex;align-items:center;justify-content:space-between;padding-top:18px;padding-bottom:18px;}' +
    'site-header a.sg-brand{display:flex;align-items:center;gap:10px;font-family:"Fraunces",serif;font-weight:700;font-size:20px;color:#2B2420;text-decoration:none;}' +
    'site-header nav a{font-size:14px;font-weight:600;color:#6B6354;text-decoration:none;margin-left:20px;}' +
    'site-header nav a:hover,site-footer a:hover{color:#2B2420;}' +
    'site-footer{border-top:1px solid #E5DCC9;margin-top:48px;}' +
    'site-footer .sg-in{display:flex;flex-wrap:wrap;gap:10px 24px;justify-content:space-between;align-items:center;padding-top:28px;padding-bottom:36px;font-size:13px;color:#6B6354;}' +
    'site-footer .sg-links{display:flex;flex-wrap:wrap;gap:8px 20px;}' +
    'site-footer a{color:#6B6354;text-decoration:none;}';
  document.head.appendChild(css);

  var sun = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="5" fill="#E8754A"/><g stroke="#E8754A" stroke-width="2" stroke-linecap="round">' +
    '<path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></g></svg>';

  customElements.define('site-header', class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = '<div class="sg-in"><a class="sg-brand" href="/">' + sun + BRAND + '</a>' +
        '<nav aria-label="Main"><a href="/">Shop</a><a href="/contact/">Contact</a></nav></div>';
    }
  });

  customElements.define('site-footer', class extends HTMLElement {
    connectedCallback() {
      var links = LINKS.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + '</a>'; }).join('');
      this.innerHTML = '<div class="sg-in"><span>© ' + new Date().getFullYear() + ' ' + BRAND + '</span>' +
        '<span class="sg-links">' + links + '<a href="#" id="sg-cookie-link">Cookie settings</a></span></div>';
      var c = this.querySelector('#sg-cookie-link');
      c.addEventListener('click', function (e) { e.preventDefault(); if (window.sgCookieSettings) window.sgCookieSettings(); });
    }
  });
})();
