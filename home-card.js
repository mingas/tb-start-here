/* Start Here hero card — testosteroneblueprintguide.com Home page only.
   Adds: desktop frosted overlay card (bottom-right of hero) + mobile solid navy band (below hero).
   Purely additive: finds the hero by its headline, appends new nodes, injects scoped CSS.
   Never modifies or removes existing elements. Idempotent. */
(function () {
  'use strict';
  if (window.__shHeroCard) return;
  window.__shHeroCard = true;

  var FONT = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';

  var CSS = [
    '#sh-card{position:absolute;right:4%;top:9%;width:35%;min-width:270px;max-width:390px;z-index:5;padding:26px 22px;background:linear-gradient(180deg,rgba(8,17,30,.10),rgba(8,17,30,.55));backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}',
    '#sh-card .sh-eye{font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;color:#E7D8B0;margin-bottom:9px;text-shadow:0 1px 6px rgba(0,0,0,.5)}',
    '#sh-card .sh-h{font-family:Fraunces,Georgia,serif;font-weight:500;color:#fff;font-size:24px;line-height:1.16;margin:0 0 8px;text-shadow:0 1px 10px rgba(0,0,0,.55)}',
    '#sh-card .sh-p{font-size:13.5px;color:rgba(255,255,255,.9);margin:0 0 17px;line-height:1.5;text-shadow:0 1px 8px rgba(0,0,0,.5)}',
    '.sh-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#C39A4A;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:none;box-shadow:0 10px 24px -8px rgba(0,0,0,.55);transition:transform .15s}',
    '.sh-btn:hover{transform:translateY(-1px)}',
    '.sh-micro{font-size:11px;margin-top:10px;text-align:center;display:flex;gap:7px;justify-content:center;align-items:center;flex-wrap:wrap}',
    '#sh-card .sh-btn{font-size:15px;padding:14px 20px}',
    '#sh-card .sh-micro{font-size:12px;color:rgba(255,255,255,.85);text-shadow:0 1px 6px rgba(0,0,0,.5)}',
    '.sh-d{width:3px;height:3px;border-radius:50%;background:#E7D8B0;display:inline-block}',
    /* mobile solid band (hidden on desktop) */
    '#sh-band{display:none;background:#11294A;padding:20px 20px 22px;position:relative}',
    '#sh-band::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:#C39A4A}',
    '#sh-band .sh-eye{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:#E7D8B0;margin-bottom:6px}',
    '#sh-band .sh-h{font-family:Fraunces,Georgia,serif;font-weight:500;color:#fff;font-size:20px;line-height:1.18;margin:0 0 5px}',
    '#sh-band .sh-p{font-size:12.5px;color:#C4D0DE;margin:0 0 14px;line-height:1.45}',
    '#sh-band .sh-btn{box-shadow:none}',
    '#sh-band .sh-micro{color:#9DB0C6}',
    /* switch: overlay card on desktop, solid band on mobile */
    '@media(max-width:1024px){#sh-card{display:none!important}#sh-band{display:block}}'
  ].join('');

  var INNER =
    '<div class="sh-eye">Start here</div>' +
    '<div class="sh-h">Not sure where to start?</div>' +
    '<div class="sh-p">Answer 4 quick questions and get your free personalised hormone plan.</div>' +
    '<a class="sh-btn" href="/start-here">Build my plan \u2192</a>' +
    '<div class="sh-micro">60 seconds<span class="sh-d"></span>no email<span class="sh-d"></span>men &amp; women</div>';

  function injectCSS() {
    if (!document.getElementById('sh-font')) {
      var l = document.createElement('link');
      l.id = 'sh-font'; l.rel = 'stylesheet'; l.href = FONT;
      document.head.appendChild(l);
    }
    if (document.getElementById('sh-css')) return;
    var s = document.createElement('style');
    s.id = 'sh-css'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function findHero() {
    var hs = document.querySelectorAll('h1');
    var h1 = null;
    for (var i = 0; i < hs.length; i++) {
      if (/understand your hormones/i.test(hs[i].textContent || '')) { h1 = hs[i]; break; }
    }
    if (!h1) return null;
    // climb to the ancestor that carries the hero background image (the rounded hero box)
    var el = h1;
    for (var n = 0; n < 8 && el && el !== document.body; n++) {
      var bg = '';
      try { bg = window.getComputedStyle(el).backgroundImage; } catch (e) {}
      if (bg && bg.indexOf('url(') !== -1) return el;
      el = el.parentElement;
    }
    // fallbacks
    return (h1.closest && h1.closest('section')) ||
           (h1.parentElement && h1.parentElement.parentElement) ||
           h1.parentElement;
  }

  var heroEl = null, cardEl = null;

  function findEyebrow(scope) {
    var all = scope.querySelectorAll('*');
    var best = null, bestLen = 999;
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].textContent || '').trim();
      if (/evidence-based hormone health/i.test(t) && t.length < 90 && t.length < bestLen) {
        best = all[i]; bestLen = t.length;
      }
    }
    return best;
  }

  function alignTop() {
    if (!heroEl || !cardEl) return;
    var eb = findEyebrow(heroEl);
    if (!eb) return;
    try {
      var hr = heroEl.getBoundingClientRect();
      var er = eb.getBoundingClientRect();
      var top = er.top - hr.top;
      if (top > 0) { cardEl.style.top = Math.round(top) + 'px'; cardEl.style.bottom = 'auto'; }
    } catch (e) {}
  }

  function build() {
    if (document.getElementById('sh-card') || document.getElementById('sh-band')) return true;
    var hero = findHero();
    if (!hero) return false;
    injectCSS();
    try {
      if (window.getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
    } catch (e) {}
    var card = document.createElement('div');
    card.id = 'sh-card';
    card.innerHTML = INNER;
    hero.appendChild(card);

    var band = document.createElement('div');
    band.id = 'sh-band';
    band.innerHTML = INNER;
    if (hero.parentNode) hero.parentNode.insertBefore(band, hero.nextSibling);

    heroEl = hero; cardEl = card;
    alignTop();
    // re-align after fonts/layout settle and on resize
    setTimeout(alignTop, 400);
    setTimeout(alignTop, 1200);
    window.addEventListener('load', alignTop);
    window.addEventListener('resize', alignTop);
    return true;
  }

  function boot() {
    if (build()) return;
    var t = 0;
    var iv = setInterval(function () { t++; if (build() || t > 40) clearInterval(iv); }, 150);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
