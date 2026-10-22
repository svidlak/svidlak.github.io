/* Shared analytics. Fill in the IDs below; anything left empty is skipped.
   Usage anywhere: sgTrack('AddToCart', { content_ids: ['sku'], value: 24.99, currency: 'USD' })
   Standard Meta events (ViewContent, AddToCart, InitiateCheckout, Purchase, Lead...) go through
   fbq('track'); anything else goes through fbq('trackCustom'). GA4 gets the matching events. */
(function () {
  var CONFIG = {
    META_PIXEL_ID: '',   // e.g. '1234567890123456'  (Events Manager → Data sources)
    GA4_ID: '',          // e.g. 'G-XXXXXXXXXX'
    CLARITY_ID: ''       // e.g. 'abcd1234ef' (optional: heatmaps / recordings)
  };
  // Banner is shown by browser time zone (no network request, so no speed cost).
  // Covers Israel, the UK, and Europe in general (EU/EEA/CH, plus a few non-EU neighbours, which is harmless).
  // To limit it to UK + Israel only, use: /^(Europe\/(London|Belfast|Jersey|Guernsey|Isle_of_Man)|Asia\/(Jerusalem|Tel_Aviv))$/
  var CONSENT_TZ = /^(Europe\/|Asia\/(Jerusalem|Tel_Aviv)$|Atlantic\/(Azores|Canary|Faroe|Madeira|Reykjavik)$)/;
  var META_STANDARD = { PageView:1, ViewContent:1, AddToCart:1, InitiateCheckout:1, AddPaymentInfo:1, Purchase:1, Lead:1, Search:1 };
  var GA_MAP = { ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase', Lead: 'generate_lead' };

  // Remember campaign parameters for the whole visit
  var utm = {};
  try {
    var q = new URLSearchParams(location.search);
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].forEach(function (k) {
      var v = q.get(k); if (v) { utm[k] = v; sessionStorage.setItem('sg_' + k, v); }
      else { var s = sessionStorage.getItem('sg_' + k); if (s) utm[k] = s; }
    });
  } catch (e) {}

  function load(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }

  var started = false;
  function startTracking() {
    if (started) return; started = true;
    if (CONFIG.META_PIXEL_ID) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', CONFIG.META_PIXEL_ID);
      fbq('track', 'PageView');
    }
    if (CONFIG.GA4_ID) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', CONFIG.GA4_ID);
      load('https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA4_ID);
    }
    if (CONFIG.CLARITY_ID) {
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",CONFIG.CLARITY_ID);
    }

    flush();
  }

  var seen = {};
  var queue = [], decided = false, allowed = false;
  function flush() { var q = queue; queue = []; q.forEach(function (a) { send(a[0], a[1]); }); }
  window.sgTrack = function (name, params, once) {
    params = Object.assign({}, params || {}, utm);
    if (once) { var k = name + JSON.stringify(params.content_ids || ''); if (seen[k]) return; seen[k] = 1; }
    if (!decided) { queue.push([name, params]); return; }   // wait for the consent decision
    if (allowed) send(name, params);
  };
  // Meta params -> GA4 ecommerce params (GA4 wants `items`, not content_ids/contents)
  function toGA(params) {
    var g = Object.assign({}, params);
    var contents = g.contents || (g.content_ids || []).map(function (id) { return { id: id, quantity: g.num_items || 1 }; });
    if (contents.length) {
      g.items = contents.map(function (c) {
        return { item_id: c.id, item_name: c.title || g.content_name || c.id, price: c.item_price, quantity: c.quantity || 1 };
      });
    }
    ['contents', 'content_ids', 'content_type', 'content_name', 'num_items'].forEach(function (k) { delete g[k]; });
    return g;
  }
  function send(name, params) {
    if (window.fbq) {
      if (META_STANDARD[name]) fbq('track', name, params); else fbq('trackCustom', name, params);
    }
    if (window.gtag) gtag('event', GA_MAP[name] || name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(), toGA(params));
    if (!CONFIG.META_PIXEL_ID && !CONFIG.GA4_ID) console.debug('[sgTrack]', name, params);
  }

  // ---- Consent ----
  var KEY = 'sg_consent';
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function decide(ok) {
    decided = true; allowed = ok;
    if (ok) startTracking(); else queue = [];
  }

  function needsConsent() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    return tz === '' || CONSENT_TZ.test(tz);   // unknown time zone: ask (fail safe)
  }

  var css = '#sg-cb{position:fixed;left:12px;right:12px;bottom:12px;z-index:90;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5DCC9;border-radius:16px;box-shadow:0 10px 36px rgba(0,0,0,.18);padding:16px 18px;font:14px/1.5 Figtree,sans-serif;color:#2B2420}' +
    '#sg-cb p{margin:0 0 12px}#sg-cb a{color:#3A6B5C}#sg-cb .r{display:flex;gap:10px;flex-wrap:wrap}' +
    '#sg-cb button{flex:1 1 140px;border-radius:999px;padding:11px 18px;font:700 14px Figtree,sans-serif;cursor:pointer;border:2px solid #2B2420;background:#fff;color:#2B2420}' +
    '#sg-cb button.ok{background:#2B2420;color:#fff}';
  function banner() {
    if (document.getElementById('sg-cb')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'sg-cb'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie consent');
    d.innerHTML = '<p>We use cookies to measure how people use this site and to improve our ads. You can accept or reject them. See our <a href="/privacy/">privacy policy</a>.</p>' +
      '<div class="r"><button type="button" id="sg-no">Reject</button><button type="button" id="sg-yes" class="ok">Accept</button></div>';
    document.body.appendChild(d);
    document.getElementById('sg-yes').onclick = function () { store('granted'); d.remove(); decide(true); };
    document.getElementById('sg-no').onclick = function () { store('denied'); d.remove(); decide(false); };
  }
  window.sgCookieSettings = function () { try { localStorage.removeItem(KEY); } catch (e) {} banner(); };

  function init() {
    var s = stored();
    if (s === 'granted') return decide(true);
    if (s === 'denied') return decide(false);
    if (!needsConsent()) return decide(true);
    banner();   // tracking stays off until the visitor chooses
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
