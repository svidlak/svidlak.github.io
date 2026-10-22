/* Shared cart: a slide-in drawer with the PayPal button inside.
   Cart lives in localStorage ('sg_cart') so it survives page changes and works across products.
   Add from any page:  sgCart.add({ sku, name, price, image, qty })
   Any element with  data-sg-cart-open  opens the drawer;  data-sg-cart-count  shows the item count. */
(function () {
  var PAYPAL_CLIENT_ID = 'BAABlWHhEzPKIWCijcZMmeT8hAwi8g6tkdX4zws5uTsKlHxn1YlGoDn5rohNgQvuoi6dZG0ZiyJx5QDvQ4';
  var KEY = 'sg_cart', MAX_QTY = 10;
  var items = [];

  function valid(i) {
    return i && typeof i.sku === 'string' && typeof i.name === 'string' &&
      typeof i.price === 'number' && i.price > 0 && typeof i.qty === 'number' && i.qty > 0;
  }
  try { items = (JSON.parse(localStorage.getItem(KEY) || '[]') || []).filter(valid); } catch (e) { items = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function count() { return items.reduce(function (n, i) { return n + i.qty; }, 0); }
  function total() { return items.reduce(function (n, i) { return n + i.qty * i.price; }, 0); }
  function money(n) { return '$' + n.toFixed(2); }
  function track(name, extra) {
    if (!window.sgTrack) return;
    sgTrack(name, Object.assign({
      content_ids: items.map(function (i) { return i.sku; }),
      contents: items.map(function (i) { return { id: i.sku, quantity: i.qty, item_price: i.price }; }),
      content_type: 'product', value: +total().toFixed(2), currency: 'USD', num_items: count()
    }, extra || {}));
  }

  // ---------- UI ----------
  var css = document.createElement('style');
  css.textContent =
    '#sg-ov{display:none;position:fixed;inset:0;background:rgba(43,36,32,.5);z-index:95}' +
    '#sg-dr{position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100%;background:#fff;z-index:96;transform:translateX(100%);transition:transform .25s ease;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.15);font-family:Figtree,sans-serif;color:#2B2420;visibility:hidden}' +
    '#sg-dr.open{transform:none;visibility:visible}' +
    '#sg-dr .hd{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #E5DCC9}' +
    '#sg-dr .hd b{font-family:Fraunces,serif;font-size:20px}' +
    '#sg-dr .x{background:none;border:0;font-size:28px;line-height:1;cursor:pointer;color:#6B6354}' +
    '#sg-dr .bd{flex:1;overflow-y:auto;padding:4px 20px}' +
    '#sg-dr .row{display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid #EEE6D6}' +
    '#sg-dr .row img{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:none;background:#EFE6D4}' +
    '#sg-dr .nm{font-weight:700;font-size:14px}#sg-dr .pr{font-size:13px;color:#6B6354;margin:2px 0 6px}' +
    '#sg-dr .q{display:inline-flex;align-items:center;border:1px solid #E5DCC9;border-radius:8px;overflow:hidden}' +
    '#sg-dr .q button{width:30px;height:28px;background:none;border:0;cursor:pointer;font-size:15px}' +
    '#sg-dr .q span{width:30px;text-align:center;font-size:13px;font-weight:600}' +
    '#sg-dr .rm{background:none;border:0;color:#6B6354;cursor:pointer;font-size:13px;text-decoration:underline;margin-left:auto}' +
    '#sg-dr .empty{text-align:center;color:#6B6354;margin:48px 0}' +
    '#sg-dr .ft{padding:16px 20px calc(16px + env(safe-area-inset-bottom));border-top:1px solid #E5DCC9}' +
    '#sg-dr .tot{display:flex;justify-content:space-between;font-weight:700;margin-bottom:2px}' +
    '#sg-dr .note{font-size:12px;color:#6B6354;margin-bottom:12px}' +
    '#sg-pp{min-height:48px}' +
    '[data-sg-cart-open]{cursor:pointer}';
  document.head.appendChild(css);

  var ov, dr, bd, totEl, ft, pp, built = false;
  function build() {
    if (built || !document.body) return; built = true;
    ov = document.createElement('div'); ov.id = 'sg-ov';
    dr = document.createElement('aside'); dr.id = 'sg-dr';
    dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true'); dr.setAttribute('aria-label', 'Shopping cart');
    dr.innerHTML = '<div class="hd"><b>Your cart</b><button type="button" class="x" aria-label="Close cart">×</button></div>' +
      '<div class="bd"></div>' +
      '<div class="ft"><div class="tot"><span>Subtotal</span><span id="sg-tot">$0.00</span></div>' +
      '<div class="note">Free shipping. Secure checkout with PayPal.</div><div id="sg-pp"></div></div>';
    document.body.appendChild(ov); document.body.appendChild(dr);
    bd = dr.querySelector('.bd'); totEl = dr.querySelector('#sg-tot'); ft = dr.querySelector('.ft'); pp = dr.querySelector('#sg-pp');
    dr.querySelector('.x').addEventListener('click', close);
    ov.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    bd.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      var it = items.filter(function (i) { return i.sku === b.dataset.sku; })[0]; if (!it) return;
      if (b.dataset.act === 'inc') it.qty = Math.min(MAX_QTY, it.qty + 1);
      if (b.dataset.act === 'dec') it.qty -= 1;
      if (b.dataset.act === 'rm' || it.qty < 1) items = items.filter(function (i) { return i !== it; });
      save(); render();
    });
  }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function btn(label, act, sku, aria) {
    var b = el('button', null, label); b.type = 'button'; b.dataset.act = act; b.dataset.sku = sku; if (aria) b.setAttribute('aria-label', aria); return b;
  }

  function render() {
    // header badges
    document.querySelectorAll('[data-sg-cart-count]').forEach(function (n) { n.textContent = count(); });
    if (!built) return;
    bd.textContent = '';
    if (!items.length) bd.appendChild(el('p', 'empty', 'Your cart is empty.'));
    items.forEach(function (i) {
      var row = el('div', 'row');
      var img = el('img'); img.alt = ''; if (typeof i.image === 'string' && i.image.charAt(0) === '/') img.src = i.image;
      var info = el('div'); info.style.minWidth = '0';
      info.appendChild(el('div', 'nm', i.name));
      info.appendChild(el('div', 'pr', money(i.price)));
      var q = el('div', 'q');
      q.appendChild(btn('−', 'dec', i.sku, 'Decrease quantity'));
      q.appendChild(el('span', null, String(i.qty)));
      q.appendChild(btn('+', 'inc', i.sku, 'Increase quantity'));
      info.appendChild(q);
      row.appendChild(img); row.appendChild(info);
      var rm = btn('Remove', 'rm', i.sku); rm.className = 'rm'; row.appendChild(rm);
      bd.appendChild(row);
    });
    totEl.textContent = money(total());
    ft.style.display = items.length ? '' : 'none';
    if (items.length && dr.classList.contains('open')) renderPayPal();
  }

  // ---------- PayPal ----------
  var ppLoading = null, ppRendered = false;
  function loadPayPal() {
    if (ppLoading) return ppLoading;
    ppLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://www.paypal.com/sdk/js?client-id=' + PAYPAL_CLIENT_ID + '&currency=USD&intent=capture&components=buttons';
      s.onload = resolve; s.onerror = function (e) { ppLoading = null; reject(e); };
      document.head.appendChild(s);
    });
    return ppLoading;
  }
  function renderPayPal() {
    if (ppRendered) return; ppRendered = true;
    loadPayPal().then(function () {
      paypal.Buttons({
        style: { layout: 'vertical', shape: 'pill', label: 'paypal', height: 48 },
        onClick: function (data, actions) { if (!items.length) return actions.reject(); track('InitiateCheckout'); },
        createOrder: function (data, actions) {
          var t = total().toFixed(2);
          return actions.order.create({
            purchase_units: [{
              description: 'Sunnyside Goods order',
              custom_id: items.map(function (i) { return i.sku + 'x' + i.qty; }).join(',').slice(0, 127),
              amount: { currency_code: 'USD', value: t, breakdown: { item_total: { currency_code: 'USD', value: t } } },
              items: items.map(function (i) {
                return { name: i.name.slice(0, 127), sku: i.sku.slice(0, 127), category: 'PHYSICAL_GOODS',
                  quantity: String(i.qty), unit_amount: { currency_code: 'USD', value: i.price.toFixed(2) } };
              })
            }]
          });
        },
        onApprove: function (data, actions) {
          var paid = total().toFixed(2);
          return actions.order.capture().then(function (d) {
            location.href = '/thank-you/?order=' + encodeURIComponent(d.id) + '&value=' + paid;
          });
        },
        onError: function (err) { console.error('PayPal error', err); }
      }).render('#sg-pp');
    }).catch(function () {
      ppRendered = false;
      pp.textContent = 'Checkout couldn\'t load. Please refresh the page.';
    });
  }

  // ---------- Public API ----------
  var lastFocus = null;
  function open() { build(); lastFocus = document.activeElement; ov.style.display = 'block'; dr.classList.add('open'); render(); document.body.style.overflow = 'hidden'; dr.querySelector('.x').focus(); }
  function close() { if (!built) return; dr.classList.remove('open'); ov.style.display = 'none'; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  window.sgCart = {
    add: function (it) {
      if (!valid(it)) return;
      var ex = items.filter(function (i) { return i.sku === it.sku; })[0];
      if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + it.qty);
      else items.push({ sku: it.sku, name: it.name, price: it.price, image: it.image || '', qty: Math.min(MAX_QTY, it.qty) });
      save(); track('AddToCart', { content_ids: [it.sku], value: +(it.price * it.qty).toFixed(2), num_items: it.qty, contents: [{ id: it.sku, quantity: it.qty, item_price: it.price }] });
      open();
    },
    open: open, close: close, count: count, clear: function () { items = []; save(); render(); }
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sg-cart-open]');
    if (t) { e.preventDefault(); open(); }
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY) { try { items = (JSON.parse(e.newValue || '[]') || []).filter(valid); } catch (x) { items = []; } render(); } });
  document.addEventListener('DOMContentLoaded', function () { build(); render(); });
})();
