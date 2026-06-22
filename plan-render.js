/* ============================================================================
 * plan-render.js  ·  "Start Here / My Hormone Plan" UI sluoksnis
 * ----------------------------------------------------------------------------
 * Priklauso nuo: plan-maps.js (window.HormonePlan). Ikrauk plan-maps.js PIRMA.
 *
 * Ka daro:
 *  - Surenderina 4 klausimu srauta (SPA stiliumi, be perkrovimo)
 *  - Kvieczia HormonePlan.buildPlan() ir surenderina rezultatu dashboard'a
 *  - Issaugo atsakymus + savaites indeksa localStorage (be backend)
 *  - Grizes vartotojas iskart mato savo planą (su "edit answers")
 *
 * Imontavimas Webflow puslapyje (vienas tuscias konteineris):
 *    <div id="hormone-plan-root"></div>
 *  + abu scriptai per jsDelivr (footer): plan-maps.js, tada plan-render.js
 *
 * Stilius: visi CSS injektuojami cia (scoped .hp-*), kad nepriklausytume nuo
 * Webflow klasiu. British English copy. Be em-dash proza.
 * ==========================================================================*/

(function () {
  'use strict';

  var ROOT_ID = 'hormone-plan-root';
  var STORAGE_KEY = 'hp_plan_v1';
  var BRAND = {
    men:   { accent: '#11294A', accent2: '#1C3A60' },   // navy
    women: { accent: '#7A4E6B', accent2: '#8E5C7D' }    // plum
  };

  /* ---- saugiklis: ar variklis ikrautas? -------------------------------- */
  function engineReady() {
    return typeof window.HormonePlan === 'object' && typeof window.HormonePlan.buildPlan === 'function';
  }

  /* ---- localStorage helperiai (su try/catch, niekada nemeta) ----------- */
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch (e) { return null; }
  }
  function save(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) {}
  }
  function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  /* ---- maza util: sukurti elementa is HTML stringo ---------------------- */
  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---- klausimu apibrezimas (UI tekstas; track = Q1 viduje) ------------- */
  var Q_GENDER = {
    key: 'track', title: 'First, who is this for?',
    sub: 'This sets your whole plan: testosterone, or perimenopause and hormones.',
    options: [ { v: 'men', label: 'Man' }, { v: 'women', label: 'Woman' } ]
  };
  var Q_AGE = {
    key: 'ageBand', title: 'How old are you?',
    sub: 'Hormones shift with each decade. This tunes what "normal" means for you.',
    options: [
      { v: 'u30', label: 'Under 30' }, { v: '30s', label: '30 to 39' },
      { v: '40s', label: '40 to 49' }, { v: '50s', label: '50 to 59' },
      { v: '60plus', label: '60 or over' }
    ]
  };
  // Q3 (goal) priklauso nuo track
  var Q_GOAL = {
    men: {
      key: 'goal', title: "What's bugging you most right now?",
      sub: 'Pick the one that matters most. Your plan leads with this.',
      options: [
        { v: 'energy', label: 'Low energy & fatigue' }, { v: 'libido', label: 'Low sex drive' },
        { v: 'mood', label: 'Mood, motivation & focus' }, { v: 'weight', label: 'Weight & belly fat' },
        { v: 'sleep', label: 'Poor sleep' }, { v: 'strength', label: 'Strength & muscle' },
        { v: 'optimise', label: 'Just optimising / not sure' }
      ]
    },
    women: {
      key: 'goal', title: "What's bothering you most right now?",
      sub: 'Pick the one that matters most. Your plan leads with this.',
      options: [
        { v: 'flushes', label: 'Hot flushes & night sweats' }, { v: 'mood', label: 'Mood swings & anxiety' },
        { v: 'cycles', label: 'Changing or irregular cycles' }, { v: 'brainfog', label: 'Brain fog' },
        { v: 'weight', label: 'Weight changes' }, { v: 'energy', label: 'Low energy & fatigue' },
        { v: 'optimise', label: 'Getting ahead / not sure' }
      ]
    }
  };
  var Q_STAGE = {
    key: 'stage', title: 'Where are you in figuring this out?',
    sub: 'So we pitch the plan at the right level.',
    options: [
      { v: 'starting', label: 'Just starting out', d: "We'll keep it simple and foundational." },
      { v: 'normal_but_off', label: 'Told I\u2019m "normal" but I feel off', d: "We'll show you what a standard test often misses." },
      { v: 'have_bloods', label: "I've already had bloodwork done", d: "We'll help you read it, not just 'normal'." }
    ]
  };

  /* ====================================================================== *
   * CSS (scoped .hp-*)
   * ====================================================================== */
  var CSS = ''
  + '#' + ROOT_ID + '{--cream:#FAF6EC;--paper:#fff;--ink:#23303F;--muted:#6E7A88;--line:#E7E0CF;'
  + '--gold:#C39A4A;--gold-d:#A9822F;--gold-soft:#E7D8B0;--sage:#5E8B6A;--sage-soft:#DCE9DE;--rose:#B07A6E;'
  + '--accent:#11294A;--accent2:#1C3A60;'
  + '--serif:"Fraunces",Georgia,serif;--sans:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}'
  + '#' + ROOT_ID + ' *{box-sizing:border-box}'
  + '.hp-wrap{max-width:920px;margin:0 auto;font-family:var(--sans);color:var(--ink);line-height:1.55}'
  + '.hp-card{background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:0 1px 2px rgba(17,41,74,.05),0 12px 30px -16px rgba(17,41,74,.18)}'
  + '.hp-eye{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-d);font-weight:600}'
  + '.hp-serif{font-family:var(--serif);font-weight:500;color:var(--accent);letter-spacing:-.01em;line-height:1.14}'
  + '.hp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--gold);color:#fff;border:none;border-radius:11px;padding:13px 22px;font:600 14.5px var(--sans);cursor:pointer;text-decoration:none;box-shadow:0 10px 22px -10px rgba(169,130,47,.9);transition:transform .15s,opacity .15s}'
  + '.hp-btn:hover{transform:translateY(-1px)} .hp-btn[disabled]{background:#C9CFD7;box-shadow:none;cursor:default;transform:none}'
  + '.hp-btn.ghost{background:transparent;color:var(--accent);border:1px solid var(--line);box-shadow:none}'
  + '.hp-micro{font-size:12px;color:var(--muted)}'
  /* progress */
  + '.hp-prog{display:flex;align-items:center;gap:10px;margin-bottom:18px}'
  + '.hp-bars{display:flex;gap:5px;flex:1}.hp-bars i{height:5px;border-radius:3px;flex:1;background:#ECE4D2}.hp-bars i.on{background:var(--gold)}'
  + '.hp-prog .lbl{font-size:11px;color:var(--muted);font-weight:600;white-space:nowrap}'
  /* question */
  + '.hp-q{padding:30px 28px}'
  + '.hp-q h2{font-family:var(--serif);font-weight:500;color:var(--accent);font-size:23px;line-height:1.16;margin:0 0 4px}'
  + '.hp-q .qsub{font-size:13.5px;color:var(--muted);margin-bottom:18px}'
  + '.hp-opts{display:flex;flex-direction:column;gap:9px}'
  + '.hp-opt{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:1.5px solid var(--line);background:var(--paper);border-radius:12px;padding:14px 15px;font:500 14.5px var(--sans);color:var(--ink);cursor:pointer;transition:.13s}'
  + '.hp-opt:hover{border-color:var(--gold-soft);background:#FFFDF8}'
  + '.hp-opt .mk{flex:none;width:20px;height:20px;border-radius:6px;border:1.5px solid var(--line);display:grid;place-items:center;font-size:11px;color:transparent}'
  + '.hp-opt.sel{border-color:var(--accent);background:#F6F9FC}.hp-opt.sel .mk{background:var(--accent);border-color:var(--accent);color:#fff}'
  + '.hp-opt .od{display:block;font-size:12px;color:var(--muted);font-weight:400;margin-top:2px}'
  + '.hp-foot{display:flex;align-items:center;gap:12px;margin-top:18px;flex-wrap:wrap}'
  /* loading */
  + '.hp-load{padding:46px 28px;text-align:center}'
  + '.hp-spin{width:42px;height:42px;border-radius:50%;border:4px solid #EAE2CE;border-top-color:var(--gold);margin:0 auto 16px;animation:hp-rot 1s linear infinite}'
  + '@keyframes hp-rot{to{transform:rotate(360deg)}}'
  /* result */
  + '.hp-mirror{background:var(--accent);color:#F4EEDD;border-radius:18px;padding:30px 30px 26px;position:relative;overflow:hidden}'
  + '.hp-mirror::after{content:"";position:absolute;right:-60px;top:-60px;width:230px;height:230px;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(195,154,74,.34),transparent 62%)}'
  + '.hp-mirror .hp-eye{color:var(--gold-soft)}'
  + '.hp-mirror h1{font-family:var(--serif);font-weight:500;color:#fff;font-size:27px;line-height:1.12;margin:9px 0 12px;max-width:640px;position:relative}'
  + '.hp-mirror p{color:#D8E0EC;font-size:14.5px;max-width:600px;position:relative}'
  + '.hp-pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;position:relative}'
  + '.hp-pills span{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:5px 12px;font-size:12px;color:#EAEFF6}'
  + '.hp-sec{margin-top:22px}'
  + '.hp-sec>.hp-h{display:flex;align-items:baseline;gap:10px;margin-bottom:12px;flex-wrap:wrap}'
  + '.hp-sec>.hp-h h3{font-family:var(--serif);font-weight:500;color:var(--accent);font-size:20px;margin:0}'
  + '.hp-sec>.hp-h .k{font-size:12px;color:var(--muted)}'
  /* levers */
  + '.hp-lever{display:flex;gap:14px;padding:15px 20px;border-top:1px solid var(--line)}.hp-lever:first-child{border-top:none}'
  + '.hp-lever .rank{flex:none;width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;font-family:var(--serif);font-size:15px;display:grid;place-items:center;margin-top:2px}'
  + '.hp-lever.big .rank{background:var(--gold)}'
  + '.hp-lever h4{font:600 15px var(--sans);color:var(--accent);margin:0 0 2px}'
  + '.hp-lever p{font-size:13.5px;color:var(--muted);margin:0}'
  + '.hp-lever a{color:var(--gold-d);text-decoration:none;font-weight:600;font-size:12.5px;border-bottom:1px solid var(--gold-soft)}'
  /* foods */
  + '.hp-foods{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:20px}'
  + '.hp-fcol h5{font:700 12px var(--sans);letter-spacing:.04em;text-transform:uppercase;margin:0 0 10px}'
  + '.hp-fcol.good h5{color:var(--sage)}.hp-fcol.limit h5{color:var(--rose)}'
  + '.hp-food{display:flex;align-items:center;gap:11px;padding:8px 0;border-bottom:1px solid var(--line)}.hp-food:last-child{border-bottom:none}'
  + '.hp-food .nm{flex:1;font-size:13.5px;color:var(--ink)}'
  + '.hp-food .bar{width:60px;height:6px;border-radius:3px;background:#EDE7D7;overflow:hidden}.hp-food .bar i{display:block;height:100%}'
  + '.hp-food.g .bar i{background:var(--sage)}.hp-food.l .bar i{background:var(--rose)}'
  + '.hp-food .sc{font-family:var(--serif);font-size:15px;width:30px;text-align:right}.hp-food.g .sc{color:var(--sage)}.hp-food.l .sc{color:var(--rose)}'
  /* recs */
  + '.hp-row{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:14px}'
  + '.hp-mini{padding:18px}.hp-mini .tag{font:600 10.5px var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--gold-d)}'
  + '.hp-mini h4{font-family:var(--serif);font-weight:500;color:var(--accent);font-size:16px;margin:7px 0 6px}'
  + '.hp-mini p{font-size:12.5px;color:var(--muted);margin:0 0 12px}'
  + '.hp-mini a.go{font:600 13px var(--sans);color:var(--accent);text-decoration:none;border-bottom:2px solid var(--gold-soft);padding-bottom:1px}'
  + '.hp-mini.tool{background:linear-gradient(160deg,var(--accent2),var(--accent));color:#EAEFF6}'
  + '.hp-mini.tool .tag{color:var(--gold-soft)}.hp-mini.tool h4{color:#fff}.hp-mini.tool p{color:#C4D0DE}.hp-mini.tool a.go{color:#fff;border-color:rgba(255,255,255,.35)}'
  + '.hp-supp{display:flex;flex-direction:column;gap:9px}.hp-supp .s{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13.5px}'
  + '.hp-supp .s .links{display:flex;gap:8px;align-items:center}'
  + '.hp-supp .s a{font-size:11.5px;text-decoration:none;color:var(--muted);border-bottom:1px solid var(--line)}'
  + '.hp-supp .s a.buy{color:var(--gold-d);border-color:var(--gold-soft);font-weight:600}'
  + '.hp-tier{font:700 9.5px var(--sans);padding:2px 7px;border-radius:5px;letter-spacing:.03em;text-transform:uppercase}'
  + '.hp-tier.works{background:var(--sage-soft);color:#3C6147}.hp-tier.some{background:#F4E9CF;color:#8A6B23}.hp-tier.unproven{background:#EEE7DA;color:#7A7160}'
  + '.hp-qs{display:flex;flex-direction:column}.hp-qs a{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid var(--line);text-decoration:none;color:var(--accent);font-size:13.5px;font-weight:500}.hp-qs a:last-child{border-bottom:none}.hp-qs a span{color:var(--gold-d)}'
  /* this week */
  + '.hp-week{background:var(--paper);border:1px solid var(--gold-soft);border-radius:18px;box-shadow:0 1px 2px rgba(17,41,74,.05),0 12px 30px -16px rgba(17,41,74,.18);padding:22px;display:flex;gap:18px;align-items:center;margin-top:22px}'
  + '.hp-week .badge{flex:none;width:52px;height:52px;border-radius:14px;background:var(--gold);color:#fff;display:grid;place-items:center;font-family:var(--serif);font-size:12px;text-align:center;line-height:1.1}'
  + '.hp-week h3{font-family:var(--serif);font-weight:500;color:var(--accent);font-size:17px;margin:2px 0 3px}'
  + '.hp-week p{font-size:12.5px;color:var(--muted);margin:0}'
  + '.hp-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;align-items:center}'
  + '.hp-disc{font-size:11.5px;color:var(--muted);margin-top:18px;text-align:center;max-width:620px;margin-left:auto;margin-right:auto}'
  /* responsive */
  + '@media(max-width:680px){.hp-foods{grid-template-columns:1fr}.hp-row{grid-template-columns:1fr}.hp-mirror h1{font-size:23px}.hp-q h2{font-size:20px}}';

  function injectCSS() {
    if (document.getElementById('hp-style')) return;
    var s = document.createElement('style');
    s.id = 'hp-style'; s.textContent = CSS;
    document.head.appendChild(s);
  }
  // Fraunces + Inter (jei dar neikrauti)
  function injectFonts() {
    if (document.getElementById('hp-fonts')) return;
    var l = document.createElement('link');
    l.id = 'hp-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
  }

  /* ====================================================================== *
   * STATE
   * ====================================================================== */
  var state = { answers: {}, step: 0, root: null };

  function setAccent(track) {
    var b = BRAND[track] || BRAND.men;
    state.root.style.setProperty('--accent', b.accent);
    state.root.style.setProperty('--accent2', b.accent2);
  }

  /* ---- klausimu seka pagal dabartini track ------------------------------ */
  function currentQuestions() {
    var track = state.answers.track || 'men';
    return [ Q_GENDER, Q_AGE, Q_GOAL[track], Q_STAGE ];
  }

  /* ====================================================================== *
   * RENDER: klausimai
   * ====================================================================== */
  function renderQuestion() {
    var qs = currentQuestions();
    var total = qs.length;
    var q = qs[state.step];
    var chosen = state.answers[q.key];

    var bars = '';
    for (var i = 0; i < total; i++) bars += '<i class="' + (i <= state.step ? 'on' : '') + '"></i>';

    var opts = q.options.map(function (o) {
      var sel = chosen === o.v ? ' sel' : '';
      var desc = o.d ? '<span class="od">' + esc(o.d) + '</span>' : '';
      return '<button class="hp-opt' + sel + '" data-v="' + esc(o.v) + '">'
        + '<span class="mk">\u2713</span><span><span>' + esc(o.label) + '</span>' + desc + '</span></button>';
    }).join('');

    var backBtn = state.step > 0 ? '<button class="hp-btn ghost" data-act="back">Back</button>' : '';
    var nextLabel = state.step === total - 1 ? 'See my plan \u2192' : 'Continue';
    var nextDis = chosen ? '' : ' disabled';

    var node = el(
      '<div class="hp-card hp-q">'
      + '<div class="hp-prog"><div class="hp-bars">' + bars + '</div><span class="lbl">' + (state.step + 1) + ' of ' + total + '</span></div>'
      + '<h2>' + esc(q.title) + '</h2>'
      + '<div class="qsub">' + esc(q.sub) + '</div>'
      + '<div class="hp-opts">' + opts + '</div>'
      + '<div class="hp-foot">' + backBtn
      + '<button class="hp-btn" data-act="next"' + nextDis + '>' + nextLabel + '</button>'
      + '<span class="hp-micro">60 seconds \u00b7 no email</span></div>'
      + '</div>'
    );

    // events
    node.querySelectorAll('.hp-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-v');
        state.answers[q.key] = v;
        if (q.key === 'track') { setAccent(v); delete state.answers.goal; } // track keiczia Q3
        renderQuestion();
      });
    });
    var nextEl = node.querySelector('[data-act="next"]');
    if (nextEl) nextEl.addEventListener('click', function () {
      if (!state.answers[q.key]) return;
      if (state.step === total - 1) { buildAndShow(); }
      else { state.step++; renderQuestion(); }
    });
    var backEl = node.querySelector('[data-act="back"]');
    if (backEl) backEl.addEventListener('click', function () { state.step--; renderQuestion(); });

    mount(node);
  }

  /* ====================================================================== *
   * RENDER: loading -> result
   * ====================================================================== */
  function buildAndShow() {
    var node = el('<div class="hp-card hp-load"><div class="hp-spin"></div>'
      + '<div class="hp-eye">Building your plan</div>'
      + '<p class="hp-micro" style="margin-top:6px">Pulling the right pieces from the library for you\u2026</p></div>');
    mount(node);

    var saved = {
      answers: state.answers,
      savedAt: Date.now(),
      weekIndex: (loadSaved() && loadSaved().weekIndex) || 0
    };
    save(saved);

    setTimeout(function () { renderResult(saved); }, 650);
  }

  function tierLabel(t) { return t === 'works' ? 'Works' : (t === 'some' ? 'Some effect' : 'Unproven'); }

  function renderResult(saved) {
    var plan;
    try { plan = window.HormonePlan.buildPlan(saved.answers, { weekIndex: saved.weekIndex || 0 }); }
    catch (e) { return renderError(); }

    setAccent(plan.meta.track);

    // mirror pills
    var pills = '';
    if (plan.levers && plan.levers[0]) pills += '<span>Priority: ' + esc(plan.meta.goalLabel) + '</span>';
    pills += '<span>Top lever: ' + esc(plan.levers[0].title) + '</span>';

    // levers
    var levers = plan.levers.map(function (l, i) {
      var link = l.link ? ' <a target="_blank" rel="noopener" href="' + esc(l.link) + '">Learn more \u2192</a>' : '';
      return '<div class="hp-lever' + (i === 0 ? ' big' : '') + '"><div class="rank">' + (i + 1) + '</div>'
        + '<div><h4>' + esc(l.title) + '</h4><p>' + esc(l.why) + link + '</p></div></div>';
    }).join('');

    // foods
    function foodRow(f, cls) {
      var pct = Math.max(6, Math.min(100, f.score));
      return '<a class="hp-food ' + cls + '" target="_blank" rel="noopener" href="' + esc(f.href) + '" style="text-decoration:none">'
        + '<span class="nm">' + esc(f.name) + '</span>'
        + '<span class="bar"><i style="width:' + pct + '%"></i></span>'
        + '<span class="sc">' + f.score + '</span></a>';
    }
    var boosters = plan.foods.boosters.map(function (f) { return foodRow(f, 'g'); }).join('');
    var limits = plan.foods.limits.map(function (f) { return foodRow(f, 'l'); }).join('');

    // tool
    var tool = '<div class="hp-mini tool hp-card"><div class="tag">Your tool</div>'
      + '<h4>' + esc(plan.tool.name) + '</h4><p>' + esc(plan.tool.blurb) + '</p>'
      + '<a class="go" target="_blank" rel="noopener" href="' + esc(plan.tool.href) + '">Open the tool \u2192</a></div>';

    // supplements
    var supps = plan.supplements.map(function (s) {
      var buy = s.recommends ? '<a class="buy" href="' + esc(s.recommends) + '" rel="sponsored nofollow noopener" target="_blank">Shop \u2192</a>' : '';
      return '<div class="s"><span>' + esc(s.name) + '</span><span class="links">'
        + '<span class="hp-tier ' + esc(s.tier) + '">' + tierLabel(s.tier) + '</span>'
        + (s.info ? '<a target="_blank" rel="noopener" href="' + esc(s.info) + '">Why</a>' : '') + buy + '</span></div>';
    }).join('');
    var suppCard = '<div class="hp-mini hp-card"><div class="tag">Your supplements</div>'
      + '<div class="hp-supp" style="margin-top:10px">' + supps + '</div></div>';

    // questions
    var qs = plan.questions.map(function (q) {
      return '<a target="_blank" rel="noopener" href="' + esc(q.href) + '">' + esc(q.label) + ' <span>\u2192</span></a>';
    }).join('');
    var qCard = '<div class="hp-mini hp-card"><div class="tag">Your questions</div>'
      + '<div class="hp-qs" style="margin-top:8px">' + qs + '</div></div>';

    var node = el(
      '<div>'
      + '<div class="hp-mirror"><div class="hp-eye">Your plan</div>'
      + '<h1>' + esc(plan.mirror.headline) + '</h1>'
      + '<p>' + esc(plan.mirror.sub) + '</p>'
      + '<div class="hp-pills">' + pills + '</div></div>'

      + '<div class="hp-sec"><div class="hp-h"><h3>Your top 3 levers</h3><span class="k">ranked for your profile</span></div>'
      + '<div class="hp-card">' + levers + '</div></div>'

      + '<div class="hp-sec"><div class="hp-h"><h3>Foods picked for you</h3><span class="k">scored for your goal</span></div>'
      + '<div class="hp-card hp-foods">'
      + '<div class="hp-fcol good"><h5>\u25C9 Lean into these</h5>' + boosters + '</div>'
      + '<div class="hp-fcol limit"><h5>\u25C9 Ease off these</h5>' + limits + '</div></div></div>'

      + '<div class="hp-sec"><div class="hp-h"><h3>Built for you, from the site</h3><span class="k">one tool \u00b7 your supplements \u00b7 your questions</span></div>'
      + '<div class="hp-row">' + tool + suppCard + qCard + '</div></div>'

      + '<div class="hp-week"><div class="badge">THIS<br>WEEK</div><div style="flex:1">'
      + '<div class="hp-eye">Your one step</div><h3>' + esc(plan.thisWeek) + '</h3>'
      + '<p>One small change with the biggest payoff. We\u2019ll swap it for a new step next week.</p></div></div>'

      + '<div class="hp-actions">'
      + '<button class="hp-btn" data-act="next-week">Give me next week\u2019s step</button>'
      + '<button class="hp-btn ghost" data-act="restart">Start over / edit answers</button></div>'

      + '<p class="hp-disc">This plan is general wellbeing information, not medical advice or a diagnosis. '
      + 'Always speak to a qualified clinician about your symptoms and before changing medication or supplements.</p>'
      + '</div>'
    );

    node.querySelector('[data-act="restart"]').addEventListener('click', function () {
      clearSaved(); state.answers = {}; state.step = 0;
      state.root.style.setProperty('--accent', BRAND.men.accent);
      state.root.style.setProperty('--accent2', BRAND.men.accent2);
      renderQuestion();
    });
    node.querySelector('[data-act="next-week"]').addEventListener('click', function () {
      var s = loadSaved() || saved;
      s.weekIndex = (s.weekIndex || 0) + 1;
      save(s);
      renderResult(s);
      try { state.root.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    });

    mount(node);
  }

  function renderError() {
    mount(el('<div class="hp-card hp-q"><h2>Something went wrong</h2>'
      + '<div class="qsub">Please refresh the page and try again.</div>'
      + '<div class="hp-foot"><button class="hp-btn" onclick="location.reload()">Refresh</button></div></div>'));
  }

  /* ====================================================================== *
   * MOUNT / INIT
   * ====================================================================== */
  function mount(node) {
    var w = state.root.querySelector('.hp-wrap');
    w.innerHTML = '';
    w.appendChild(node);
  }

  function start() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    state.root = root;
    injectFonts(); injectCSS();
    if (!root.querySelector('.hp-wrap')) {
      var wrap = document.createElement('div'); wrap.className = 'hp-wrap'; root.appendChild(wrap);
    }
    if (!engineReady()) {
      mount(el('<div class="hp-card hp-q"><h2>Loading\u2026</h2><div class="qsub">If this persists, please refresh.</div></div>'));
      var tries = 0, t = setInterval(function () {
        tries++;
        if (engineReady()) { clearInterval(t); boot(); }
        else if (tries > 40) { clearInterval(t); renderError(); }
      }, 100);
      return;
    }
    boot();
  }

  function boot() {
    var saved = loadSaved();
    if (saved && saved.answers && saved.answers.track && saved.answers.goal) {
      setAccent(saved.answers.track);
      renderResult(saved);        // grizes vartotojas -> iskart planas
    } else {
      state.answers = {}; state.step = 0;
      renderQuestion();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // viesas API (debug / re-init)
  window.HormonePlanUI = { restart: function () { clearSaved(); location.reload(); }, start: start };
})();
