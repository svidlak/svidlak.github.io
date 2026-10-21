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

  var seen = {};
  window.sgTrack = function (name, params, once) {
    params = Object.assign({}, params || {}, utm);
    if (once) { var k = name + JSON.stringify(params.content_ids || ''); if (seen[k]) return; seen[k] = 1; }
    if (window.fbq) {
      if (META_STANDARD[name]) fbq('track', name, params); else fbq('trackCustom', name, params);
    }
    if (window.gtag) gtag('event', GA_MAP[name] || name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(), params);
    if (!CONFIG.META_PIXEL_ID && !CONFIG.GA4_ID) console.debug('[sgTrack]', name, params);
  };
})();
