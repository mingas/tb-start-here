/* ============================================================================
 * plan-maps.js  ·  "My Hormone Plan" variklis (Start Here)
 * ----------------------------------------------------------------------------
 * Paskirtis: 4 atsakymai -> profile -> asmeninis planas, SURINKTAS is jau
 * esamo svetaines turinio (Foods, Supplements, Questions, irankiai).
 *
 * Principai (nelaužyti):
 *  - Be priklausomybiu, be DOM. Grynas duomenu + logikos modulis.
 *  - Komentarai lietuviskai; VISI vartotojui matomi tekstai - angliski (British).
 *  - Jokios diagnozes, jokiu doziu, jokiu fake pazadu ar fake reitingu.
 *  - Kiekvienas "map" turi 'optimise' fallback. buildPlan niekada nemeta klaidos
 *    ir niekada negrazina tuscio bloko.
 *  - Affiliate VISADA per /recommends/* (ne tiesioginis URL). info -> /supplements-guide.
 *  - tier reiksme: works = stiprus irodymai (daznai "jei truksta"),
 *    some = misrus/kuklus, unproven = populiaru bet silpni irodymai.
 *
 * Goal zodynas (fiksuotas):
 *   men   : energy, libido, mood, weight, sleep, strength, optimise
 *   women : flushes, mood, cycles, brainfog, weight, energy, optimise
 *
 * TODO (kai bus zinomi realūs Foods CMS slug'ai): uzpildyti FOODS[].slug.
 *   Kol slug == null, maistas linkina i /foods centra (saugu).
 * Pastaba: 30-dienu kelias SAMONINGAI ne cia - ji renderina puslapio sablonas
 *   (iliustracija, ne per-goal duomuo).
 * ==========================================================================*/

(function (root) {
  'use strict';

  var VERSION = '2.0.0';

  /* ---- Goal zodynas ir zmoniski pavadinimai ------------------------------ */
  var GOALS = {
    men:   ['energy', 'libido', 'mood', 'weight', 'sleep', 'strength', 'optimise'],
    women: ['flushes', 'mood', 'cycles', 'brainfog', 'weight', 'energy', 'optimise']
  };

  var GOAL_LABEL = {
    men: {
      energy: 'energy & fatigue', libido: 'sex drive', mood: 'mood & motivation',
      weight: 'weight & belly fat', sleep: 'sleep', strength: 'strength & muscle',
      optimise: 'overall optimisation'
    },
    women: {
      flushes: 'hot flushes & sweats', mood: 'mood & anxiety', cycles: 'changing cycles',
      brainfog: 'brain fog', weight: 'weight changes', energy: 'energy & fatigue',
      optimise: 'getting ahead'
    }
  };

  /* ---- 1) MIRROR: profilio veidrodis [track][goal] ----------------------- *
   * headline laikomas trumpas ir be netikru skaiciu; amzius ir stage pridedami
   * KODE (AGE_NOTE + STAGE_LEAD), kad isvengtume 42 ranka rasytu kombinaciju.  */
  var MIRROR = {
    men: {
      energy: {
        headline: "Tired by mid-afternoon, even after a full night's sleep?",
        sub: "Flagging energy is usually the first thing low testosterone takes, and it is one of the most fixable."
      },
      libido: {
        headline: "Your drive isn't quite what it used to be, and you've noticed.",
        sub: "Libido is one of the clearest signals of how your hormones are doing, and small, steady changes move it more than you would think."
      },
      mood: {
        headline: "Flatter mood, less motivation, a shorter fuse than usual?",
        sub: "Testosterone shapes mood and drive more than most men realise, and the basics below tend to lift them together."
      },
      weight: {
        headline: "Weight creeping on around the middle, despite no real change?",
        sub: "Belly fat and testosterone pull against each other, each one feeding the other, so breaking the loop pays you back twice."
      },
      sleep: {
        headline: "Broken, shallow sleep that leaves you flat the next day?",
        sub: "Most of your testosterone is made while you sleep, so poor nights hit harder than almost anything else."
      },
      strength: {
        headline: "Putting in the work but not seeing the strength you expect?",
        sub: "Testosterone, training and recovery work as a team, and progress follows once they are aligned."
      },
      optimise: {
        headline: "Feeling fine, and want to keep it that way?",
        sub: "Staying ahead is far easier than catching up, and a few simple levers keep your hormones working for you."
      }
    },
    women: {
      flushes: {
        headline: "Hot flushes and night sweats throwing off your days and nights?",
        sub: "Flushes are one of the most common signs of the menopause transition, and a few targeted changes can take the edge off."
      },
      mood: {
        headline: "Mood swings, low patches or anxiety that feel unlike you?",
        sub: "Shifting hormones can unsettle mood long before periods stop, and naming it is the first step toward steadying it."
      },
      cycles: {
        headline: "Periods becoming unpredictable, heavier or further apart?",
        sub: "Changing cycles are often the earliest sign of perimenopause, and tracking the pattern tells you a great deal."
      },
      brainfog: {
        headline: "Losing words, names and your train of thought lately?",
        sub: "Brain fog is a real, common part of the hormone transition rather than a sign of decline, and it usually lifts as sleep and stress steady."
      },
      weight: {
        headline: "Weight settling around your middle that wasn't there before?",
        sub: "Hormone shifts change where the body stores fat, even when little else has, so protecting muscle and sleep matters more now."
      },
      energy: {
        headline: "Running on empty in a way that rest doesn't seem to fix?",
        sub: "Fatigue is one of the most common perimenopause symptoms, and one of the most overlooked."
      },
      optimise: {
        headline: "Want to get ahead of the hormone transition?",
        sub: "Understanding what is coming, and laying the groundwork early, makes the whole journey smoother."
      }
    }
  };

  /* STAGE_LEAD: pridedamas sakinys pagal "kur tu esi" (track-neutralus). */
  var STAGE_LEAD = {
    starting:        "You're just getting started, so we'll keep this simple and foundational.",
    normal_but_off:  "You've been told things look 'normal' but you still feel off, and that gap is common and worth taking seriously.",
    have_bloods:     "You've already got some bloodwork, so let's put it to use."
  };

  /* AGE_NOTE: faktinis, be pazadu; pinamas i sub. */
  var AGE_NOTE = {
    men: {
      u30:     "Low testosterone in your 20s usually points to sleep, stress or lifestyle rather than age.",
      '30s':   "Testosterone begins its slow, roughly 1% a year drift in your 30s.",
      '40s':   "By your 40s that slow decline tends to be felt, not just measured.",
      '50s':   "In your 50s, lifestyle levers still move the needle more than most men expect.",
      '60plus':"Past 60, the basics matter more than ever, and they still work."
    },
    women: {
      u30:     "Hormone symptoms before your 30s often trace back to cycles, stress or thyroid.",
      '30s':   "Perimenopause can quietly begin in your late 30s, earlier than most expect.",
      '40s':   "Your 40s are peak perimenopause years, even with regular periods.",
      '50s':   "Around your 50s the menopause transition is usually in full swing.",
      '60plus':"Post-menopause, the focus shifts to protecting long-term health."
    }
  };

  /* ---- 2) LEVER_MAP[track][goal] = 3 svertai ----------------------------- *
   * kind: 'foundation' | 'test' | 'action' (naudojama perrikiavimui pagal stage)*/
  var LEVER_MAP = {
    men: {
      energy: [
        { title: "Protect deep sleep", kind: 'foundation', why: "Most of your testosterone is made during deep sleep, and tired-but-normal almost always traces back here first.", link: "/questions/does-sleep-affect-testosterone" },
        { title: "Confirm the real number", kind: 'test', why: "A standard panel often measures total testosterone alone, and free T plus SHBG is where low energy usually hides.", link: "/questions/what-is-free-testosterone" },
        { title: "Move daily, lift twice a week", kind: 'action', why: "Strength work is one of the most reliable natural ways to support testosterone and energy.", link: "/questions/increase-testosterone-naturally" }
      ],
      libido: [
        { title: "Sort your sleep and stress", kind: 'foundation', why: "Both quietly flatten libido, and both respond quickly once you protect them.", link: "/questions/does-stress-lower-testosterone" },
        { title: "Check your testosterone", kind: 'test', why: "A clear number tells you whether the change is hormonal or something else.", link: "/questions/low-testosterone-symptoms" },
        { title: "Train and eat for hormones", kind: 'action', why: "Strength work and the right foods support the hormones behind drive.", link: "/questions/increase-testosterone-naturally" }
      ],
      mood: [
        { title: "Daylight and movement daily", kind: 'foundation', why: "Both lift mood directly and support healthy testosterone at the same time.", link: "/questions/increase-testosterone-naturally" },
        { title: "Rule the number in or out", kind: 'test', why: "Knowing your testosterone helps separate a hormonal dip from everything else.", link: "/questions/low-testosterone-symptoms" },
        { title: "Tackle your biggest stressor", kind: 'action', why: "Chronic stress and testosterone work against each other.", link: "/questions/does-stress-lower-testosterone" }
      ],
      weight: [
        { title: "Build meals around protein", kind: 'foundation', why: "Protein protects muscle and steadies appetite, which keeps your hormones in a better place.", link: "/questions/foods-that-lower-testosterone" },
        { title: "Check your testosterone", kind: 'test', why: "Low testosterone and stubborn belly fat often travel together.", link: "/questions/low-testosterone-weight-gain" },
        { title: "Lift to protect muscle", kind: 'action', why: "Muscle is metabolically active and supports healthy testosterone.", link: "/questions/does-lifting-increase-testosterone" }
      ],
      sleep: [
        { title: "Anchor your body clock", kind: 'foundation', why: "A fixed wake time and morning daylight steady the sleep your hormones depend on.", link: "/questions/does-sleep-affect-testosterone" },
        { title: "Protect the last hour", kind: 'action', why: "Alcohol and late screens wreck deep sleep, the window where testosterone is made.", link: "/questions/does-alcohol-lower-testosterone" },
        { title: "Check what's underneath", kind: 'test', why: "If sleep is sorted and you are still flat, a blood test is the sensible next step.", link: "/questions/how-long-to-raise-testosterone" }
      ],
      strength: [
        { title: "Progressive strength training", kind: 'foundation', why: "Lifting that gradually gets harder is the strongest natural lever for muscle and testosterone.", link: "/questions/does-lifting-increase-testosterone" },
        { title: "Eat and recover for growth", kind: 'action', why: "Protein and proper recovery are where strength is actually built.", link: "/questions/does-testosterone-build-muscle" },
        { title: "Know your baseline", kind: 'test', why: "A testosterone reading helps explain stalled progress.", link: "/questions/increase-testosterone-naturally" }
      ],
      optimise: [
        { title: "Sleep, daylight, movement", kind: 'foundation', why: "The unglamorous basics move testosterone more than any supplement.", link: "/questions/increase-testosterone-naturally" },
        { title: "Know your numbers", kind: 'test', why: "A baseline today makes every future change measurable.", link: "/questions/normal-testosterone-levels-by-age" },
        { title: "Train with intent", kind: 'action', why: "Two or three strength sessions a week keep your hormones working for you.", link: "/questions/does-lifting-increase-testosterone" }
      ]
    },
    women: {
      flushes: [
        { title: "Find and ease your triggers", kind: 'foundation', why: "Alcohol, caffeine, heat and stress are common flush triggers, and small changes add up.", link: "/questions/what-helps-with-hot-flashes" },
        { title: "Cool your sleep environment", kind: 'action', why: "Night sweats ease when the bedroom is cool and bedding is layered.", link: "/questions/menopause-night-sweats" },
        { title: "Know your proven options", kind: 'test', why: "HRT is the most effective option for flushes, and worth understanding even if you choose not to use it.", link: "/questions/hrt-benefits" }
      ],
      mood: [
        { title: "Steady sleep and daylight", kind: 'foundation', why: "Both stabilise mood directly while hormones are in flux.", link: "/questions/balance-hormones-naturally" },
        { title: "Move your body most days", kind: 'action', why: "Regular movement is one of the most reliable mood levers in perimenopause.", link: "/questions/menopause-fatigue" },
        { title: "Know when to seek support", kind: 'test', why: "Persistent low mood or anxiety deserves a proper conversation about your options.", link: "/questions/can-perimenopause-cause-anxiety" }
      ],
      cycles: [
        { title: "Track your pattern", kind: 'foundation', why: "A simple record of your cycle and symptoms reveals what is actually happening.", link: "/questions/am-i-in-perimenopause" },
        { title: "Support steady blood sugar", kind: 'action', why: "Balanced meals smooth out some of the swings that come with changing cycles.", link: "/questions/balance-hormones-naturally" },
        { title: "Understand your stage", kind: 'test', why: "Knowing whether this is perimenopause guides everything else.", link: "/questions/perimenopause-vs-menopause" }
      ],
      brainfog: [
        { title: "Protect your sleep", kind: 'foundation', why: "Fog usually lifts most when sleep steadies, so this comes first.", link: "/questions/menopause-brain-fog" },
        { title: "Single-task and offload", kind: 'action', why: "One thing at a time, with notes and reminders, works with your brain rather than against it.", link: "/questions/balance-hormones-naturally" },
        { title: "Rule out the usual suspects", kind: 'test', why: "Thyroid, iron and B12 can mimic hormonal fog and are worth checking.", link: "/questions/perimenopause-vs-menopause" }
      ],
      weight: [
        { title: "Protein at every meal", kind: 'foundation', why: "Protein protects the muscle that keeps your metabolism ticking.", link: "/questions/menopause-weight-gain" },
        { title: "Add gentle strength work", kind: 'action', why: "Muscle matters more than ever as hormones shift.", link: "/questions/best-diet-for-menopause" },
        { title: "Look at the whole picture", kind: 'test', why: "Sleep, stress and thyroid all influence midlife weight, not just diet.", link: "/questions/balance-hormones-naturally" }
      ],
      energy: [
        { title: "Anchor your sleep", kind: 'foundation', why: "Steady sleep is the foundation that fatigue recovers from.", link: "/questions/menopause-fatigue" },
        { title: "Move gently and often", kind: 'action', why: "Light, regular movement lifts energy more than rest alone.", link: "/questions/balance-hormones-naturally" },
        { title: "Check the common causes", kind: 'test', why: "Iron, thyroid and B12 are worth ruling out when fatigue lingers.", link: "/questions/supplements-for-menopause" }
      ],
      optimise: [
        { title: "Sleep, daylight, movement", kind: 'foundation', why: "The basics carry you through the transition more than anything else.", link: "/questions/balance-hormones-naturally" },
        { title: "Understand your stage", kind: 'test', why: "Knowing where you are in the transition shapes every choice.", link: "/questions/am-i-in-perimenopause" },
        { title: "Build strength early", kind: 'action', why: "Protecting muscle and bone now pays off for decades.", link: "/questions/best-diet-for-menopause" }
      ]
    }
  };

  /* ---- 3) FOODS biblioteka (tagged) -------------------------------------- *
   * track: 'men' | 'women' | 'both' · goals[] · score 0-100 · limit? · slug?  *
   * slug == null -> linkina i /foods (kol nezinome realiu Foods CMS slug'u).  */
  var FOODS = [
    // --- bendri (both) ---
    { name: "Oily fish (salmon, mackerel, sardines)", score: 95, track: 'both', goals: ['energy','mood','brainfog','sleep','cycles','libido','optimise'], slug: null },
    { name: "Eggs",                 score: 92, track: 'both', goals: ['energy','strength','brainfog','optimise'], slug: null },
    { name: "Leafy greens (spinach, kale)", score: 88, track: 'both', goals: ['sleep','energy','flushes','brainfog','optimise'], slug: null },
    { name: "Berries",              score: 84, track: 'both', goals: ['brainfog','mood','optimise'], slug: null },
    { name: "Avocado",              score: 83, track: 'both', goals: ['energy','mood','weight','optimise'], slug: null },
    { name: "Extra-virgin olive oil", score: 85, track: 'both', goals: ['mood','libido','optimise'], slug: null },
    { name: "Brazil nuts",          score: 82, track: 'both', goals: ['strength','libido','optimise'], slug: null },
    { name: "Pumpkin seeds",        score: 81, track: 'both', goals: ['sleep','strength','cycles','optimise'], slug: null },
    { name: "Greek yoghurt",        score: 80, track: 'both', goals: ['weight','strength','optimise'], slug: null },
    { name: "Lentils & legumes",    score: 82, track: 'both', goals: ['weight','energy','cycles','optimise'], slug: null },
    { name: "Broccoli & cruciferous veg", score: 84, track: 'both', goals: ['weight','cycles','optimise'], slug: null },
    { name: "Fermented foods (kefir, kimchi)", score: 79, track: 'both', goals: ['weight','brainfog','optimise'], slug: null },
    { name: "Dark chocolate (85%+)", score: 76, track: 'both', goals: ['mood','sleep','optimise'], slug: null },
    // --- vyrams ---
    { name: "Oysters",              score: 90, track: 'men', goals: ['libido','strength','optimise'], slug: null },
    { name: "Lean red meat",        score: 84, track: 'men', goals: ['strength','energy','optimise'], slug: null },
    { name: "Pomegranate",          score: 78, track: 'men', goals: ['libido','optimise'], slug: null },
    { name: "Garlic",               score: 74, track: 'men', goals: ['libido','optimise'], slug: null },
    // --- moterims ---
    { name: "Ground flaxseed",      score: 88, track: 'women', goals: ['flushes','cycles','optimise'], slug: null },
    { name: "Oats",                 score: 83, track: 'women', goals: ['sleep','weight','energy','optimise'], slug: null },
    { name: "Almonds",              score: 82, track: 'women', goals: ['flushes','brainfog','weight','optimise'], slug: null },
    { name: "Edamame & soy",        score: 80, track: 'women', goals: ['flushes','cycles','optimise'], slug: null },
    { name: "Sesame seeds & tahini", score: 80, track: 'women', goals: ['cycles','flushes','optimise'], slug: null },
    // --- riboti (limit) ---
    { name: "Sugary drinks & refined sugar", score: 26, track: 'both', goals: ['weight','energy','mood'], limit: true, slug: null },
    { name: "Ultra-processed foods", score: 22, track: 'both', goals: ['weight','energy'], limit: true, slug: null },
    { name: "Alcohol",              score: 18, track: 'both', goals: ['sleep','flushes','energy'], limit: true, slug: null },
    { name: "Processed & cured meats", score: 30, track: 'men', goals: ['optimise'], limit: true, slug: null },
    { name: "Excess or late caffeine", score: 34, track: 'women', goals: ['flushes','sleep'], limit: true, slug: null }
  ];

  /* ---- 4) TOOL_MAP[track][stage] + TOOL_DETAILS -------------------------- */
  var TOOL_MAP = {
    men:   { starting: "/testosterone-test", normal_but_off: "/testosterone-test", have_bloods: "/how-to-read-blood-test-results" },
    women: { starting: "/hormone-quiz",      normal_but_off: "/hormone-quiz",      have_bloods: "/perimenopause-blood-test" }
  };
  var TOOL_DETAILS = {
    "/testosterone-test": { name: "Free Testosterone Test", blurb: "The Vermeulen free-T calculator plus a 19-point symptom check turns 'I feel off' into a number you can act on. About 5 minutes." },
    "/how-to-read-blood-test-results": { name: "How to Read Your Blood Test", blurb: "Make sense of total T, free T, SHBG and oestradiol, and see what is actually optimal rather than just 'in range'." },
    "/hormone-quiz": { name: "Hormone Type Quiz", blurb: "Find which of the five hormone types fits you, and what it means for perimenopause and beyond. About 3 minutes." },
    "/perimenopause-blood-test": { name: "Perimenopause Blood Test Guide", blurb: "Which hormones are worth testing in perimenopause, when to test them, and how to read the results." }
  };

  /* ---- 5) SUPP_MAP[track][goal] = 1-3 supplementai ----------------------- *
   * tier: works|some|unproven · info: /supplements-guide(#anchor) ·           *
   * recommends: /recommends/* (arba null, jei nera affiliate slug'o).         */
  var SUPP_MAP = {
    men: {
      energy: [
        { name: "Vitamin D3 + K2", tier: 'works', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" },
        { name: "Magnesium", tier: 'works', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Ashwagandha", tier: 'some', info: "/supplements-guide#ashwagandha", recommends: "/recommends/ashwagandha" }
      ],
      libido: [
        { name: "Zinc", tier: 'works', info: "/supplements-guide#zinc", recommends: "/recommends/zinc" },
        { name: "Tongkat ali", tier: 'some', info: "/supplements-guide#tongkat-ali", recommends: "/recommends/tongkat-ali" },
        { name: "Boron", tier: 'some', info: "/supplements-guide#boron", recommends: "/recommends/boron" }
      ],
      mood: [
        { name: "Magnesium", tier: 'works', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" },
        { name: "Ashwagandha", tier: 'some', info: "/supplements-guide#ashwagandha", recommends: "/recommends/ashwagandha" }
      ],
      weight: [
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" },
        { name: "Vitamin D3 + K2", tier: 'some', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" },
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" }
      ],
      sleep: [
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Ashwagandha", tier: 'some', info: "/supplements-guide#ashwagandha", recommends: "/recommends/ashwagandha" }
      ],
      strength: [
        { name: "Creatine", tier: 'works', info: "/supplements-guide#creatine", recommends: "/recommends/creatine" },
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" },
        { name: "Vitamin D3 + K2", tier: 'some', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" }
      ],
      optimise: [
        { name: "Vitamin D3 + K2", tier: 'works', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" },
        { name: "Magnesium", tier: 'works', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" }
      ]
    },
    women: {
      flushes: [
        { name: "Vitamin D3 + K2", tier: 'some', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" },
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" }
      ],
      mood: [
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" },
        { name: "Vitamin D3 + K2", tier: 'some', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" }
      ],
      cycles: [
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" },
        // Inositol: jokio /recommends slug'o -> info-only (be affiliate)
        { name: "Inositol", tier: 'some', info: "/questions/does-inositol-help-pcos", recommends: null }
      ],
      brainfog: [
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" },
        { name: "Vitamin B12", tier: 'works', info: "/supplements-guide#vitamin-b12", recommends: "/recommends/vitamin-b12" },
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" }
      ],
      weight: [
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" },
        { name: "Vitamin D3 + K2", tier: 'some', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" },
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" }
      ],
      energy: [
        { name: "Vitamin D3 + K2", tier: 'works', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" },
        { name: "Vitamin B12", tier: 'works', info: "/supplements-guide#vitamin-b12", recommends: "/recommends/vitamin-b12" },
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" }
      ],
      optimise: [
        { name: "Vitamin D3 + K2", tier: 'works', info: "/supplements-guide#vitamin-d", recommends: "/recommends/vitamin-d3-k2" },
        { name: "Magnesium", tier: 'some', info: "/supplements-guide#magnesium", recommends: "/recommends/magnesium" },
        { name: "Omega-3", tier: 'some', info: "/supplements-guide#omega-3", recommends: "/recommends/omega-3" }
      ]
    }
  };

  /* ---- 6) Q_MAP[track][goal] = 3 realūs /questions ----------------------- *
   * label - mano autoriaus tekstas nuorodai (gali nesutapti zodis-i-zodi su CMS).*/
  var Q_MAP = {
    men: {
      energy:   [ {slug:"does-sleep-affect-testosterone", label:"Does sleep affect testosterone?"}, {slug:"low-testosterone-symptoms", label:"What are the symptoms of low testosterone?"}, {slug:"what-causes-low-testosterone", label:"What causes low testosterone?"} ],
      libido:   [ {slug:"low-testosterone-erectile-dysfunction", label:"Low testosterone and erectile issues"}, {slug:"increase-testosterone-naturally", label:"How to raise testosterone naturally"}, {slug:"does-tongkat-ali-work", label:"Does tongkat ali actually work?"} ],
      mood:     [ {slug:"low-testosterone-symptoms", label:"Symptoms of low testosterone"}, {slug:"does-stress-lower-testosterone", label:"Does stress lower testosterone?"}, {slug:"increase-testosterone-naturally", label:"Raising testosterone naturally"} ],
      weight:   [ {slug:"low-testosterone-weight-gain", label:"Low testosterone and weight gain"}, {slug:"foods-that-lower-testosterone", label:"Foods that lower testosterone"}, {slug:"does-sugar-lower-testosterone", label:"Does sugar lower testosterone?"} ],
      sleep:    [ {slug:"does-sleep-affect-testosterone", label:"How sleep affects testosterone"}, {slug:"does-alcohol-lower-testosterone", label:"Does alcohol lower testosterone?"}, {slug:"how-long-to-raise-testosterone", label:"How long does it take to raise testosterone?"} ],
      strength: [ {slug:"does-lifting-increase-testosterone", label:"Does lifting increase testosterone?"}, {slug:"does-testosterone-build-muscle", label:"Does testosterone build muscle?"}, {slug:"increase-testosterone-naturally", label:"Raising testosterone naturally"} ],
      optimise: [ {slug:"increase-testosterone-naturally", label:"How to raise testosterone naturally"}, {slug:"normal-testosterone-levels-by-age", label:"Normal testosterone levels by age"}, {slug:"what-is-free-testosterone", label:"What is free testosterone?"} ]
    },
    women: {
      flushes:  [ {slug:"what-helps-with-hot-flashes", label:"What helps with hot flushes?"}, {slug:"menopause-night-sweats", label:"Easing menopause night sweats"}, {slug:"hrt-benefits", label:"The benefits of HRT"} ],
      mood:     [ {slug:"can-perimenopause-cause-anxiety", label:"Can perimenopause cause anxiety?"}, {slug:"balance-hormones-naturally", label:"Balancing hormones naturally"}, {slug:"menopause-fatigue", label:"Coping with menopause fatigue"} ],
      cycles:   [ {slug:"am-i-in-perimenopause", label:"Am I in perimenopause?"}, {slug:"signs-of-low-progesterone", label:"Signs of low progesterone"}, {slug:"balance-hormones-naturally", label:"Balancing hormones naturally"} ],
      brainfog: [ {slug:"menopause-brain-fog", label:"Why menopause causes brain fog"}, {slug:"perimenopause-vs-menopause", label:"Perimenopause vs menopause"}, {slug:"balance-hormones-naturally", label:"Balancing hormones naturally"} ],
      weight:   [ {slug:"menopause-weight-gain", label:"Why menopause causes weight gain"}, {slug:"best-diet-for-menopause", label:"The best diet for menopause"}, {slug:"balance-hormones-naturally", label:"Balancing hormones naturally"} ],
      energy:   [ {slug:"menopause-fatigue", label:"Coping with menopause fatigue"}, {slug:"magnesium-for-menopause", label:"Magnesium for menopause"}, {slug:"balance-hormones-naturally", label:"Balancing hormones naturally"} ],
      optimise: [ {slug:"am-i-in-perimenopause", label:"Am I in perimenopause?"}, {slug:"perimenopause-vs-menopause", label:"Perimenopause vs menopause"}, {slug:"supplements-for-menopause", label:"Supplements for menopause"} ]
    }
  };

  /* ---- 7) STEP_LIST[`${track}_${goal}`] = svelnūs savaitiniai zingsniai --- *
   * Be kaloriju/skaitiniu tiksliniu (gerovės taisykle). Rotacija per savaites.  */
  var STEP_LIST = {
    men_energy:   [ "Set a fixed wake-up time, even at weekends, for one week.", "Get outside for some daylight within an hour of waking.", "Add a source of protein to your breakfast.", "Swap one late scroll for a proper wind-down.", "Take a short walk after your evening meal." , "Drink a glass of water before your morning coffee.", "Step outside for a few minutes when your energy dips in the afternoon.", "Keep your phone out of the bedroom for one week.", "Batch-cook one easy meal so tired evenings are simpler.", "Take the stairs whenever the option comes up this week.", "Stand up and stretch once an hour while you work.", "Eat your evening meal a little earlier this week.", "Swap one afternoon snack for some fruit and a handful of nuts.", "Get to bed fifteen minutes earlier than usual.", "Open the curtains and let daylight in first thing." ],
    men_libido:   [ "Prioritise a full night's sleep, the foundation for libido.", "Add two strength sessions to your week.", "Ease back on alcohol on weeknights.", "Spend ten quiet minutes a day on something relaxing.", "Add oily fish or a handful of nuts to your week." , "Get outside for daylight early in the day.", "Take a brisk walk most days this week.", "Keep screens out of the bedroom this week.", "Make time for something genuinely relaxing each day.", "Eat more colourful vegetables across the week.", "Have an alcohol-free evening or two this week.", "Wind down properly in the hour before bed.", "Reconnect with your partner away from screens this week.", "Add a handful of pumpkin seeds or some oily fish to your meals.", "Keep a steady sleep and wake time for seven days." ],
    men_mood:     [ "Get outside for daylight early each day.", "Move your body daily, even just a walk.", "Name one stressor and tackle one small part of it.", "Protect your wind-down hour before bed.", "Check in with someone you trust this week." , "Take a walk outdoors in green space this week.", "Write down three things that went well each evening.", "Set a fixed cut-off for news and social media each day.", "Keep a steady sleep and wake time this week.", "Add oily fish or omega-3 to a couple of meals.", "Do one small thing you enjoy every day.", "Try a few minutes of slow breathing when stress builds.", "Ease back on alcohol and notice how your mood responds.", "Plan one thing to look forward to this week.", "Move your body first thing, even just a short stretch." ],
    men_weight:   [ "Build each meal around protein and vegetables.", "Take a walk after your largest meal.", "Keep sugary drinks out of the house this week.", "Add one extra strength session.", "Prioritise sleep, since short nights drive next-day hunger." , "Fill half your plate with vegetables at your main meal.", "Keep tempting snacks out of easy reach this week.", "Drink a glass of water before each meal.", "Eat slowly and pause before going back for seconds.", "Walk a little more each day, even short trips on foot.", "Cook one extra meal at home instead of ordering in.", "Keep some easy protein and fruit ready for hungry moments.", "Have a couple of alcohol-free evenings this week.", "Get morning daylight to steady your appetite rhythms.", "Stand and move for a few minutes every hour." ],
    men_sleep:    [ "Set a fixed wake-up time for seven days straight.", "Stop caffeine after lunch this week.", "Dim the lights for the last hour before bed.", "Keep alcohol off the table on weeknights.", "Get morning daylight to anchor your body clock." , "Keep your bedroom cool and as dark as you can.", "Put screens away in the last hour before bed.", "Get outside for daylight soon after waking.", "Have your evening meal a little earlier this week.", "Keep a wind-down routine you repeat each night.", "Save the bed for sleep, not scrolling or work.", "Take a short walk during the day to sleep better at night.", "Avoid heavy snacks right before bed this week.", "Try a few minutes of slow breathing as you settle.", "Get up at the same time even after a poor night." ],
    men_strength: [ "Get two full-body strength sessions in this week.", "Add protein to each main meal.", "Add one set to your main lifts.", "Prioritise sleep on training days.", "Take a rest day without guilt, since that is when you grow." , "Warm up properly before your main lifts this week.", "Focus on good form rather than heavier loads.", "Spread your protein across the day, not just one meal.", "Walk on your rest days to aid recovery.", "Get to bed earlier on the nights after training.", "Stay well hydrated through your training days.", "Add a few minutes of mobility work after each session.", "Keep a simple note of your sessions to see progress.", "Eat a balanced meal within a couple of hours of training.", "Take a full rest day this week and let your body recover." ],
    men_optimise: [ "Set a consistent sleep and wake time.", "Get daylight early each day.", "Add two strength sessions this week.", "Build meals around protein and colourful veg.", "Keep alcohol to a minimum this week." , "Take a daily walk outdoors this week.", "Drink water steadily through the day.", "Set a screen cut-off in the evening.", "Add oily fish to your week.", "Stand and move for a few minutes every hour.", "Have a couple of alcohol-free days this week.", "Keep a simple wind-down routine before bed.", "Spend a little time outdoors in nature.", "Fill half your plate with vegetables at meals.", "Check in with a friend or loved one this week." ],

    women_flushes:  [ "Notice what tends to trigger your flushes this week.", "Keep your bedroom cool and layer your bedding.", "Ease back on alcohol and see if flushes settle.", "Add ground flaxseed to breakfast a few times this week.", "Try a few minutes of slow breathing when a flush builds." , "Dress in light layers you can remove easily.", "Keep a cool drink of water within reach through the day.", "Notice whether caffeine seems to set off your flushes.", "Keep your bedroom cool and well aired at night.", "Try a few minutes of slow breathing each morning.", "Add soya foods like edamame or tofu to your week.", "Take a gentle walk outdoors most days.", "Wind down calmly in the hour before bed.", "Notice whether spicy food tends to trigger a flush.", "Keep a steady sleep and wake time this week." ],
    women_mood:     [ "Get outside for daylight early each day.", "Move your body daily, even gently.", "Protect a wind-down hour before bed.", "Reach out to someone who steadies you this week.", "Add oily fish or some omega-3 to your week." , "Take a walk outdoors in green space this week.", "Write down three good moments at the end of each day.", "Set a gentle cut-off for news and social media.", "Keep a steady sleep and wake time this week.", "Do one small thing you enjoy each day.", "Try a few minutes of slow breathing when things feel heavy.", "Ease back on alcohol and notice how you feel.", "Add colourful vegetables and berries to your meals.", "Plan one thing to look forward to this week.", "Open the curtains for daylight first thing each morning." ],
    women_cycles:   [ "Keep a simple note of your cycle and symptoms this week.", "Add ground flaxseed or sesame to your day.", "Aim for steady, balanced meals to ease the swings.", "Get gentle movement on the days you feel up to it.", "Protect your sleep, especially before your period." , "Keep some iron-rich foods like leafy greens in your week.", "Stay well hydrated, especially around your period.", "Be gentle with yourself on the harder days of your cycle.", "Take a calm walk outdoors when you feel up to it.", "Keep steady meals to soften energy dips.", "Wind down a little earlier in the days before your period.", "Try slow breathing when cramps or tension build.", "Add oily fish or omega-3 to your week.", "Notice which foods seem to ease or worsen your symptoms.", "Protect a little rest time in your premenstrual week." ],
    women_brainfog: [ "Get morning daylight to sharpen your body clock.", "Add oily fish or berries to your week.", "Do one thing at a time rather than three at once.", "Take a short walk when your head feels foggy.", "Protect your sleep, since fog usually lifts with rest." , "Write tasks down rather than holding them in your head.", "Stay well hydrated through the day.", "Take a short walk outdoors when your head feels heavy.", "Keep a steady sleep and wake time this week.", "Tackle your hardest task when your mind feels clearest.", "Take short breaks rather than pushing through for hours.", "Add colourful vegetables and berries to your meals.", "Ease back on alcohol and notice your clarity.", "Try a few minutes of slow breathing to reset.", "Keep one simple list for the day rather than several." ],
    women_weight:   [ "Build each meal around protein and vegetables.", "Take a short walk after your largest meal.", "Keep sugary drinks out of the house this week.", "Add gentle strength work to protect muscle.", "Prioritise sleep, since it steadies appetite." , "Fill half your plate with vegetables at your main meal.", "Drink a glass of water before each meal.", "Keep tempting snacks out of easy reach this week.", "Eat slowly and notice when you feel comfortably full.", "Add gentle daily movement, even short walks.", "Keep easy protein and fruit ready for hungry moments.", "Cook one more meal at home this week.", "Get morning daylight to steady your appetite rhythms.", "Have a couple of alcohol-free evenings this week.", "Be kind to yourself; small steady changes add up." ],
    women_energy:   [ "Set a steady wake-up time for one week.", "Get daylight within an hour of waking.", "Add a source of protein to breakfast.", "Take a short walk when energy dips, rather than reaching for sugar.", "Wind down properly before bed." , "Drink a glass of water before your morning coffee.", "Step outside for a few minutes when your energy dips.", "Keep your phone out of the bedroom this week.", "Keep some iron-rich foods like leafy greens in your week.", "Take the stairs whenever the chance comes up.", "Stand and stretch once an hour while you work.", "Eat regular, steady meals to avoid energy crashes.", "Get to bed a little earlier than usual.", "Open the curtains for daylight first thing.", "Take a gentle walk outdoors most days." ],
    women_optimise: [ "Set a consistent sleep and wake time.", "Get daylight early each day.", "Add gentle strength work to your week.", "Build meals around protein, fibre and colour.", "Keep alcohol light this week." , "Take a daily walk outdoors this week.", "Drink water steadily through the day.", "Set a gentle screen cut-off in the evening.", "Add oily fish to your week.", "Add ground flaxseed to your day a few times.", "Have a couple of alcohol-free days this week.", "Keep a calm wind-down routine before bed.", "Spend a little time outdoors in nature.", "Fill half your plate with vegetables at meals.", "Check in with someone who lifts you this week." ]
  };

  /* ======================================================================== *
   * LOGIKA
   * ======================================================================== */

  /* Saugus get su 'optimise' fallback. */
  function pick(map, track, goal) {
    var t = map[track] || map.men;
    return t[goal] || t.optimise;
  }

  /* Profilio normalizavimas: niekada negrazina nevalidaus profilio. */
  function normalise(input) {
    input = input || {};
    var track = (input.track === 'women') ? 'women' : 'men';
    var goal = input.goal;
    if (GOALS[track].indexOf(goal) === -1) goal = 'optimise';
    var stage = input.stage;
    if (['starting', 'normal_but_off', 'have_bloods'].indexOf(stage) === -1) stage = 'starting';
    var ageBand = input.ageBand;
    if (['u30', '30s', '40s', '50s', '60plus'].indexOf(ageBand) === -1) ageBand = null;
    return { track: track, goal: goal, stage: stage, ageBand: ageBand };
  }

  /* MIRROR sudejimas: headline + (age note) + sub + (stage lead). */
  function buildMirror(p) {
    var m = pick(MIRROR, p.track, p.goal);
    var bits = [];
    if (p.ageBand && AGE_NOTE[p.track][p.ageBand]) bits.push(AGE_NOTE[p.track][p.ageBand]);
    bits.push(m.sub);
    if (STAGE_LEAD[p.stage]) bits.push(STAGE_LEAD[p.stage]);
    return { headline: m.headline, sub: bits.join(' ') };
  }

  /* Sverto perrikiavimas pagal stage (visada islaiko 3). */
  function reorderLevers(levers, stage) {
    var l = levers.slice();
    if (stage === 'normal_but_off') {            // reikia patvirtinti skaiciu -> 'test' i virsu
      l.sort(function (a, b) { return (b.kind === 'test') - (a.kind === 'test'); });
    } else if (stage === 'have_bloods') {        // jau tyresi -> 'test' i apacia
      l.sort(function (a, b) { return (a.kind === 'test') - (b.kind === 'test'); });
    } else {                                     // starting -> 'foundation' i virsu
      l.sort(function (a, b) { return (b.kind === 'foundation') - (a.kind === 'foundation'); });
    }
    return l;
  }

  function foodHref(f) { return f.slug ? ('/foods/' + f.slug) : '/foods'; }

  /* Maisto atranka: boosters (top5 pagal goal+track+score) + limits (top3). */
  function selectFoods(track, goal) {
    function inTrack(f) { return f.track === track || f.track === 'both'; }

    // BOOSTERS
    var boosters = FOODS.filter(function (f) {
      return !f.limit && inTrack(f) && f.goals.indexOf(goal) !== -1;
    }).sort(function (a, b) { return b.score - a.score; });

    if (boosters.length < 5) {                   // padding is bendro track top-score
      var have = {};
      boosters.forEach(function (f) { have[f.name] = true; });
      var pad = FOODS.filter(function (f) {
        return !f.limit && inTrack(f) && !have[f.name];
      }).sort(function (a, b) { return b.score - a.score; });
      boosters = boosters.concat(pad);
    }
    boosters = boosters.slice(0, 5).map(function (f) {
      return { name: f.name, score: f.score, href: foodHref(f) };
    });

    // LIMITS: goal-relevant pirma, tada bendri; sort asc (blogiausi virsuje)
    var limits = FOODS.filter(function (f) { return f.limit && inTrack(f); })
      .sort(function (a, b) {
        var ra = f_rel(a) ? 1 : 0, rb = f_rel(b) ? 1 : 0;
        if (rb !== ra) return rb - ra;
        return a.score - b.score;
      })
      .slice(0, 3)
      .map(function (f) { return { name: f.name, score: f.score, href: foodHref(f) }; });

    function f_rel(f) { return f.goals.indexOf(goal) !== -1; }

    return { boosters: boosters, limits: limits };
  }

  /* Irankio parinkimas. */
  function selectTool(track, stage) {
    var href = (TOOL_MAP[track] && TOOL_MAP[track][stage]) ||
               (track === 'women' ? '/hormone-quiz' : '/testosterone-test');
    var d = TOOL_DETAILS[href] || { name: '', blurb: '' };
    return { href: href, name: d.name, blurb: d.blurb };
  }

  /* Klausimu parinkimas -> pridedam pilna href. */
  function selectQuestions(track, goal) {
    return pick(Q_MAP, track, goal).map(function (q) {
      return { href: '/questions/' + q.slug, label: q.label };
    });
  }

  /* Savaitiniai zingsniai + sios savaites vienas (rotacija pagal weekIndex). */
  function selectSteps(track, goal, weekIndex) {
    var list = STEP_LIST[track + '_' + goal] || STEP_LIST[track + '_optimise'];
    var idx = (typeof weekIndex === 'number' && weekIndex >= 0) ? (weekIndex % list.length) : 0;
    return { thisWeek: list[idx], all: list.slice() };
  }

  /* Apytikslis "starting estimate" (NE matavimas). Pasirinktinai rodomas. */
  function estimateReadiness(profile) {
    var p = normalise(profile);
    var base = 62;
    if (p.stage === 'have_bloods') base += 4;
    else if (p.stage === 'starting') base -= 3;
    var score = Math.max(38, Math.min(74, base));
    var label = score < 50 ? 'Lots of room to move'
              : (score < 66 ? 'Room to move' : 'A solid base to build on');
    return {
      score: score,
      label: label,
      isEstimate: true,
      note: "A starting estimate from your answers, not a measurement. Your tool result will give you a truer number."
    };
  }


  /* ====================================================================== *
   * NX: pilna turinio biblioteka + kontekstine atranka (visi linkai deep). *
   * Datasets is CMS (slug'ai realūs). Atranka pagal goal keywords + track. *
   * ==================================================================== */
  var DATA_FOODS = [{"name":"Energy drinks","slug":"energy-drinks","effect":"Limit","group":"Drinks","kw":"energy drinks testosterone, caffeine sleep testosterone, energy drinks hormones Cutting them helps anyone relying on them through the afternoon or evening, especially younger men chasing energy and \"gains\""},{"name":"Refined seed oils","slug":"seed-oils","effect":"Limit","group":"Healthy Fats","kw":"seed oils testosterone, vegetable oils hormones, omega-6 inflammation Avoiding them helps anyone eating a lot of fried food, takeaways or packaged products, where these oils hide"},{"name":"Pistachios","slug":"pistachios","effect":"Supports","group":"Nuts & Seeds","kw":"pistachios erectile function, pistachios testosterone, magnesium nuts hormones Men interested in blood-flow and heart health, and anyone wanting a magnesium- and protein-rich snack"},{"name":"Cinnamon","slug":"cinnamon","effect":"Supports","group":"Herbs & Spices","kw":"cinnamon testosterone, cinnamon PCOS, cinnamon insulin blood sugar Women with PCOS or irregular cycles, and anyone with blood-sugar swings or insulin resistance"},{"name":"Tomatoes","slug":"tomatoes","effect":"Supports","group":"Vegetables","kw":"tomatoes testosterone, lycopene prostate, tomatoes sperm quality Men focused on prostate and sperm health, and anyone whose diet is light on brightly coloured, antioxidant-rich vegetables"},{"name":"Bee pollen","slug":"bee-pollen","effect":"Moderation","group":"Superfoods & other","kw":"bee pollen benefits, bee pollen testosterone, bee pollen energy The curious wanting a nutrient-dense natural tonic — with realistic expectations"},{"name":"Camu camu","slug":"camu-camu","effect":"Moderation","group":"Superfoods & other","kw":"camu camu benefits, camu camu vitamin c, antioxidant superfood Anyone wanting a concentrated natural antioxidant and vitamin C source"},{"name":"Celery","slug":"celery","effect":"Moderation","group":"Vegetables","kw":"celery testosterone, celery benefits for men, apigenin The curious wanting a low-calorie, hydrating addition — with realistic expectations"},{"name":"Oat straw (avena sativa)","slug":"oat-straw","effect":"Moderation","group":"Herbs & Spices","kw":"avena sativa benefits, oat straw testosterone, oat straw tonic The curious wanting a calming traditional tonic — with realistic expectations"},{"name":"Raw honey","slug":"raw-honey","effect":"Moderation","group":"Superfoods & other","kw":"honey benefits for men, honey testosterone, raw honey antioxidants Anyone replacing refined sugar with something less processed"},{"name":"Royal jelly","slug":"royal-jelly","effect":"Moderation","group":"Superfoods & other","kw":"royal jelly benefits, royal jelly testosterone, royal jelly fertility The curious wanting a traditional tonic — with realistic expectations"},{"name":"Maca","slug":"maca","effect":"Moderation","group":"Superfoods & other","kw":"maca root benefits, maca libido, maca for hormones Men and women wanting a libido and energy nudge; women in perimenopause"},{"name":"Saffron","slug":"saffron","effect":"Moderation","group":"Herbs & Spices","kw":"saffron benefits, saffron libido, saffron mood pms Anyone with low mood or libido; women with PMS symptoms"},{"name":"Fenugreek","slug":"fenugreek","effect":"Moderation","group":"Herbs & Spices","kw":"fenugreek benefits, fenugreek testosterone, fenugreek for women Men and women with low libido; men supporting strength training"},{"name":"Cacao nibs","slug":"cacao-nibs","effect":"Supports","group":"Superfoods & other","kw":"cacao nibs benefits, raw cacao magnesium, cocoa flavonoids Anyone who wants chocolate's benefits without the sugar trade-off"},{"name":"Seaweed","slug":"seaweed","effect":"Supports","group":"Vegetables","kw":"seaweed iodine thyroid, seaweed estrogen, iodine hormones Anyone low on iodine; those supporting thyroid health"},{"name":"Kimchi & sauerkraut","slug":"kimchi","effect":"Supports","group":"Fermented","kw":"kimchi benefits, fermented foods hormones, gut health estrogen Anyone supporting gut health; women interested in healthy estrogen metabolism"},{"name":"Miso","slug":"miso","effect":"Moderation","group":"Fermented","kw":"miso benefits, fermented soy, miso probiotics Anyone wanting a gut-friendly flavour base; women seeking dietary phytoestrogens"},{"name":"Tempeh","slug":"tempeh","effect":"Supports","group":"Fermented","kw":"tempeh benefits, tempeh estrogen, fermented soy protein Anyone wanting high-quality plant protein; women seeking dietary phytoestrogens"},{"name":"Natto","slug":"natto","effect":"Supports","group":"Fermented","kw":"natto benefits, natto estrogen, fermented soy menopause Women navigating perimenopause and menopause; anyone wanting K2 and gut benefits"},{"name":"Licorice (real / black)","slug":"licorice","effect":"Limit","group":"Herbs & Spices","kw":"licorice testosterone, does licorice lower testosterone, glycyrrhizin hormones Regular consumers of real black licorice or licorice-root tea/supplements"},{"name":"Refined flour & white bread","slug":"refined-flour","effect":"Limit","group":"Grains & carbs","kw":"refined carbs testosterone, white bread hormones, refined flour insulin Anyone basing meals on white bread, pastries and refined-flour products"},{"name":"Ultra-processed foods","slug":"ultra-processed-foods","effect":"Limit","group":"Limit","kw":"ultra processed food hormones, processed food testosterone, ultra processed insulin Anyone whose diet is built mainly on packaged, ready-to-eat products"},{"name":"Processed meat","slug":"processed-meat","effect":"Limit","group":"Meat & Eggs","kw":"processed meat testosterone, processed meat hormones, cured meat sperm Regular eaters of bacon, sausages, salami, hot dogs and deli meats"},{"name":"Fast food & fried food","slug":"fast-food","effect":"Limit","group":"Limit","kw":"fast food testosterone, fried food hormones, junk food testosterone Frequent fast-food and deep-fried-food eaters"},{"name":"Trans fats & margarine","slug":"trans-fats","effect":"Limit","group":"Limit","kw":"trans fats testosterone, margarine hormones, partially hydrogenated oils Anyone eating processed baked goods, fried fast food, or old hydrogenated margarines"},{"name":"Sugary drinks","slug":"sugary-drinks","effect":"Limit","group":"Drinks","kw":"sugary drinks hormones, soda testosterone, liquid sugar insulin Daily soda/juice/energy-drink consumers"},{"name":"Added sugar","slug":"added-sugar","effect":"Limit","group":"Limit","kw":"sugar and testosterone, does sugar lower testosterone, sugar insulin hormones Anyone with a high-sugar diet, insulin resistance, or PCOS"},{"name":"Beer","slug":"beer","effect":"Limit","group":"Drinks","kw":"beer and testosterone, does beer cause estrogen, beer hormones Daily beer drinkers; the \"few pints every night\" pattern"},{"name":"Alcohol (spirits & hard liquor)","slug":"alcohol","effect":"Limit","group":"Drinks","kw":"does alcohol lower testosterone, alcohol and testosterone, alcohol hormones Anyone drinking heavily or daily; the effect is dose-dependent"},{"name":"Water","slug":"water","effect":"Supports","group":"Drinks","kw":"hydration cortisol, water hormones, dehydration testosterone Everyone — especially the active and anyone who runs on coffee"},{"name":"Coffee","slug":"coffee","effect":"Moderation","group":"Drinks","kw":"coffee testosterone, caffeine testosterone, coffee cortisol Active people using it pre-exercise; moderate coffee drinkers"},{"name":"Green tea","slug":"green-tea","effect":"Supports","group":"Drinks","kw":"green tea testosterone, green tea estrogen, green tea antioxidants Anyone wanting antioxidants and a gentle, calm energy lift"},{"name":"Dark chocolate (70 %+)","slug":"dark-chocolate","effect":"Moderation","group":"Superfoods & other","kw":"dark chocolate testosterone, cocoa testosterone, magnesium chocolate Anyone low on magnesium, or replacing sugary snacks"},{"name":"Turmeric","slug":"turmeric","effect":"Supports","group":"Herbs & Spices","kw":"turmeric testosterone, turmeric estrogen, curcumin inflammation Anyone with inflammation; those protecting reproductive-cell health"},{"name":"Ginger","slug":"ginger","effect":"Supports","group":"Herbs & Spices","kw":"ginger testosterone, ginger benefits for men, ginger fertility Men focused on fertility; anyone with inflammation or digestive issues"},{"name":"Sweet potato","slug":"sweet-potato","effect":"Supports","group":"Grains & carbs","kw":"sweet potato testosterone, vitamin a testosterone, complex carbs hormones Active people; anyone wanting a nutrient-dense carb over refined options"},{"name":"Brown rice","slug":"brown-rice","effect":"Supports","group":"Grains & carbs","kw":"brown rice testosterone, complex carbs hormones, whole grains magnesium Active people; anyone replacing refined carbs"},{"name":"Quinoa","slug":"quinoa","effect":"Supports","group":"Grains & carbs","kw":"quinoa hormones, quinoa protein minerals, complex carbs testosterone Anyone wanting protein-rich, mineral-dense complex carbs"},{"name":"Oats","slug":"oats","effect":"Supports","group":"Grains & carbs","kw":"oats testosterone, oats magnesium, complex carbs hormones Anyone needing steady energy; active people fuelling training"},{"name":"Bananas","slug":"bananas","effect":"Supports","group":"Fruit","kw":"bananas testosterone, banana b6 pms, carbs cortisol Active people; anyone needing convenient clean-carb energy"},{"name":"Citrus","slug":"citrus","effect":"Supports","group":"Fruit","kw":"citrus vitamin c hormones, vitamin c cortisol, oranges testosterone Anyone under stress or wanting to support cortisol balance"},{"name":"Cherries (tart)","slug":"cherries","effect":"Supports","group":"Fruit","kw":"tart cherry sleep, cherries melatonin, sleep testosterone Anyone with poor sleep or exercise-related inflammation"},{"name":"Watermelon","slug":"watermelon","effect":"Supports","group":"Fruit","kw":"watermelon testosterone, watermelon citrulline, citrulline blood flow Anyone focused on circulation and blood flow; hot-weather hydration"},{"name":"Pomegranate","slug":"pomegranate","effect":"Supports","group":"Fruit","kw":"pomegranate testosterone, pomegranate juice testosterone, pomegranate polyphenols Anyone focused on circulation, antioxidants, or a gentle hormone nudge"},{"name":"Blueberries & berries","slug":"blueberries","effect":"Supports","group":"Fruit","kw":"berries testosterone, blueberries hormones, antioxidants testosterone Anyone wanting a low-sugar fruit that protects hormone-producing cells"},{"name":"Onions","slug":"onions","effect":"Supports","group":"Vegetables","kw":"onions testosterone, onion juice testosterone, quercetin antioxidant Anyone wanting flavour-led hormone and gut support"},{"name":"Garlic","slug":"garlic","effect":"Supports","group":"Vegetables","kw":"garlic testosterone, does garlic boost testosterone, garlic cortisol Anyone wanting flavour-led hormone and immune support"},{"name":"Mushrooms","slug":"mushrooms","effect":"Supports","group":"Vegetables","kw":"mushrooms estrogen, white button mushrooms testosterone, mushrooms vitamin d Anyone low on vitamin D; those interested in estrogen balance"},{"name":"Beets","slug":"beets","effect":"Supports","group":"Vegetables","kw":"beetroot testosterone, beets nitric oxide, beetroot blood flow Anyone focused on circulation, exercise performance, or blood pressure"},{"name":"Asparagus","slug":"asparagus","effect":"Supports","group":"Vegetables","kw":"asparagus testosterone, asparagus fertility, asparagus folate Anyone supporting fertility, gut health, or folate intake"},{"name":"Kale","slug":"kale","effect":"Supports","group":"Vegetables","kw":"kale hormones, kale estrogen, leafy greens hormones Anyone wanting cruciferous + leafy-green benefits in one vegetable"},{"name":"Cauliflower","slug":"cauliflower","effect":"Supports","group":"Vegetables","kw":"cauliflower estrogen, cruciferous vegetables, low carb swap hormones Anyone wanting cruciferous benefits in a mild, adaptable form"},{"name":"Brussels sprouts","slug":"brussels-sprouts","effect":"Supports","group":"Vegetables","kw":"brussels sprouts estrogen, cruciferous vegetables, DIM foods Anyone managing estrogen balance; those wanting more cruciferous variety"},{"name":"Broccoli","slug":"broccoli","effect":"Supports","group":"Vegetables","kw":"broccoli estrogen, cruciferous vegetables estrogen, DIM foods Anyone managing estrogen balance or excess (men and women)"},{"name":"Spinach & leafy greens","slug":"spinach","effect":"Supports","group":"Vegetables","kw":"spinach testosterone, leafy greens magnesium, magnesium testosterone Anyone low on magnesium (most people) or iron"},{"name":"Beans","slug":"beans","effect":"Supports","group":"Legumes","kw":"beans hormones, beans gut health, legumes blood sugar Anyone steadying blood sugar or supporting gut health"},{"name":"Soy, tofu & edamame","slug":"soy-tofu","effect":"Supports","group":"Legumes","kw":"does soy increase estrogen, is soy bad for men, soy for menopause Women in menopause; anyone wanting complete plant protein"},{"name":"Chickpeas","slug":"chickpeas","effect":"Supports","group":"Legumes","kw":"chickpeas hormones, chickpeas blood sugar, legumes protein Anyone steadying blood sugar; plant-forward eaters"},{"name":"Lentils","slug":"lentils","effect":"Supports","group":"Legumes","kw":"lentils hormones, legumes and testosterone, lentils blood sugar Anyone steadying blood sugar; plant-forward eaters needing iron and zinc"},{"name":"Chia seeds","slug":"chia-seeds","effect":"Supports","group":"Nuts & Seeds","kw":"chia seeds hormones, chia blood sugar, chia omega-3 Anyone managing blood sugar, energy dips or digestion"},{"name":"Sesame seeds","slug":"sesame-seeds","effect":"Supports","group":"Nuts & Seeds","kw":"sesame seeds estrogen, sesame lignans, tahini calcium Postmenopausal women; anyone wanting plant calcium and zinc"},{"name":"Flaxseed","slug":"flaxseed","effect":"Supports","group":"Nuts & Seeds","kw":"flaxseed estrogen, flax seeds menopause, flaxseed for hormones Women managing menopausal symptoms or estrogen balance"},{"name":"Pumpkin seeds","slug":"pumpkin-seeds","effect":"Supports","group":"Nuts & Seeds","kw":"pumpkin seeds testosterone, pumpkin seeds zinc, pumpkin seeds magnesium Anyone low on magnesium or zinc; men supporting prostate health"},{"name":"Brazil nuts","slug":"brazil-nuts","effect":"Supports","group":"Nuts & Seeds","kw":"brazil nuts testosterone, brazil nuts selenium, selenium thyroid Almost everyone — selenium shortfall is common and easily fixed"},{"name":"Almonds","slug":"almonds","effect":"Supports","group":"Nuts & Seeds","kw":"almonds testosterone, almonds magnesium, vitamin e hormones Anyone low on magnesium or vitamin E; snackers seeking a better default"},{"name":"Walnuts","slug":"walnuts","effect":"Supports","group":"Nuts & Seeds","kw":"walnuts testosterone, walnuts sperm quality, walnuts omega-3 Men focused on fertility; anyone short on plant omega-3s"},{"name":"Extra-virgin olive oil","slug":"extra-virgin-olive-oil","effect":"Supports","group":"Healthy Fats","kw":"olive oil testosterone, does olive oil boost testosterone, extra virgin olive oil hormones Everyone — one of the simplest, best-evidenced hormone-supporting fats"},{"name":"Avocado","slug":"avocado","effect":"Supports","group":"Healthy Fats","kw":"avocado testosterone, avocado boron, avocado for hormones Anyone on a low-fat diet; those wanting boron and healthy fats together"},{"name":"Kefir","slug":"kefir","effect":"Supports","group":"Dairy","kw":"kefir benefits hormones, kefir probiotics gut, kefir estrogen Anyone prioritising gut health and the gut–hormone connection"},{"name":"Greek yogurt","slug":"greek-yogurt","effect":"Supports","group":"Dairy","kw":"greek yogurt hormones, yogurt probiotics gut, yogurt protein Anyone supporting gut health, protein intake, or bones"},{"name":"Shrimp & prawns","slug":"shrimp","effect":"Supports","group":"Seafood","kw":"shrimp benefits, prawns protein, selenium foods Anyone wanting high-protein, low-fat seafood with useful trace minerals"},{"name":"Mackerel","slug":"mackerel","effect":"Supports","group":"Seafood","kw":"mackerel benefits, mackerel omega-3, fatty fish testosterone Anyone wanting maximum omega-3 and vitamin D per serving"},{"name":"Sardines","slug":"sardines","effect":"Supports","group":"Seafood","kw":"sardines benefits, sardines testosterone, omega-3 hormones Anyone wanting the salmon benefits on a budget, and women building bone strength"},{"name":"Salmon","slug":"salmon","effect":"Supports","group":"Seafood","kw":"salmon testosterone, fatty fish testosterone, omega-3 hormones Anyone short on oily fish or sunlight — most people living in northern climates"},{"name":"Liver & organ meats","slug":"liver","effect":"Supports","group":"Meat & Eggs","kw":"beef liver benefits, organ meat hormones, liver vitamin a Anyone running low on iron, B12 or vitamin A — quietly common"},{"name":"Chicken & turkey","slug":"chicken","effect":"Supports","group":"Meat & Eggs","kw":"chicken protein testosterone, lean protein hormones, turkey benefits Anyone building or protecting muscle on a leaner diet"},{"name":"Grass-fed beef","slug":"grass-fed-beef","effect":"Supports","group":"Meat & Eggs","kw":"does beef increase testosterone, red meat and testosterone, grass fed beef hormones Men on low-meat diets; women prone to low iron"},{"name":"Eggs","slug":"eggs","effect":"Supports","group":"Meat & Eggs","kw":"do eggs increase testosterone, eggs and testosterone, egg yolk hormones Anyone relying on egg-white-only or low-fat breakfasts"},{"name":"Oysters","slug":"oysters","effect":"Supports","group":"Seafood","kw":"oysters testosterone, do oysters increase testosterone, zinc foods testosterone Anyone eating little red meat or shellfish — the pattern most likely to run low on zinc"}];
  var DATA_QUESTIONS = [{"name":"What are the benefits of collagen?","slug":"collagen-benefits","cat":"Both","kw":"collagen benefits skin joints bone peptides menopause hydrolysed elasticity protein What Are the Benefits of Collagen?"},{"name":"Does inositol help with PCOS?","slug":"does-inositol-help-pcos","cat":"Both","kw":"inositol PCOS myo-inositol insulin resistance ovulation cycle fertility D-chiro Does Inositol Help With PCOS? What Studies Show"},{"name":"What are the benefits of maca root?","slug":"maca-root-benefits","cat":"Both","kw":"maca root benefits libido energy menopause fertility Peruvian adaptogen mood What Are the Benefits of Maca Root?"},{"name":"Does magnesium help you sleep?","slug":"does-magnesium-help-sleep","cat":"Both","kw":"magnesium sleep glycinate citrate insomnia GABA deficiency relaxation evening Does Magnesium Help You Sleep? What Evidence Says"},{"name":"Should women take creatine?","slug":"should-women-take-creatine","cat":"Both","kw":"creatine for women monohydrate menopause muscle strength cognition safety bulky Should Women Take Creatine? What the Science Says"},{"name":"What are the side effects of ashwagandha?","slug":"ashwagandha-side-effects","cat":"Both","kw":"ashwagandha side effects safety thyroid liver pregnancy sedation KSM-66 drowsiness What Are the Side Effects of Ashwagandha?"},{"name":"What foods should you avoid during menopause?","slug":"foods-to-avoid-during-menopause","cat":"Women","kw":"foods to avoid menopause alcohol caffeine spicy sugar hot flushes triggers What Foods Should You Avoid During Menopause?"},{"name":"When should you start HRT?","slug":"when-to-start-hrt","cat":"Women","kw":"when to start HRT timing window of opportunity age perimenopause NICE When Should You Start HRT? Timing Explained"},{"name":"How can you increase low estrogen naturally?","slug":"how-to-increase-estrogen-naturally","cat":"Women","kw":"increase estrogen oestrogen naturally phytoestrogens soy flaxseed low estrogen menopause How to Increase Low Estrogen Naturally"},{"name":"How long do menopause symptoms last?","slug":"how-long-do-menopause-symptoms-last","cat":"Women","kw":"menopause symptoms duration how long perimenopause years hot flushes SWAN How Long Do Menopause Symptoms Last?"},{"name":"Why am I so tired? Menopause fatigue explained","slug":"menopause-fatigue","cat":"Women","kw":"menopause fatigue tiredness exhaustion sleep thyroid iron anaemia energy Why Am I So Tired? Menopause Fatigue Explained"},{"name":"What are the signs of a hormonal imbalance?","slug":"hormone-imbalance-symptoms","cat":"Women","kw":"hormonal imbalance symptoms hormone signs women perimenopause thyroid PCOS What Are the Signs of a Hormonal Imbalance?"},{"name":"What causes night sweats in menopause?","slug":"menopause-night-sweats","cat":"Women","kw":"menopause night sweats hot flushes vasomotor estrogen sleep thermostat hypothalamus What Causes Night Sweats in Menopause?"},{"name":"Does sugar lower testosterone?","slug":"does-sugar-lower-testosterone","cat":"Men","kw":"sugar testosterone insulin glucose refined carbs blood sugar diet Does Sugar Lower Testosterone? What Happens"},{"name":"Can low testosterone cause weight gain or belly fat?","slug":"low-testosterone-weight-gain","cat":"Men","kw":"low testosterone weight gain belly fat visceral insulin aromatase obesity Can Low Testosterone Cause Weight Gain or Belly Fat?"},{"name":"Does testosterone actually build muscle?","slug":"does-testosterone-build-muscle","cat":"Men","kw":"testosterone muscle growth hypertrophy protein synthesis training anabolic gains Does Testosterone Actually Build Muscle?"},{"name":"What are the side effects of TRT?","slug":"trt-side-effects","cat":"Men","kw":"TRT testosterone replacement therapy side effects haematocrit fertility acne breast What Are the Side Effects of TRT?"},{"name":"What are the symptoms of high testosterone?","slug":"high-testosterone-symptoms","cat":"Men","kw":"high testosterone symptoms excess androgens steroids haematocrit acne aggression What Are the Symptoms of High Testosterone?"},{"name":"How can men lower high estrogen?","slug":"how-to-lower-estrogen-in-men","cat":"Men","kw":"estrogen oestrogen aromatase men gynecomastia body fat alcohol lower How Can Men Lower High Estrogen? What Works"},{"name":"Does fenugreek boost testosterone?","slug":"does-fenugreek-boost-testosterone","cat":"Men","kw":"fenugreek testofen seed extract libido saponins herb free testosterone Does Fenugreek Boost Testosterone? What Trials Show"},{"name":"Can low testosterone cause erectile dysfunction?","slug":"low-testosterone-erectile-dysfunction","cat":"Men","kw":"erectile dysfunction ED libido blood flow vascular impotence sex drive Can Low Testosterone Cause Erectile Dysfunction?"},{"name":"Do women need testosterone too?","slug":"do-women-need-testosterone","cat":"Women","kw":"women testosterone female libido energy mood menopause low Do Women Need Testosterone Too?"},{"name":"What foods increase estrogen?","slug":"foods-that-increase-estrogen","cat":"Women","kw":"foods estrogen oestrogen phytoestrogens soy flaxseed lignans isoflavones legumes What Foods Increase Estrogen?"},{"name":"What are the symptoms of PCOS?","slug":"pcos-symptoms","cat":"Women","kw":"pcos polycystic ovary syndrome irregular periods acne hirsutism insulin resistance fertility What Are the Symptoms of PCOS?"},{"name":"What is DIM and does it help with estrogen?","slug":"what-is-dim-supplement","cat":"Women","kw":"dim diindolylmethane broccoli cruciferous estrogen oestrogen supplement What Is DIM and Does It Help With Estrogen?"},{"name":"Are bioidentical hormones safe?","slug":"are-bioidentical-hormones-safe","cat":"Women","kw":"bioidentical body identical hormones cbht compounded safe natural saliva Are Bioidentical Hormones Safe? The Key Distinction"},{"name":"At what age does menopause start?","slug":"what-age-does-menopause-start","cat":"Women","kw":"age menopause start 51 average early premature poi forties when At What Age Does Menopause Start?"},{"name":"What are the symptoms of low estrogen?","slug":"low-estrogen-symptoms","cat":"Women","kw":"low estrogen oestrogen symptoms signs deficiency dryness mood What Are the Symptoms of Low Estrogen?"},{"name":"What supplements help with menopause?","slug":"supplements-for-menopause","cat":"Women","kw":"menopause supplements vitamin d calcium magnesium omega 3 black cohosh red clover What Supplements Help With Menopause?"},{"name":"What are the side effects of HRT?","slug":"hrt-side-effects","cat":"Women","kw":"hrt side effects risks spotting bleeding breast tenderness nausea headaches transdermal What Are the Side Effects of HRT?"},{"name":"What are the benefits of HRT?","slug":"hrt-benefits","cat":"Women","kw":"hrt benefits hormone replacement therapy bones osteoporosis symptoms relief What Are the Benefits of HRT?"},{"name":"Why is my hair thinning in menopause?","slug":"menopause-hair-loss","cat":"Women","kw":"hair loss thinning menopause oestrogen androgens minoxidil iron thyroid Menopause Hair Loss: Why It Happens and What Helps"},{"name":"Why do you gain weight in menopause (and how to lose it)?","slug":"menopause-weight-gain","cat":"Women","kw":"menopause weight gain belly fat metabolism lose weight midlife protein Menopause Weight Gain: Why It Happens and How to Lose It"},{"name":"How can you balance your hormones naturally?","slug":"balance-hormones-naturally","cat":"Women","kw":"balance hormones naturally detox diet sleep stress insulin imbalance How to Balance Your Hormones Naturally"},{"name":"What are the symptoms of estrogen dominance?","slug":"estrogen-dominance-symptoms","cat":"Women","kw":"estrogen oestrogen dominance progesterone heavy periods pms bloating breast tenderness Symptoms of Estrogen Dominance: What to Know"},{"name":"Does HRT cause weight gain?","slug":"does-hrt-cause-weight-gain","cat":"Women","kw":"hrt weight gain bloating fluid retention metabolism belly Does HRT Cause Weight Gain? What the Evidence Says"},{"name":"What helps with hot flashes?","slug":"what-helps-with-hot-flashes","cat":"Women","kw":"hot flashes flushes night sweats triggers hrt cooling relief treatment What Helps With Hot Flashes? What Actually Works"},{"name":"What are the symptoms of menopause?","slug":"menopause-symptoms","cat":"Women","kw":"menopause symptoms hot flushes night sweats vaginal dryness mood oestrogen estrogen list What Are the Symptoms of Menopause?"},{"name":"What are the first signs of perimenopause?","slug":"first-signs-of-perimenopause","cat":"Women","kw":"perimenopause first signs early symptoms periods irregular forties beginning start What Are the First Signs of Perimenopause?"},{"name":"Do I have low testosterone? How to tell.","slug":"do-i-have-low-testosterone","cat":"Men","kw":"do i have low t am i low check quiz test symptoms how to tell diagnose Do I Have Low Testosterone? How to Tell"},{"name":"Do testosterone supplements actually work?","slug":"do-testosterone-supplements-work","cat":"Men","kw":"supplements pills capsules work evidence deficiency Do Testosterone Supplements Actually Work?"},{"name":"What foods increase testosterone?","slug":"foods-that-increase-testosterone","cat":"Men","kw":"food diet eggs oysters zinc vitamin d salmon nuts olive oil meat nutrition What Foods Increase Testosterone?"},{"name":"What's the best testosterone booster — and do they work?","slug":"best-testosterone-booster","cat":"Men","kw":"booster supplement pills tribulus fadogia work scam Best Testosterone Booster: Do They Actually Work?"},{"name":"How can you increase testosterone naturally?","slug":"increase-testosterone-naturally","cat":"Men","kw":"boost raise naturally lifestyle increase higher levels diet exercise How to Increase Testosterone Naturally"},{"name":"What are the signs and symptoms of low testosterone?","slug":"low-testosterone-symptoms","cat":"Men","kw":"low t symptoms signs erectile dysfunction morning erections belly fat motivation hypogonadism Signs and Symptoms of Low Testosterone"},{"name":"Am I in perimenopause? How to tell.","slug":"am-i-in-perimenopause","cat":"Women","kw":"am i in perimenopause how to tell check signs quiz starting Am I in Perimenopause? How to Tell"},{"name":"What are the signs of low progesterone?","slug":"signs-of-low-progesterone","cat":"Women","kw":"low progesterone signs symptoms sleep anxiety pms periods perimenopause gaba Signs of Low Progesterone: What to Look For"},{"name":"Can you get pregnant during perimenopause?","slug":"pregnant-during-perimenopause","cat":"Women","kw":"pregnant pregnancy perimenopause fertility conceive contraception ovulation Can You Get Pregnant During Perimenopause?"},{"name":"What's the best diet for menopause?","slug":"best-diet-for-menopause","cat":"Women","kw":"diet menopause mediterranean food nutrition protein eating weight What's the Best Diet for Menopause?"},{"name":"Does seed cycling actually balance hormones?","slug":"does-seed-cycling-work","cat":"Women","kw":"seed cycling flax pumpkin sesame sunflower hormones balance Does Seed Cycling Actually Balance Hormones?"},{"name":"How can you boost libido during menopause?","slug":"boost-libido-during-menopause","cat":"Women","kw":"libido sex drive desire menopause dryness vaginal oestrogen testosterone How to Boost Libido During Menopause"},{"name":"Does magnesium help with menopause?","slug":"magnesium-for-menopause","cat":"Women","kw":"magnesium glycinate citrate menopause sleep mood cramps supplement Does Magnesium Help With Menopause? What It Can Do"},{"name":"Why do I get brain fog in menopause?","slug":"menopause-brain-fog","cat":"Women","kw":"brain fog memory concentration forgetful menopause focus cognitive words Menopause Brain Fog: Why It Happens and What Helps"},{"name":"Are heart palpitations normal in perimenopause?","slug":"perimenopause-heart-palpitations","cat":"Women","kw":"heart palpitations flutter racing skipped beats perimenopause menopause ecg Are Heart Palpitations Normal in Perimenopause?"},{"name":"Does menopause cause joint pain?","slug":"menopause-joint-pain","cat":"Women","kw":"joint pain aches stiffness menopause arthralgia knees hands inflammation Does Menopause Cause Joint Pain? Why Your Joints Ache"},{"name":"Can perimenopause cause anxiety?","slug":"can-perimenopause-cause-anxiety","cat":"Women","kw":"anxiety panic perimenopause menopause mood worry nervous gaba progesterone Can Perimenopause Cause Anxiety? Why It Happens"},{"name":"What's the difference: perimenopause vs menopause?","slug":"perimenopause-vs-menopause","cat":"Women","kw":"perimenopause vs menopause difference postmenopause transition stages Perimenopause vs Menopause: What's the Difference?"},{"name":"Does masturbation lower testosterone?","slug":"does-masturbation-lower-testosterone","cat":"Men","kw":"masturbation nofap ejaculation abstinence semen retention porn sex Does Masturbation Lower Testosterone? The Honest Answer"},{"name":"What foods lower your testosterone?","slug":"foods-that-lower-testosterone","cat":"Men","kw":"foods lower processed sugar trans fat dairy mint alcohol diet What Foods Lower Your Testosterone? The Real Culprits"},{"name":"Can TRT make you infertile?","slug":"does-trt-cause-infertility","cat":"Men","kw":"trt infertility sperm fertility hcg clomiphene enclomiphene children sperm count Can TRT Make You Infertile? What to Know First"},{"name":"Does boron raise testosterone?","slug":"does-boron-raise-testosterone","cat":"Men","kw":"boron mineral trace shbg free testosterone supplement Does Boron Raise Testosterone? What the Studies Say"},{"name":"What blood test checks your testosterone?","slug":"testosterone-blood-test","cat":"Men","kw":"blood test panel lab total free shbg lh fsh oestradiol at-home kit check levels What Blood Test Checks Your Testosterone?"},{"name":"Does tongkat ali boost testosterone?","slug":"does-tongkat-ali-work","cat":"Men","kw":"tongkat ali eurycoma longjack longifolia herb shbg eurycomanone Does Tongkat Ali Boost Testosterone? The Evidence"},{"name":"Does ashwagandha raise testosterone?","slug":"does-ashwagandha-raise-testosterone","cat":"Men","kw":"ashwagandha ksm-66 sensoril adaptogen cortisol herb stress Does Ashwagandha Raise Testosterone? What Studies Show"},{"name":"What causes low testosterone?","slug":"what-causes-low-testosterone","cat":"Men","kw":"causes reasons low t hypogonadism diabetes thyroid sleep apnoea steroids obesity What Causes Low Testosterone? The Main Reasons"},{"name":"Does lifting weights increase testosterone?","slug":"does-lifting-increase-testosterone","cat":"Men","kw":"lifting weights resistance training gym exercise compound squats muscle workout Does Lifting Weights Increase Testosterone?"},{"name":"Does soy lower testosterone?","slug":"does-soy-lower-testosterone","cat":"Men","kw":"soy tofu edamame isoflavones estrogen myth plant Does Soy Lower Testosterone? Debunking the Myth"},{"name":"What does SHBG mean on a blood test?","slug":"what-is-shbg","cat":"Men","kw":"shbg sex hormone binding globulin high low binding protein thyroid insulin What Does SHBG Mean on a Blood Test?"},{"name":"What is free testosterone (and why it matters)?","slug":"what-is-free-testosterone","cat":"Men","kw":"free testosterone bioavailable shbg albumin bound unbound calculator What Is Free Testosterone (and Why It Matters)?"},{"name":"Does vitamin D raise testosterone?","slug":"does-vitamin-d-raise-testosterone","cat":"Men","kw":"vitamin d sunshine deficiency supplement winter d3 Does Vitamin D Raise Testosterone? What the Evidence Says"},{"name":"Can low testosterone cause hair loss?","slug":"low-testosterone-hair-loss","cat":"Men","kw":"hair loss balding receding hairline dht finasteride genetics beard Can Low Testosterone Cause Hair Loss? The Real Answer"},{"name":"Does alcohol lower testosterone?","slug":"does-alcohol-lower-testosterone","cat":"Men","kw":"alcohol beer wine drinking liver hops estrogen binge Does Alcohol Lower Testosterone? How Much Is Too Much"},{"name":"Can you raise testosterone after 50?","slug":"raise-testosterone-after-50","cat":"Men","kw":"after 50 over 50 older age 60 increase boost senior elderly andropause Can You Raise Testosterone After 50? Yes — Here's How"},{"name":"Is morning testosterone really higher than evening?","slug":"morning-vs-evening-testosterone","cat":"Men","kw":"morning evening diurnal rhythm timing test time 10am peak Is Morning Testosterone Higher Than Evening? Why"},{"name":"Does too much cardio lower testosterone?","slug":"does-cardio-lower-testosterone","cat":"Men","kw":"cardio running endurance marathon ultra exercise overtraining aerobic Does Too Much Cardio Lower Testosterone? The Real Answer"},{"name":"Does poor sleep lower testosterone?","slug":"does-sleep-affect-testosterone","cat":"Men","kw":"sleep deep sleep apnoea snoring insomnia rest hours night Does Poor Sleep Lower Testosterone? What the Research Shows"},{"name":"Does stress lower testosterone?","slug":"does-stress-lower-testosterone","cat":"Men","kw":"stress cortisol anxiety burnout overtraining adrenal Does Stress Lower Testosterone? How Cortisol Affects It"},{"name":"Is TRT safe long term?","slug":"is-trt-safe-long-term","cat":"Men","kw":"trt testosterone replacement therapy safe long term heart traverse haematocrit prostate side effects Is TRT Safe Long Term? What the Latest Evidence Says"},{"name":"Does creatine affect testosterone or hormones?","slug":"does-creatine-affect-testosterone","cat":"Men","kw":"creatine monohydrate dht hair loss hormones supplement gym Does Creatine Increase Testosterone? What the Research Shows"},{"name":"How long does it take to raise testosterone?","slug":"how-long-to-raise-testosterone","cat":"Men","kw":"how long time weeks fast quickly results timeline How Long to Raise Testosterone? (Realistic Timeline)"},{"name":"Does zinc actually raise testosterone?","slug":"does-zinc-raise-testosterone","cat":"Men","kw":"zinc mineral deficiency oysters supplement copper Does Zinc Increase Testosterone? What Evidence Says"},{"name":"Why do I wake up at 3am during perimenopause?","slug":"waking-up-3am-perimenopause","cat":"Women","kw":"3am waking up night sleep insomnia perimenopause progesterone cortisol night sweats early Why You Wake Up at 3am in Perimenopause (and What Helps)"},{"name":"What's a normal testosterone level by age?","slug":"normal-testosterone-levels-by-age","cat":"Men","kw":"normal levels range by age ng/dl nmol chart 300 average reference Normal Testosterone Levels by Age (What's Healthy)"}];
  var DATA_SUPPS = [{"name":"Adaptogen Blends","slug":"adaptogen-blends","aud":"Women","tier":"unproven","kw":"adaptogens for women · adaptogen blend benefits · cortisol balance supplement · adrenal fatigue supplement · do adaptogens work Adaptogen Blends for Women: What Works, What's Overclaimed"},{"name":"Detox & Cleanse Products","slug":"detox-cleanse","aud":"Women","tier":"unproven","kw":"detox tea for women · do detox cleanses work · estrogen detox · slimming tea dangers · cleanse supplement Detox & Cleanse Products for Women: Why They Don't Work"},{"name":"'Hormone-Balancing' Blends","slug":"hormone-balancing-blends","aud":"Women","tier":"unproven","kw":"hormone balancing supplements · best supplements for hormone balance · menopause supplements · hormone balance pills · do hormone supplements work 'Hormone-Balancing' Blends for Women: Do They Work?"},{"name":"Broccoli Sprout Extract","slug":"broccoli-sprout","aud":"Women","tier":"unproven","kw":"broccoli sprout benefits · sulforaphane benefits · broccoli sprout estrogen · sulforaphane supplement Broccoli Sprout & Sulforaphane: Real Science, Oversold Pills"},{"name":"Apple Cider Vinegar","slug":"apple-cider-vinegar","aud":"Women","tier":"unproven","kw":"apple cider vinegar benefits · apple cider vinegar weight loss · acv blood sugar · apple cider vinegar pcos Apple Cider Vinegar: The One Real Benefit vs the Hype"},{"name":"Red Raspberry Leaf","slug":"red-raspberry-leaf","aud":"Women","tier":"unproven","kw":"red raspberry leaf tea benefits · raspberry leaf pregnancy · raspberry leaf labour · raspberry leaf period Red Raspberry Leaf Tea: Tradition vs the Evidence"},{"name":"Wild Yam","slug":"wild-yam","aud":"Women","tier":"unproven","kw":"wild yam benefits · wild yam progesterone · wild yam cream menopause · natural progesterone cream Wild Yam 'Natural Progesterone': The Myth and the Real Risk"},{"name":"Dong Quai","slug":"dong-quai","aud":"Women","tier":"unproven","kw":"dong quai benefits · dong quai menopause · dong quai pms · dong quai side effects · female ginseng Dong Quai for Women: Tradition vs Evidence & Safety"},{"name":"Collagen","slug":"collagen","aud":"Women","tier":"unproven","kw":"collagen benefits · collagen side effects · collagen skin · collagen menopause · does collagen balance hormones Collagen for Women: What It Helps (and What It Doesn't)"},{"name":"Maca","slug":"maca-women","aud":"Women","tier":"unproven","kw":"maca for women · maca root benefits · maca menopause · maca libido women · does maca balance hormones Maca for Women: Real Libido Benefit, Wrong Hormone Label"},{"name":"Evening Primrose Oil","slug":"evening-primrose-oil","aud":"Women","tier":"unproven","kw":"evening primrose oil benefits · evening primrose pms · evening primrose breast pain · epo menopause Evening Primrose Oil: Why the Evidence Disappoints"},{"name":"Sage","slug":"sage","aud":"Women","tier":"unproven","kw":"sage benefits · sage hot flashes · sage menopause · sage night sweats · sage tea menopause Sage for Hot Flushes: Evidence & the Thujone Catch"},{"name":"Black Cohosh","slug":"black-cohosh","aud":"Women","tier":"unproven","kw":"black cohosh benefits · black cohosh menopause · black cohosh hot flashes · black cohosh side effects Black Cohosh for Menopause: Evidence & Liver Safety"},{"name":"Probiotics (specific strains)","slug":"probiotics","aud":"Women","tier":"some","kw":"probiotics benefits for women · probiotics gut health · probiotics vaginal health · best probiotics women Probiotics for Women: Gut, Vaginal & Hormone Health"},{"name":"DIM (Diindolylmethane)","slug":"dim-women","aud":"Women","tier":"some","kw":"dim supplement · dim for women · dim estrogen dominance · dim hormonal acne · cruciferous vegetables estrogen · dim food sources DIM Supplement for Women: Estrogen, Acne & Honest Evidence"},{"name":"St John's Wort","slug":"st-johns-wort","aud":"Women","tier":"some","kw":"st johns wort benefits · st johns wort side effects · st johns wort birth control · st johns wort interactions St John's Wort: Mood Benefits & Dangerous Interactions"},{"name":"Vitamin E","slug":"vitamin-e","aud":"Women","tier":"some","kw":"vitamin e benefits · vitamin e hot flashes · vitamin e breast tenderness · vitamin e dosage · vitamin e rich foods · vitamin e food sources Vitamin E for Women: Hot Flushes & Breast Tenderness"},{"name":"Chromium","slug":"chromium","aud":"Women","tier":"some","kw":"chromium benefits · chromium blood sugar · chromium cravings · chromium picolinate pcos · chromium rich foods · chromium food sources Chromium for Blood Sugar & Cravings: Does It Work?"},{"name":"Selenium","slug":"selenium-women","aud":"Women","tier":"some","kw":"selenium benefits for women · selenium thyroid · selenium fertility · selenium dosage · brazil nuts selenium · selenium rich foods Selenium for Women: Thyroid, Fertility & the Safe Limit"},{"name":"Zinc","slug":"zinc-women","aud":"Women","tier":"some","kw":"zinc benefits for women · zinc acne · zinc hormonal acne · zinc for periods · zinc rich foods · foods high in zinc Zinc for Women: Skin, Cycles, Acne & Immunity"},{"name":"Rhodiola","slug":"rhodiola","aud":"Women","tier":"some","kw":"rhodiola benefits · rhodiola fatigue · rhodiola stress · rhodiola rosea dosage Rhodiola for Women: Fatigue, Stress & Focus"},{"name":"Ashwagandha (KSM-66)","slug":"ashwagandha-women","aud":"Women","tier":"some","kw":"ashwagandha benefits for women · ashwagandha cortisol · ashwagandha stress sleep · ashwagandha thyroid caution Ashwagandha Benefits for Women: Stress, Sleep & Cortisol"},{"name":"Vitex / Chasteberry","slug":"vitex","aud":"Women","tier":"some","kw":"vitex benefits · chasteberry pms · vitex agnus castus · vitex for irregular periods Vitex (Chasteberry) for PMS: Evidence, Dose & Cautions"},{"name":"Phytoestrogens (soy / red clover)","slug":"phytoestrogens","aud":"Women","tier":"some","kw":"phytoestrogens menopause · soy isoflavones hot flashes · red clover menopause · plant estrogens · foods that increase estrogen · phytoestrogen foods Phytoestrogens for Menopause: Soy, Red Clover & Hot Flushes"},{"name":"Spearmint (tea or extract)","slug":"spearmint","aud":"Women","tier":"some","kw":"spearmint tea pcos · spearmint tea testosterone · spearmint hirsutism · spearmint tea hormones Spearmint Tea for PCOS: A Gentle, Proven Anti-Androgen"},{"name":"CoQ10","slug":"coq10-women","aud":"Women","tier":"some","kw":"coq10 benefits for women · coq10 egg quality · coq10 fertility · ubiquinol · coq10 food sources CoQ10 for Women: Egg Quality, Fertility & Energy"},{"name":"Saffron","slug":"saffron","aud":"Women","tier":"some","kw":"saffron for pms · saffron benefits mood · saffron depression · saffron premenstrual Saffron for PMS & Mood: What the Trials Actually Show"},{"name":"NAC (N-acetylcysteine)","slug":"nac","aud":"Women","tier":"some","kw":"nac benefits · nac pcos · nac fertility · n-acetyl cysteine dosage NAC for Women: PCOS, Fertility & Antioxidant Support"},{"name":"Berberine","slug":"berberine","aud":"Women","tier":"some","kw":"berberine benefits · berberine pcos · berberine insulin resistance · berberine vs metformin Berberine for PCOS: Insulin, Androgens & Honest Evidence"},{"name":"Iron (only if deficient)","slug":"iron","aud":"Women","tier":"strong","kw":"iron deficiency symptoms women · iron supplement fatigue · ferritin test · iron for hair loss · iron rich foods · heme vs non-heme iron Iron for Women: Only Supplement If You're Deficient"},{"name":"Calcium + Vitamin B6","slug":"calcium-b6","aud":"Women","tier":"strong","kw":"calcium for women menopause · vitamin b6 pms · b6 dosage safe · calcium bone health women · calcium rich foods · non-dairy calcium sources Calcium + B6 for Women: Bone Health & PMS, Done Safely"},{"name":"Myo-Inositol","slug":"inositol","aud":"Women","tier":"strong","kw":"inositol pcos · myo-inositol benefits · inositol for fertility · inositol insulin resistance · inositol food sources · foods high in inositol Inositol for PCOS: Insulin, Ovulation & Cycle Regularity"},{"name":"Vitamin B12","slug":"vitamin-b12-women","aud":"Women","tier":"strong","kw":"vitamin b12 benefits · b12 deficiency women · b12 vegan · b12 energy · b12 food sources · vegan b12 pregnancy Vitamin B12 for Women: Energy, Fatigue & Vegan Diets"},{"name":"Creatine Monohydrate","slug":"creatine-women","aud":"Women","tier":"strong","kw":"creatine for women · creatine side effects women · creatine menopause · does creatine make women bulky · creatine food sources · is creatine vegetarian Creatine for Women: Strength, Bone, Brain Fog & Menopause"},{"name":"Magnesium (glycinate)","slug":"magnesium-women","aud":"Women","tier":"strong","kw":"magnesium for menopause · magnesium glycinate benefits · magnesium for sleep · magnesium pms · magnesium rich foods · magnesium food sources Magnesium for Menopause, Sleep & PMS: Dose & Form"},{"name":"Omega-3 (EPA/DHA)","slug":"omega-3-women","aud":"Women","tier":"strong","kw":"omega 3 for women · fish oil period pain · omega 3 mood · dha pregnancy benefits · omega 3 food sources · vegan omega 3 algae Omega-3 for Women: Period Pain, Mood & Pregnancy"},{"name":"Vitamin D3 + K2","slug":"vitamin-d3-k2-women","aud":"Women","tier":"strong","kw":"vitamin d and hormones · vitamin d for women · vitamin d3 k2 benefits · vitamin d deficiency mood · vitamin d food sources · vitamin k2 natto Vitamin D3 + K2 for Women: Bones, Mood & Hormones"},{"name":"Proprietary 'T-Booster' Blends","slug":"proprietary-blends","aud":"Men","tier":"unproven","kw":"proprietary blend testosterone booster · are test boosters scams · fairy dusting supplements · testosterone booster label Proprietary 'T-Booster' Blends: The Hidden-Dose Red Flag"},{"name":"Wild Oat Extract (Avena Sativa)","slug":"wild-oat","aud":"Men","tier":"unproven","kw":"avena sativa benefits · wild oat extract testosterone · wild oats libido · avena sativa shbg Wild Oat Extract (Avena Sativa): Folklore vs Evidence"},{"name":"Deer Antler Velvet","slug":"deer-antler","aud":"Men","tier":"unproven","kw":"deer antler velvet benefits · deer antler testosterone · deer antler igf-1 · does deer antler work Deer Antler Velvet: Real IGF-1 Biology, No Real Benefit"},{"name":"Pine Pollen","slug":"pine-pollen","aud":"Men","tier":"unproven","kw":"pine pollen benefits · pine pollen testosterone · pine pollen dosage · does pine pollen work Pine Pollen Testosterone: True Claim, Useless Dose"},{"name":"Chrysin","slug":"chrysin","aud":"Men","tier":"unproven","kw":"chrysin benefits · chrysin testosterone · chrysin estrogen blocker · chrysin aromatase Chrysin: The 'Estrogen Blocker' That Isn't Absorbed"},{"name":"L-Arginine","slug":"l-arginine","aud":"Men","tier":"unproven","kw":"l-arginine benefits · l-arginine vs citrulline · arginine nitric oxide · l-arginine testosterone L-Arginine vs L-Citrulline: Why Citrulline Wins"},{"name":"Ginseng (Panax)","slug":"ginseng","aud":"Men","tier":"unproven","kw":"panax ginseng benefits · ginseng testosterone · ginseng erectile function · ginseng side effects Panax Ginseng: Energy & Erections, But Not Testosterone"},{"name":"Nettle Root","slug":"nettle-root","aud":"Men","tier":"unproven","kw":"nettle root benefits · nettle root testosterone · nettle root shbg · stinging nettle Nettle Root & SHBG: A Clever Idea Short on Human Proof"},{"name":"Beta-Sitosterol","slug":"beta-sitosterol","aud":"Men","tier":"unproven","kw":"beta-sitosterol benefits · beta-sitosterol testosterone · beta-sitosterol prostate · beta sitosterol cholesterol Beta-Sitosterol: Prostate & Cholesterol, Not Testosterone"},{"name":"Saw Palmetto","slug":"saw-palmetto","aud":"Men","tier":"unproven","kw":"saw palmetto benefits · saw palmetto testosterone · saw palmetto prostate · saw palmetto side effects Saw Palmetto: Prostate Herb, Not a Testosterone Booster"},{"name":"Horny Goat Weed (Epimedium)","slug":"horny-goat-weed","aud":"Men","tier":"unproven","kw":"horny goat weed benefits · epimedium testosterone · icariin · horny goat weed side effects Horny Goat Weed: Why the Viagra-Like Mechanism Fails"},{"name":"Resveratrol","slug":"resveratrol","aud":"Men","tier":"unproven","kw":"resveratrol benefits · resveratrol testosterone · resveratrol anti-aging · resveratrol red wine Resveratrol: The Red-Wine Longevity Myth vs the Evidence"},{"name":"Forskolin","slug":"forskolin","aud":"Men","tier":"unproven","kw":"forskolin benefits · forskolin testosterone · coleus forskohlii · forskolin side effects Forskolin & Testosterone: One Study, A Lot of Hype"},{"name":"Calcium-D-Glucarate","slug":"calcium-d-glucarate","aud":"Men","tier":"unproven","kw":"calcium d-glucarate benefits · calcium d glucarate estrogen · calcium d-glucarate detox · dim alternative Calcium-D-Glucarate: Real Mechanism, Thin Human Proof"},{"name":"D-Aspartic Acid (DAA)","slug":"daa","aud":"Men","tier":"unproven","kw":"does d-aspartic acid work · daa testosterone · d-aspartic acid benefits · daa side effects Does D-Aspartic Acid (DAA) Really Raise Testosterone?"},{"name":"ZMA","slug":"zma","aud":"Men","tier":"unproven","kw":"does zma work · zma benefits · zma testosterone · zma sleep · zinc magnesium b6 Does ZMA Work? Testosterone, Sleep & the Deficiency Catch"},{"name":"Yohimbine","slug":"yohimbine","aud":"Men","tier":"unproven","kw":"yohimbine side effects · yohimbine dangers · yohimbe blood pressure · yohimbine erectile dysfunction Yohimbine: Real Effects, Real Risks & Bad Labelling"},{"name":"Pregnenolone","slug":"pregnenolone","aud":"Men","tier":"unproven","kw":"pregnenolone benefits · pregnenolone testosterone · pregnenolone side effects · mother hormone Pregnenolone: Does the 'Mother Hormone' Raise Testosterone?"},{"name":"DHEA","slug":"dhea","aud":"Men","tier":"unproven","kw":"dhea benefits · dhea side effects · dhea testosterone · dhea supplement risks DHEA: The Hormone Sold as a Supplement — Risks & Facts"},{"name":"Ecdysterone","slug":"ecdysterone","aud":"Men","tier":"unproven","kw":"does ecdysterone work · ecdysterone benefits · ecdysterone side effects · ecdysteroids Ecdysterone: Does the 'Russian Secret' Actually Work?"},{"name":"Turkesterone","slug":"turkesterone","aud":"Men","tier":"unproven","kw":"does turkesterone work · turkesterone side effects · turkesterone benefits · ecdysteroid Does Turkesterone Work? The Hype vs The Human Trials"},{"name":"Fadogia Agrestis","slug":"fadogia","aud":"Men","tier":"unproven","kw":"fadogia agrestis side effects · fadogia agrestis benefits · fadogia testosterone · is fadogia safe Fadogia Agrestis: The Viral T-Booster With No Human Data"},{"name":"Tribulus Terrestris","slug":"tribulus","aud":"Men","tier":"unproven","kw":"does tribulus increase testosterone · tribulus terrestris benefits · tribulus testosterone · is tribulus a scam Does Tribulus Terrestris Actually Raise Testosterone?"},{"name":"DIM (Diindolylmethane)","slug":"dim","aud":"Men","tier":"some","kw":"dim supplement · dim benefits men · how to lower estrogen in men · diindolylmethane · cruciferous vegetables estrogen · dim food sources DIM Supplement: Does It Lower Estrogen in Men?"},{"name":"Supporting micronutrients (A · C · E · copper · iodine)","slug":"micronutrients","aud":"Men","tier":"some","kw":"vitamins for testosterone · copper zinc ratio · iodine thyroid · vitamin a testosterone · multivitamin men · best multivitamin testosterone Vitamins A, C, E, Copper & Iodine for Men's Hormones"},{"name":"Mucuna Pruriens","slug":"mucuna-pruriens","aud":"Men","tier":"some","kw":"mucuna pruriens benefits · mucuna l-dopa · mucuna testosterone · mucuna fertility Mucuna Pruriens Benefits: Dopamine, Libido & Fertility"},{"name":"Cistanche","slug":"cistanche","aud":"Men","tier":"some","kw":"cistanche benefits · cistanche tubulosa · cistanche testosterone · cistanche libido Cistanche Benefits: Libido, Energy & the Evidence"},{"name":"Maca","slug":"maca","aud":"Men","tier":"some","kw":"maca root benefits · does maca increase testosterone · maca libido · maca dosage Maca Root Benefits: Libido, Energy — but Not Testosterone"},{"name":"Pomegranate / Beetroot","slug":"pomegranate","aud":"Men","tier":"some","kw":"pomegranate benefits testosterone · beetroot nitric oxide · beetroot benefits · pomegranate erectile · nitrate rich foods · foods for blood flow Pomegranate & Beetroot: Nitric Oxide, Blood Flow & T"},{"name":"Mushroom Complex (Cordyceps)","slug":"cordyceps","aud":"Men","tier":"some","kw":"cordyceps benefits · mushroom complex · lion's mane benefits · reishi · cordyceps testosterone Cordyceps & Mushroom Complex Benefits for Men"},{"name":"Taurine","slug":"taurine","aud":"Men","tier":"some","kw":"taurine benefits · taurine sleep · taurine dosage · taurine testosterone · taurine food sources · vegan taurine Taurine Benefits: Sleep, Recovery & Testes Protection"},{"name":"CoQ10","slug":"coq10","aud":"Men","tier":"some","kw":"coq10 benefits · coq10 sperm · coq10 fertility · ubiquinol · coq10 dosage · coq10 food sources CoQ10 Benefits: Sperm Quality, Energy & Statins"},{"name":"Black Seed Oil","slug":"black-seed-oil","aud":"Men","tier":"some","kw":"black seed oil benefits · black seed oil testosterone · nigella sativa · thymoquinone Black Seed Oil Benefits: Testosterone & Inflammation"},{"name":"Selenium","slug":"selenium","aud":"Men","tier":"some","kw":"selenium benefits · selenium testosterone · selenium fertility · selenium dosage · brazil nuts selenium · selenium rich foods Selenium Benefits: Sperm, Thyroid & Testosterone"},{"name":"Shilajit","slug":"shilajit","aud":"Men","tier":"some","kw":"shilajit benefits · shilajit testosterone · purified shilajit · shilajit dosage Shilajit Benefits: Testosterone, Sperm & the Real Evidence"},{"name":"Vitamin B12","slug":"vitamin-b12","aud":"Men","tier":"strong","kw":"vitamin b12 benefits · b12 energy · b12 deficiency fatigue · methylcobalamin · b12 food sources · vegan b12 deficiency Vitamin B12 Benefits: Energy, Fatigue & Low Testosterone"},{"name":"L-Citrulline","slug":"l-citrulline","aud":"Men","tier":"strong","kw":"l-citrulline benefits · citrulline nitric oxide · citrulline dosage · citrulline erectile function L-Citrulline Benefits: Nitric Oxide, Blood Flow & Erections"},{"name":"Omega-3 (EPA/DHA)","slug":"omega-3","aud":"Men","tier":"strong","kw":"omega 3 testosterone · fish oil benefits · omega 3 dosage · epa dha benefits · omega 3 food sources · vegan omega 3 algae Omega-3 & Testosterone: Fish Oil Benefits, Dose & Quality"},{"name":"Fenugreek","slug":"fenugreek","aud":"Men","tier":"strong","kw":"fenugreek testosterone · fenugreek benefits · fenugreek dosage · fenugreek libido Fenugreek & Testosterone: Benefits, Dose, Side Effects"},{"name":"Tongkat Ali","slug":"tongkat-ali","aud":"Men","tier":"strong","kw":"tongkat ali testosterone · tongkat ali benefits · tongkat ali dosage · eurycoma longifolia Tongkat Ali & Testosterone: Benefits, Dose, Side Effects"},{"name":"Boron","slug":"boron","aud":"Men","tier":"strong","kw":"boron testosterone · boron benefits · boron dosage · does boron raise testosterone · boron rich foods · boron food sources Boron & Testosterone: How a Trace Mineral Frees It Up"},{"name":"Creatine Monohydrate","slug":"creatine","aud":"Men","tier":"strong","kw":"does creatine affect testosterone · creatine benefits · creatine side effects · creatine monohydrate dosage · creatine food sources · is creatine vegetarian Does Creatine Affect Testosterone? Benefits & Side Effects"},{"name":"Ashwagandha (KSM-66)","slug":"ashwagandha","aud":"Men","tier":"strong","kw":"does ashwagandha increase testosterone · ashwagandha benefits · ashwagandha side effects · ashwagandha dosage · ksm-66 Does Ashwagandha Increase Testosterone? Benefits & Dose"},{"name":"Magnesium (glycinate)","slug":"magnesium","aud":"Men","tier":"strong","kw":"magnesium glycinate benefits · magnesium for sleep · magnesium testosterone · magnesium dosage · magnesium rich foods · magnesium food sources Magnesium Glycinate Benefits: Testosterone, Sleep & Dose"},{"name":"Zinc","slug":"zinc","aud":"Men","tier":"strong","kw":"does zinc increase testosterone · zinc testosterone · zinc dosage men · best form of zinc · zinc rich foods · foods high in zinc Does Zinc Increase Testosterone? Dose, Forms & Risks"},{"name":"Vitamin D3 + K2","slug":"vitamin-d3-k2","aud":"Men","tier":"strong","kw":"does vitamin d increase testosterone · vitamin d testosterone · vitamin d3 k2 benefits · vitamin d dosage for men · vitamin d food sources · vitamin k2 natto Does Vitamin D Increase Testosterone? Dose & Benefits"}];
  var DATA_MEN_ART = [{"slug":"wake-up-tired-after-8-hours","title":"Why You Wake Up Tired After 8 Hours of Sleep","kw":"sleep tired fatigue energy rest"},{"slug":"doctor-said-normal-but-feel-tired","title":"Doctor Said Normal But I Still Feel Tired","kw":"energy fatigue tired mood blood test"},{"slug":"cortisol-spiking-before-lunch","title":"Why Your Cortisol Spikes Before Lunch","kw":"energy mood cortisol stress fatigue"},{"slug":"breakfast-mistakes-testosterone","title":"The 3 Breakfast Mistakes Killing Your Testosterone","kw":"energy nutrition food cortisol"},{"slug":"sleep-90-minute-rule","title":"The 90-Minute Rule: Sleep Timing and Testosterone","kw":"sleep rest night energy"},{"slug":"libido-after-40-reset-plan","title":"Why Your Libido Tanked After 40 (4-Week Reset)","kw":"libido sex drive erection desire reset"},{"slug":"morning-erections-and-testosterone","title":"What Your Morning Erection Tells You About Your T","kw":"libido erection sex morning"},{"slug":"does-masturbation-lower-testosterone","title":"Does Masturbation Lower Testosterone?","kw":"libido sex masturbation drive"},{"slug":"stubborn-belly-fat-men","title":"Why Your Belly Fat Won't Budge","kw":"weight fat belly visceral lose"},{"slug":"hidden-reason-last-10-pounds","title":"The Hidden Reason You Can't Lose the Last 10 Pounds","kw":"weight fat lose metabolism"},{"slug":"cardio-tanking-testosterone","title":"Why More Cardio Is Tanking Your Testosterone","kw":"weight strength training cardio exercise muscle"},{"slug":"testosterone-muscle-growth-science","title":"What Testosterone Actually Does for Muscle Growth","kw":"strength muscle training gym gains protein"},{"slug":"how-much-muscle-naturally","title":"How Much Muscle Can You Build Naturally?","kw":"strength muscle training natural gym"},{"slug":"bloodwork-for-lifters","title":"The Bloodwork Every Serious Lifter Should Get","kw":"strength optimise blood test training muscle"},{"slug":"how-to-read-blood-test-results","title":"How to Read Your Blood Test Results","kw":"optimise testing blood test hormone"},{"slug":"normal-blood-test-low-testosterone","title":"When 'Normal' Blood Test Means Low Testosterone","kw":"optimise testing blood test low testosterone shbg"},{"slug":"low-testosterone-red-flags","title":"Red Flags: When Low T Needs Urgent Help","kw":"optimise low testosterone symptoms health"},{"slug":"signs-of-low-testosterone-men-ignore","title":"7 Warning Signs of Low Testosterone Most Men Ignore","kw":"optimise energy mood libido low testosterone symptoms"},{"slug":"am-i-in-andropause-stages","title":"Am I in Andropause? The 5 Hidden Stages","kw":"optimise energy andropause age stages"},{"slug":"5-supplements-to-start-with","title":"5 Supplements Every Man Should Start With","kw":"optimise supplement stack"},{"slug":"supplement-layering-strategy","title":"How to Layer Supplements for Maximum Effect","kw":"optimise supplement stack timing"},{"slug":"supplements-wasting-money","title":"3 Supplements Most Men Are Wasting Money On","kw":"optimise supplement waste"},{"slug":"do-testosterone-boosters-work","title":"Do Testosterone Boosters Actually Work?","kw":"optimise libido supplement booster"},{"slug":"foods-crushing-testosterone","title":"5 Foods Silently Crushing Your Testosterone","kw":"weight optimise food nutrition diet"},{"slug":"testosterone-foods","title":"Foods That Boost Testosterone Naturally","kw":"optimise energy food nutrition diet"},{"slug":"alcohol-and-testosterone-truth","title":"The Alcohol and Testosterone Truth","kw":"optimise sleep alcohol drink"},{"slug":"gut-health-and-testosterone","title":"Gut Health and Testosterone: The Forgotten Connection","kw":"optimise energy weight gut digestion"},{"slug":"30-day-testosterone-reset-timeline","title":"The 30-Day Testosterone Reset Timeline","kw":"optimise reset energy plan"},{"slug":"sunlight-and-testosterone","title":"Sunlight and Testosterone: The Free Tool","kw":"optimise energy mood vitamin d sunlight"},{"slug":"trt-or-natural-testosterone","title":"TRT vs Natural Testosterone: The Honest Comparison","kw":"optimise trt natural"},{"slug":"trt-vs-steroids","title":"TRT vs Steroids","kw":"steroids trt","exclude":true},{"slug":"anabolic-steroid-side-effects","title":"Anabolic Steroid Side Effects","kw":"steroids","exclude":true},{"slug":"gynecomastia-bodybuilders-gyno","title":"Gynecomastia (Gyno)","kw":"steroids gyno","exclude":true},{"slug":"enclomiphene-clomid-serms-explained","title":"Enclomiphene, Clomid and SERMs","kw":"serms steroids","exclude":true},{"slug":"steroids-and-heart-health","title":"Steroids and Your Heart","kw":"steroids heart","exclude":true},{"slug":"testosterone-recovery-after-steroids","title":"Testosterone Recovery After Steroids","kw":"steroids recovery","exclude":true},{"slug":"growth-hormone-insulin-bodybuilding","title":"Growth Hormone, Insulin and Bodybuilding","kw":"steroids hgh","exclude":true},{"slug":"sarms-science-and-risks","title":"SARMs: Science and Risks","kw":"sarms steroids","exclude":true},{"slug":"testosterone-in-animals","title":"Which Animals Have the Most Testosterone?","kw":"curiosity animals","exclude":true}];
  var DATA_WOMEN_ART = [{"name":"Navigating Menopause at Work: A Practical Survival Guide","slug":"menopause-at-work","type":"Tip","kw":"Hot flushes in meetings, brain fog at your desk, broken sleep behind it all — practical, realistic ways to manage menopause symptoms at work, and how to ask for support."},{"name":"Do Collagen Supplements Actually Work?","slug":"collagen-supplements-evidence","type":"Research","kw":"Collagen powders promise younger skin, stronger joints and better bones. What does the evidence really show for women — and is it worth the money?"},{"name":"When Hard Training Stops Your Periods: Hypothalamic Amenorrhea","slug":"hypothalamic-amenorrhea-training","type":"Article","kw":"Lost your period from intense training or under-eating? It's often hypothalamic amenorrhea — a sign your body is conserving energy. Why it matters and how to recover."},{"name":"Trying to Conceive Over 35: The Hormones That Matter Most","slug":"trying-to-conceive-over-35","type":"Article","kw":"Trying for a baby after 35? Understand the key fertility hormones, what changes with age, and when to seek help — without the panic of the \"geriatric pregnancy\" label."},{"name":"Hormonal vs Non-Hormonal Contraception: A Plain Guide","slug":"hormonal-vs-nonhormonal-contraception","type":"Article","kw":"Confused by your contraception options? A clear, judgement-free guide to hormonal and non-hormonal methods, how they affect your body, and what to weigh up."},{"name":"Hormone-Disrupting Chemicals: What's Worth Worrying About (and What Isn't)","slug":"endocrine-disruptors-what-to-know","type":"Research","kw":"\"Endocrine disruptors\" in plastics and products sound scary. A calm, evidence-based look at what the science supports — and simple, no-panic steps that help."},{"name":"Does Soy Mess With Your Hormones? The Phytoestrogen Truth","slug":"soy-phytoestrogens-truth","type":"Fact","kw":"Is soy bad for your hormones? The science on phytoestrogens is reassuring — and quite different from the internet panic. Here's what's true."},{"name":"Menopause and Depression: When Low Mood Is Hormonal","slug":"menopause-depression","type":"Article","kw":"The menopause transition raises the risk of depression, even in women with no prior history. How to tell hormonal low mood from clinical depression — and where to get help."},{"name":"Perimenopause and ADHD: Why So Many Women Are Diagnosed Now","slug":"perimenopause-adhd-women","type":"Article","kw":"Many women are recognising ADHD — or struggling far more with it — during perimenopause. The oestrogen-dopamine link explains why, and what can help."},{"name":"Adult Hormonal Acne: Why It Shows Up (Sometimes for the First Time)","slug":"adult-hormonal-acne","type":"Article","kw":"Breaking out along your jaw and chin in your 30s, 40s, or perimenopause? Adult hormonal acne is real. Why it happens — and what clears it."},{"name":"Breast Tenderness and Your Hormones: What's Normal, What's Not","slug":"breast-tenderness-hormones","type":"Article","kw":"Sore, tender, or lumpy-feeling breasts that change with your cycle are usually hormonal. What causes it, how to ease it, and the changes that need a doctor."},{"name":"The Bladder Changes No One Warns You About at Menopause","slug":"bladder-changes-menopause","type":"Article","kw":"Needing the loo more often, urgency, leaks, or repeat UTIs after menopause? It's hormonal, common, and treatable. What's happening down there — and what helps."},{"name":"Itchy Skin and \"Crawling\" Sensations at Menopause","slug":"itchy-skin-formication-menopause","type":"Article","kw":"Itchy skin — or the unsettling feeling of insects crawling on you (formication) — can be a real menopause symptom. Why oestrogen is behind it, and how to get relief."},{"name":"Frozen Shoulder: The Menopause Link Almost Nobody Mentions","slug":"frozen-shoulder-menopause","type":"Article","kw":"Frozen shoulder is strikingly common in women around menopause — and the oestrogen link is rarely explained. Why it happens, and what helps it heal."},{"name":"Heart Palpitations in Perimenopause: Usually Hormones, Sometimes Not","slug":"heart-palpitations-perimenopause","type":"Article","kw":"That sudden pounding or fluttering heart in your 40s is often hormonal — but here's how to tell normal perimenopausal palpitations from the signs that need a doctor."},{"name":"Caffeine and Your Hormones: Friend, Foe, or Just Complicated?","slug":"caffeine-and-womens-hormones","type":"Article","kw":"Is your daily coffee helping or hurting your hormones? How caffeine affects cortisol, sleep, anxiety and PMS in women — and how to find your sweet spot."},{"name":"Your Gut and Your Hormones: Meet the Estrobolome","slug":"gut-hormones-estrobolome","type":"Fact","kw":"Your gut bacteria help regulate oestrogen through something called the estrobolome. What it means, why gut health matters for hormones, and how to support it."},{"name":"Cycle Syncing: Hype, or Genuinely Helpful?","slug":"cycle-syncing-hype-or-helpful","type":"Tip","kw":"Cycle syncing means matching your food, workouts and tasks to your menstrual phases. What's evidence-based, what's overblown, and how to use the useful part."},{"name":"Seed Cycling: Does It Actually Balance Your Hormones?","slug":"seed-cycling-evidence","type":"Research","kw":"Seed cycling promises to balance hormones with pumpkin, flax, sesame and sunflower seeds. Here's what the evidence says — and whether it's worth doing."},{"name":"\"Adrenal Fatigue\": What's Real, What's Not, and What to Do Instead","slug":"adrenal-fatigue-myth","type":"Fact","kw":"\"Adrenal fatigue\" is a popular online diagnosis — but is it real? An honest look at the science, what's behind the symptoms, and where to focus."},{"name":"Surgical Menopause: When Menopause Happens Overnight","slug":"surgical-menopause","type":"Article","kw":"Having your ovaries removed triggers menopause immediately, not gradually. What surgical menopause feels like, why symptoms hit hard, and how to prepare."},{"name":"Early Menopause: When It Arrives Before You Expected","slug":"early-menopause-before-45","type":"Article","kw":"Menopause before 45 — or before 40 — is more common than many realise. The signs, the causes, why it matters for long-term health, and where to get help."},{"name":"The Hormone Crash After Birth: Postpartum, Honestly","slug":"postpartum-hormones-explained","type":"Article","kw":"After birth, your hormones don't ease down — they plummet. What that does to mood, sleep and your body, what's normal, and when to reach for support."},{"name":"Iron, Fatigue and Heavy Periods: The Link That's Easy to Miss","slug":"iron-deficiency-heavy-periods-fatigue","type":"Article","kw":"Exhausted no matter how much you sleep? Heavy periods are a common cause of low iron in women. The signs, the simple test, and how to fix it safely."},{"name":"Hormonal Bloating: Why It Happens and How to Feel Less Like a Balloon","slug":"hormonal-bloating","type":"Tip","kw":"That premenstrual or perimenopausal bloat is real and hormonal. Why your hormones cause water retention and gut changes — and simple ways to ease it."},{"name":"Hormonal Headaches and Migraines: The Cycle Connection","slug":"hormonal-headaches-migraines","type":"Article","kw":"Headaches or migraines that show up around your period or in perimenopause are often hormonal. Why the oestrogen drop triggers them, and what helps."},{"name":"Coming Off the Pill: What Actually Happens to Your Hormones","slug":"coming-off-the-pill-hormones","type":"Article","kw":"Thinking of stopping the pill? What to expect when your natural cycle returns, how long it takes, and the symptoms that can show up along the way."},{"name":"Fibroids: A Common Cause of Heavy Periods Few People Mention","slug":"fibroids-heavy-periods","type":"Article","kw":"Fibroids are extremely common and a frequent cause of heavy periods and pelvic pressure. What they are, when they matter, and the options available."},{"name":"Endometriosis: When Period Pain Isn't Just \"Bad Periods\"","slug":"endometriosis-period-pain","type":"Article","kw":"Period pain that stops your life isn't something to push through. The signs of endometriosis, why diagnosis takes so long, and what you can do."},{"name":"Perimenopause vs Menopause: What's the Difference?","slug":"perimenopause-vs-menopause","type":"Fact","kw":"Perimenopause and menopause are not the same thing. A clear, plain-language explanation of the difference, the timeline, and which stage you might be in."},{"name":"Should You Get Your Hormones Tested? A Practical Guide","slug":"should-you-test-your-hormones","type":"Tip","kw":"Home hormone tests are everywhere — but are they useful? When hormone testing helps women, when it misleads, and what to ask your doctor."},{"name":"Is Intermittent Fasting Right for Women's Hormones?","slug":"intermittent-fasting-women-hormones","type":"Research","kw":"Intermittent fasting is popular, but it affects women differently than men. What the research suggests, who it may suit, and the cautions worth knowing."},{"name":"Alcohol and Your Hormones: The Honest Picture for Women","slug":"alcohol-and-womens-hormones","type":"Article","kw":"How does alcohol affect women's hormones, sleep, and menopause symptoms? An honest, non-preachy look — and simple ways to reduce the impact."},{"name":"Supplements for Women's Hormones: What the Evidence Says (and Doesn't)","slug":"supplements-women-hormones-evidence","type":"Tip","kw":"The supplement aisle is full of hormone promises. An honest look at which ones have real evidence for women — and which are mostly marketing."},{"name":"Why Lifting Weights Is the Best Thing for Midlife Hormones","slug":"strength-training-midlife-hormones","type":"Tip","kw":"If you do one thing for your hormones in midlife, make it strength training. Why lifting protects muscle, bones, metabolism and mood — and how to start."},{"name":"Eating for Your Hormones: A No-Nonsense Plate","slug":"eating-for-your-hormones","type":"Tip","kw":"No special \"hormone diet\" required. The simple, evidence-based way to build meals that support steady energy, mood and hormone health for women."},{"name":"Cortisol and Your Hormones: How Stress Hijacks the System","slug":"cortisol-stress-hormones-women","type":"Article","kw":"Chronic stress doesn't just feel bad — it disrupts your sex hormones, sleep, cycle and weight. How cortisol works, and how to bring it back down."},{"name":"Your Cycle, Phase by Phase: A Simple Map","slug":"menstrual-cycle-phases-explained","type":"Fact","kw":"Understand your menstrual cycle in plain language: the four phases, what each hormone does, and why you feel different across the month."},{"name":"Thyroid or Hormones? Why Women Get Misdiagnosed","slug":"thyroid-or-hormones-women","type":"Article","kw":"Fatigue, weight changes, low mood, brain fog — thyroid problems and perimenopause look almost identical. Why women get misdiagnosed and what to ask for."},{"name":"Estrogen Dominance: What It Really Means (and the Myths)","slug":"estrogen-dominance-explained","type":"Fact","kw":"\"Estrogen dominance\" is everywhere online — but what does it mean? A clear, honest look at the concept, the symptoms, and the hype."},{"name":"PCOS, Explained: The Most Common Hormone Condition in Women","slug":"pcos-explained","type":"Article","kw":"PCOS affects roughly 1 in 10 women, and many don't know they have it. What polycystic ovary syndrome really is, the signs, and how it's managed."},{"name":"PMS or Something More? Understanding PMDD","slug":"pms-vs-pmdd","type":"Article","kw":"When premenstrual symptoms become severe enough to disrupt your life, it may be PMDD, not ordinary PMS. How to tell the difference — and what helps."},{"name":"Protecting Your Bones Before and After Menopause","slug":"bone-health-menopause-osteoporosis","type":"Article","kw":"Women lose bone fastest in the years around menopause. Why oestrogen matters for bones — and the practical steps that protect against osteoporosis."},{"name":"The Heart-Health Shift Every Woman Should Know at Menopause","slug":"menopause-heart-health","type":"Research","kw":"Heart disease risk rises for women after menopause as oestrogen falls. What the research shows — and the steps that protect your heart most."},{"name":"Why Your Skin Changes at Menopause (and What Actually Helps)","slug":"menopause-skin-changes","type":"Article","kw":"Drier, thinner, less firm skin — or sudden adult acne? Menopause changes your skin through oestrogen and androgens. What's happening and what helps."},{"name":"Thinning Hair in Your 40s and 50s: The Hormone Link","slug":"hair-thinning-women-hormones","type":"Article","kw":"Noticing more hair in the brush or a wider parting? Hormonal shifts in midlife affect hair. Why it thins — and the evidence-based ways to support regrowth."},{"name":"Where Did My Libido Go? Hormones, Stress and Desire in Midlife","slug":"low-libido-women-midlife","type":"Article","kw":"Low libido in midlife is common and rarely about one thing. How hormones, stress, sleep and intimacy all play a part — and what can bring desire back."},{"name":"Vaginal Dryness and Intimacy After Menopause — You Have Options","slug":"vaginal-dryness-intimacy-menopause","type":"Article","kw":"Vaginal dryness and discomfort after menopause are common, treatable, and nothing to be embarrassed about. Why it happens and the options that help."},{"name":"Heavy or Erratic Periods in Perimenopause: What's Normal, What's Not","slug":"perimenopause-periods-heavy-irregular","type":"Article","kw":"Periods changing in your 40s — heavier, closer together, unpredictable? What's normal in perimenopause, and the red flags worth seeing a doctor about."},{"name":"The Aches No One Warned You About: Menopause and Joint Pain","slug":"menopause-joint-pain","type":"Article","kw":"Stiff, achy joints in your 40s and 50s? Falling oestrogen affects joints directly. Why menopause causes joint pain — and what eases it."},{"name":"Menopause Brain Fog: Why It Happens and When It Lifts","slug":"menopause-brain-fog","type":"Article","kw":"Forgetting words, losing your train of thought? Menopause brain fog is real and usually temporary. Why it happens — and how to think more clearly."},{"name":"Why Anxiety Spikes in Perimenopause (and What Calms It)","slug":"perimenopause-anxiety-mood","type":"Article","kw":"New or worsening anxiety in your 40s is often hormonal. Why perimenopause raises anxiety and mood swings — and evidence-based ways to steady it."},{"name":"The Truth About HRT: What the Latest Research Actually Says","slug":"truth-about-hrt-research","type":"Research","kw":"Is HRT safe? An honest, evidence-based look at what the research says about hormone replacement therapy — benefits, risks, and how the thinking has changed."},{"name":"5 Everyday Habits That Help Balance Your Hormones Naturally","slug":"balance-hormones-naturally-habits","type":"Tip","kw":"Five simple, evidence-based daily habits that support healthy hormone balance naturally — for women at any stage, from regular cycles to menopause."},{"name":"Oestrogen, Progesterone and Testosterone: A Woman's Hormones, Explained","slug":"womens-hormones-explained","type":"Fact","kw":"A plain-language guide to the three hormones that shape how women feel — oestrogen, progesterone and testosterone — what each does, and how they change with age."},{"name":"Can't Sleep the Way You Used To? How Hormones Hijack Your Rest","slug":"menopause-sleep-hormones","type":"Tip","kw":"Sleep problems in perimenopause and menopause are driven by hormones, not bad habits. Why you wake at 3am — and simple, evidence-based ways to sleep better."},{"name":"Hot Flushes and Night Sweats: What's Really Happening (and What Helps)","slug":"hot-flushes-night-sweats-what-helps","type":"Article","kw":"What causes hot flushes and night sweats in perimenopause and menopause — and evidence-based, practical ways to reduce them, from triggers to treatment options."},{"name":"Why Am I Gaining Weight Around My Middle? The Hormone Connection","slug":"menopause-weight-gain-belly-hormones","type":"Article","kw":"Menopause weight gain around the belly isn't about willpower. Learn how shifting oestrogen changes where you store fat — and what actually helps."},{"name":"How Long Do Menopause Symptoms Actually Last?","slug":"how-long-do-menopause-symptoms-last","type":"Article","kw":"How long do menopause symptoms last? The honest answer, what the research shows about hot flushes and the perimenopause timeline, and why it varies so much."},{"name":"Perimenopause: The First Signs Most Women Miss","slug":"perimenopause-first-signs","type":"Article","kw":"The first signs of perimenopause are easy to miss. Learn the early symptoms — irregular periods, sleep changes, mood shifts — and what's happening to your hormones."}];
  var DATA_TOOLS = [{"slug":"testosterone-test","name":"Free Testosterone Test","blurb":"A 5-minute free-T calculator and 19-point symptom check that turns how you feel into a clear score.","track":"men","goals":["optimise","energy","libido","mood","weight","sleep","strength"]},{"slug":"andropause-calculator","name":"Andropause Calculator","blurb":"Find your hormonal-age stage using the validated ADAM and AMS questionnaires. No blood test needed.","track":"men","goals":["optimise","energy","mood","libido"]},{"slug":"testosterone-blood-test","name":"Testosterone Blood Test Guide","blurb":"Exactly which markers to ask for, what the numbers mean, and trusted at-home test providers.","track":"men","goals":["optimise"]},{"slug":"workout-generator","name":"Workout Generator","blurb":"Build a free weekly training plan matched to your goal, equipment and hormones.","track":"both","goals":["strength","weight","energy"]},{"slug":"testosterone-tracker","name":"Optimisation Tracker","blurb":"A 12-week measurement system to see what is actually moving your numbers.","track":"men","goals":["optimise","strength"]},{"slug":"hormone-quiz","name":"Hormone Type Quiz","blurb":"A 12-question quiz to map your perimenopause stage and hormone pattern. No email needed.","track":"women","goals":["optimise","flushes","mood","cycles","brainfog","weight","energy"]},{"slug":"perimenopause-blood-test","name":"Perimenopause Blood Test Guide","blurb":"Which hormones to test, when in your cycle to test them, and trusted at-home providers.","track":"women","goals":["optimise","cycles","flushes"]},{"slug":"foods","name":"Hormone-Boosting Foods","blurb":"Search 80 everyday foods rated for hormone health: what to lean on, and what to limit.","track":"both","goals":["optimise","energy","weight"]},{"slug":"supplements-guide","name":"Supplements Guide","blurb":"An honest, evidence-graded guide to what genuinely helps, what is mixed, and what is hype.","track":"both","goals":["optimise"]}];

  var GOAL_KW = {
    men: {
      energy:   ['energy','fatigue','tired','exhaust','afternoon','cortisol','sluggish','wake','b12','iron','adrenal'],
      libido:   ['libido','sex','erection','erectile','desire','drive','morning erection','tongkat','fadogia','zinc','boron','maca'],
      mood:     ['mood','depress','motivation','irritab','brain fog','focus','anxiety','stress','cortisol','wellbeing'],
      weight:   ['weight','fat','belly','visceral','lose','obes','metaboli','insulin','waist','diet','calorie','sugar'],
      sleep:    ['sleep','tired','wake','rest','insomnia','night','melatonin','magnesium','circadian','cortisol','alcohol'],
      strength: ['muscle','strength','train','workout','lift','gym','protein','recovery','creatine','gains','exercise','cardio'],
      optimise: ['testosterone','optimi','hormone','health','reset','baseline','blood test','supplement','lifestyle','low t','symptom','andropause']
    },
    women: {
      flushes:  ['hot flash','flush','night sweat','sweat','vasomotor','temperature','menopause','black cohosh'],
      mood:     ['mood','anxiety','depress','irritab','emotional','stress','wellbeing','low mood','overwhelm'],
      cycles:   ['cycle','period','menstru','irregular','bleeding','pms','ovulat','fertility','progesterone','pcos'],
      brainfog: ['brain fog','memory','focus','concentrat','cognit','forget','clarity','sharp'],
      weight:   ['weight','fat','belly','waist','metaboli','insulin','midsection','menopause weight','bloat'],
      energy:   ['energy','fatigue','tired','exhaust','sleep','cortisol','thyroid','sluggish','iron','adrenal'],
      optimise: ['hormone','oestrogen','estrogen','perimenopause','menopause','balance','health','hrt','supplement','progesterone']
    }
  };

  var NX = (function () {
    /* affiliate discipline: on-page buy links ONLY via verified /recommends/* 301s */
    var REC_SET = {"ashwagandha":1,"black-seed-oil":1,"blood-test-international":1,"blood-test-uk":1,"blood-test-us":1,"book":1,"boron":1,"citrulline":1,"citrulline-malate":1,"creatine":1,"evening-primrose-oil":1,"everlywell":1,"fella":1,"fenugreek":1,"forth":1,"glutamine":1,"informed-sport":1,"labdoor":1,"letsgetchecked":1,"magnesium":1,"medichecks":1,"moringa":1,"mushroom-complex":1,"mylabbox":1,"numan":1,"omega-3":1,"premium-d3-k2":1,"quality-lab-tested":1,"roman":1,"spirulina-chlorella":1,"supplement-stack-uk":1,"supplement-stack-us":1,"taurine":1,"thriva":1,"tongkat-ali":1,"trt-uk":1,"trt-us":1,"ultalab":1,"vitamin-b1":1,"vitamin-b12":1,"vitamin-d3-k2":1,"welzo":1,"zinc":1};
    var REC_ALIAS = {
      'l-citrulline':'citrulline','citrulline-malate':'citrulline-malate',
      'omega-3-epa-dha':'omega-3','omega-3-fish-oil':'omega-3',
      'magnesium-glycinate':'magnesium','magnesium-citrate':'magnesium',
      'creatine-monohydrate':'creatine','vitamin-d3-k2':'vitamin-d3-k2',
      'vitamin-d':'vitamin-d3-k2','vitamin-b-12':'vitamin-b12','vitamin-b-1':'vitamin-b1',
      'spirulina':'spirulina-chlorella','chlorella':'spirulina-chlorella',
      'black-seed':'black-seed-oil','evening-primrose':'evening-primrose-oil'
    };
    function recFor(slug) {
      if (!slug) return null;
      var base = slug.replace(/-women$/, '');
      var cand = REC_ALIAS[base] || base;
      return REC_SET[cand] ? ('/recommends/' + cand) : null;
    }
    var FOUND_M = ['salmon','eggs','spinach','kale','extra-virgin-olive-oil','oysters','brazil-nuts','avocado','pumpkin-seeds','broccoli'];
    var FOUND_W = ['salmon','eggs','spinach','flaxseed','soy-tofu','broccoli','blueberries','extra-virgin-olive-oil','avocado','pumpkin-seeds'];
    function rel(text, kws) { text = ('' + text).toLowerCase(); var s = 0; for (var i = 0; i < kws.length; i++) { if (kws[i] && text.indexOf(kws[i]) !== -1) s++; } return s; }
    function kwf(track, goal) { var g = GOAL_KW[track] || GOAL_KW.men; return g[goal] || g.optimise; }
    function tierClass(t) { return t === 'strong' ? 'works' : (t === 'some' ? 'some' : 'unproven'); }
    function uniqBy(arr, key) { var seen = {}, out = []; arr.forEach(function (x) { var k = x[key]; if (!seen[k]) { seen[k] = 1; out.push(x); } }); return out; }

    function foods(track, goal) {
      var kws = kwf(track, goal); var found = track === 'women' ? FOUND_W : FOUND_M;
      function comp(f) { return rel(f.name + ' ' + f.kw + ' ' + f.group, kws) * 3 + (found.indexOf(f.slug) !== -1 ? 2 : 0); }
      function mk(f, hi) {
        var r = rel(f.name + ' ' + f.kw, kws);
        var sc = hi ? Math.min(98, 80 + r * 4 + (found.indexOf(f.slug) !== -1 ? 6 : 0)) : Math.max(12, 28 - r * 3);
        return { name: f.name, score: sc, href: '/foods/' + f.slug };
      }
      var sup = DATA_FOODS.filter(function (f) { return f.effect === 'Supports'; })
        .map(function (f) { return { f: f, c: comp(f) }; }).sort(function (a, b) { return b.c - a.c; });
      var boosters = sup.slice(0, 7).map(function (o) { return mk(o.f, true); });
      var lim = DATA_FOODS.filter(function (f) { return f.effect === 'Limit'; })
        .map(function (f) { return { f: f, c: rel(f.f ? '' : (f.name + ' ' + f.kw), kws) }; });
      // recompute limits cleanly
      lim = DATA_FOODS.filter(function (f) { return f.effect === 'Limit'; })
        .map(function (f) { return { f: f, c: rel(f.name + ' ' + f.kw, kws) }; }).sort(function (a, b) { return b.c - a.c; });
      var limits = lim.slice(0, 4).map(function (o) { return mk(o.f, false); });
      return { boosters: boosters, limits: limits, seeAll: '/foods' };
    }

    function supps(track, goal) {
      var aud = track === 'women' ? 'Women' : 'Men'; var kws = kwf(track, goal);
      var tierW = { strong: 2, some: 1, unproven: 0 };
      var pool = DATA_SUPPS.filter(function (s) { return s.aud === aud; });
      var scored = pool.map(function (s) { return { s: s, c: rel(s.name + ' ' + s.kw, kws) * 2 + (tierW[s.tier] || 0) }; })
        .sort(function (a, b) { return b.c - a.c; });
      var list = uniqBy(scored.slice(0, 6).map(function (o) { return o.s; }), 'slug').slice(0, 5).map(function (s) {
        return { name: s.name, tier: tierClass(s.tier), info: '/supplements/' + s.slug, recommends: recFor(s.slug) };
      });
      return { list: list, seeAll: '/supplements-guide' };
    }

    function questions(track, goal) {
      var kws = kwf(track, goal);
      var ok = track === 'women' ? { Women: 1, Both: 1 } : { Men: 1, Both: 1 };
      var pool = DATA_QUESTIONS.filter(function (q) { return ok[q.cat]; });
      var cur = (Q_MAP[track] && Q_MAP[track][goal]) || [];
      var curItems = [];
      cur.forEach(function (it) { var m = pool.filter(function (q) { return q.slug === it.slug; })[0]; if (m) curItems.push(m); });
      var scored = pool.map(function (q) { return { q: q, c: rel(q.name + ' ' + q.kw, kws) }; })
        .sort(function (a, b) { return b.c - a.c; }).map(function (o) { return o.q; });
      var merged = uniqBy(curItems.concat(scored), 'slug').slice(0, 5);
      return { list: merged.map(function (q) { return { href: '/questions/' + q.slug, label: q.name }; }), seeAll: '/ask' };
    }

    function articles(track, goal) {
      var kws = kwf(track, goal);
      if (track === 'women') {
        var pw = DATA_WOMEN_ART.map(function (a) { return { a: a, c: rel(a.name + ' ' + a.kw, kws) }; })
          .sort(function (x, y) { return y.c - x.c; });
        return { list: pw.slice(0, 4).map(function (o) { return { href: '/womens-articles/' + o.a.slug, label: o.a.name }; }), seeAll: '/womens-hormone-health' };
      }
      var pm = DATA_MEN_ART.filter(function (a) { return !a.exclude; })
        .map(function (a) { return { a: a, c: rel(a.title + ' ' + a.kw, kws) }; }).sort(function (x, y) { return y.c - x.c; });
      return { list: pm.slice(0, 4).map(function (o) { return { href: '/' + o.a.slug, label: o.a.title }; }), seeAll: '/resources' };
    }

    function tools(track, goal, stage) {
      var pool = DATA_TOOLS.filter(function (t) { return t.track === track || t.track === 'both'; });
      var scored = pool.map(function (t) {
        return { t: t, c: (t.goals.indexOf(goal) !== -1 ? 2 : 0) + (t.track === track ? 1 : 0) };
      }).sort(function (a, b) { return b.c - a.c; });
      var list = scored.slice(0, 4).map(function (o) { return { name: o.t.name, blurb: o.t.blurb, href: '/' + o.t.slug }; });
      return { primary: list[0], list: list };
    }

    function auditLinks() {
      var fSlugs = {}, qSlugs = {}, sSlugs = {}, waSlugs = {}, maSlugs = {}, tSlugs = {};
      DATA_FOODS.forEach(function (x) { fSlugs[x.slug] = 1; });
      DATA_QUESTIONS.forEach(function (x) { qSlugs[x.slug] = 1; });
      DATA_SUPPS.forEach(function (x) { sSlugs[x.slug] = 1; });
      DATA_WOMEN_ART.forEach(function (x) { waSlugs[x.slug] = 1; });
      DATA_MEN_ART.forEach(function (x) { maSlugs[x.slug] = 1; });
      DATA_TOOLS.forEach(function (x) { tSlugs[x.slug] = 1; });
      var bad = [];
      function chkFoods(href){ var s=href.replace('/foods/',''); if(href.indexOf('/foods/')===0 && !fSlugs[s]) bad.push('food '+href); }
      function chkSupp(href){ var s=href.replace('/supplements/',''); if(!sSlugs[s]) bad.push('supp '+href); }
      function chkQ(href){ var s=href.replace('/questions/',''); if(!qSlugs[s]) bad.push('question '+href); }
      var stages=['starting','normal_but_off','have_bloods'];
      Object.keys(GOALS).forEach(function(track){ GOALS[track].forEach(function(goal){ stages.forEach(function(stage){
        var p=buildPlan({track:track,goal:goal,stage:stage,ageBand:'40s'});
        p.foods.boosters.concat(p.foods.limits).forEach(function(f){chkFoods(f.href);});
        p.supplements.forEach(function(s){chkSupp(s.info);});
        p.questions.forEach(function(q){chkQ(q.href);});
        // lever question links
        p.levers.forEach(function(l){ if(l.link && l.link.indexOf('/questions/')===0){ var s=l.link.replace('/questions/',''); if(!qSlugs[s]) bad.push('lever '+l.link+' ('+track+'/'+goal+')'); } });
        // articles
        p.articles.forEach(function(a){
          if(track==='women'){ var s=a.href.replace('/womens-articles/',''); if(!waSlugs[s]) bad.push('w-article '+a.href); }
          else { var s2=a.href.replace('/',''); if(!maSlugs[s2]) bad.push('m-article '+a.href); }
        });
        // tools
        p.tools.forEach(function(t){ var s=t.href.replace('/',''); if(!tSlugs[s]) bad.push('tool '+t.href); });
      });});});
      return { bad: bad, ok: bad.length===0 };
    }

    return { foods: foods, supps: supps, questions: questions, articles: articles, tools: tools, auditLinks: auditLinks };
  })();

  /* ---- Pagrindine: buildPlan -------------------------------------------- */
  function buildPlan(input, opts) {
    opts = opts || {};
    var p = normalise(input);
    var steps = selectSteps(p.track, p.goal, opts.weekIndex);
    var NXfoods = NX.foods(p.track, p.goal);
    var NXsupps = NX.supps(p.track, p.goal);
    var NXq = NX.questions(p.track, p.goal);
    var NXa = NX.articles(p.track, p.goal);
    var NXt = NX.tools(p.track, p.goal, p.stage);

    return {
      meta: {
        track: p.track,
        goal: p.goal,
        goalLabel: GOAL_LABEL[p.track][p.goal],
        stage: p.stage,
        ageBand: p.ageBand,
        version: VERSION
      },
      mirror: buildMirror(p),
      readiness: estimateReadiness(p),               // pasirinktinai rodyti
      levers: reorderLevers(pick(LEVER_MAP, p.track, p.goal), p.stage),
      foods: NXfoods,
      tool: NXt.primary,
      tools: NXt.list,
      supplements: NXsupps.list,
      supplementsSeeAll: NXsupps.seeAll,
      questions: NXq.list,
      questionsSeeAll: NXq.seeAll,
      articles: NXa.list,
      articlesSeeAll: NXa.seeAll,
      thisWeek: steps.thisWeek,
      weeklySteps: steps.all
      // 30-dienu kelias SAMONINGAI ne cia - puslapio sablonas (iliustracija).
    };
  }

  /* ---- Self-test (paleisti konsoleje verifikacijai) --------------------- */
  function selfTest() {
    var problems = [], total = 0;
    var stages = ['starting', 'normal_but_off', 'have_bloods'];
    Object.keys(GOALS).forEach(function (track) {
      GOALS[track].forEach(function (goal) {
        stages.forEach(function (stage) {
          total++;
          var plan = buildPlan({ track: track, goal: goal, stage: stage, ageBand: '40s' });
          if (!plan.mirror.headline) problems.push(track + '/' + goal + '/' + stage + ': no headline');
          if (plan.levers.length !== 3) problems.push(track + '/' + goal + '/' + stage + ': levers != 3');
          if (plan.foods.boosters.length < 3) problems.push(track + '/' + goal + '/' + stage + ': boosters < 3');
          if (!plan.tool.href) problems.push(track + '/' + goal + '/' + stage + ': no tool');
          if (plan.supplements.length < 1) problems.push(track + '/' + goal + '/' + stage + ': no supps');
          if (plan.questions.length < 1) problems.push(track + '/' + goal + '/' + stage + ': no questions');
          if (plan.articles.length < 1) problems.push(track + '/' + goal + '/' + stage + ': no articles');
          if (plan.tools.length < 1) problems.push(track + '/' + goal + '/' + stage + ': no tools');
          if (!plan.thisWeek) problems.push(track + '/' + goal + '/' + stage + ': no weekly step');
        });
      });
    });
    // krastutiniai atvejai
    [{}, { track: 'x' }, { track: 'women', goal: 'energy' }, { track: 'men', goal: 'flushes' }].forEach(function (bad) {
      total++;
      try { buildPlan(bad); } catch (e) { problems.push('threw on ' + JSON.stringify(bad)); }
    });
    return { total: total, passed: total - problems.length, failed: problems.length, problems: problems };
  }

  /* ---- Eksportas -------------------------------------------------------- */
  var HormonePlan = {
    VERSION: VERSION,
    GOALS: GOALS,
    GOAL_LABEL: GOAL_LABEL,
    buildPlan: buildPlan,
    estimateReadiness: estimateReadiness,
    selectFoods: selectFoods,
    selfTest: selfTest,
    NX: NX,
    _data: { FOODS: DATA_FOODS, QUESTIONS: DATA_QUESTIONS, SUPPS: DATA_SUPPS, MEN_ART: DATA_MEN_ART, WOMEN_ART: DATA_WOMEN_ART, TOOLS: DATA_TOOLS },
    _maps: {
      MIRROR: MIRROR, STAGE_LEAD: STAGE_LEAD, AGE_NOTE: AGE_NOTE,
      LEVER_MAP: LEVER_MAP, FOODS: FOODS, TOOL_MAP: TOOL_MAP, TOOL_DETAILS: TOOL_DETAILS,
      SUPP_MAP: SUPP_MAP, Q_MAP: Q_MAP, STEP_LIST: STEP_LIST
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = HormonePlan;
  root.HormonePlan = HormonePlan;

})(typeof window !== 'undefined' ? window : this);

/* ============================================================================
 * NAUDOJIMO PAVYZDYS (atitinka rezultatu mockup'a):
 *
 *   var plan = HormonePlan.buildPlan({
 *     track: 'men', ageBand: '40s', goal: 'energy', stage: 'normal_but_off'
 *   });
 *
 *   plan.mirror.headline   -> "Tired by mid-afternoon, even after a full night's sleep?"
 *   plan.levers[0].title   -> "Confirm the real number"  (test pakeltas del normal_but_off)
 *   plan.foods.boosters    -> [Oily fish, Eggs, Leafy greens, Lean red meat, Avocado]
 *   plan.tool.name         -> "Free Testosterone Test"
 *   plan.supplements       -> [Vitamin D3+K2 (works), Magnesium (works), Ashwagandha (some)]
 *   plan.questions         -> 3 x /questions/*
 *   plan.thisWeek          -> "Set a fixed wake-up time, even at weekends, for one week."
 *
 * Verifikacija: HormonePlan.selfTest()  ->  { passed, failed, problems: [] }
 * ==========================================================================*/
