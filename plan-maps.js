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

  var VERSION = '1.0.0';

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
    men_energy:   [ "Set a fixed wake-up time, even at weekends, for one week.", "Get outside for some daylight within an hour of waking.", "Add a source of protein to your breakfast.", "Swap one late scroll for a proper wind-down.", "Take a short walk after your evening meal." ],
    men_libido:   [ "Prioritise a full night's sleep, the foundation for libido.", "Add two strength sessions to your week.", "Ease back on alcohol on weeknights.", "Spend ten quiet minutes a day on something relaxing.", "Add oily fish or a handful of nuts to your week." ],
    men_mood:     [ "Get outside for daylight early each day.", "Move your body daily, even just a walk.", "Name one stressor and tackle one small part of it.", "Protect your wind-down hour before bed.", "Check in with someone you trust this week." ],
    men_weight:   [ "Build each meal around protein and vegetables.", "Take a walk after your largest meal.", "Keep sugary drinks out of the house this week.", "Add one extra strength session.", "Prioritise sleep, since short nights drive next-day hunger." ],
    men_sleep:    [ "Set a fixed wake-up time for seven days straight.", "Stop caffeine after lunch this week.", "Dim the lights for the last hour before bed.", "Keep alcohol off the table on weeknights.", "Get morning daylight to anchor your body clock." ],
    men_strength: [ "Get two full-body strength sessions in this week.", "Add protein to each main meal.", "Add one set to your main lifts.", "Prioritise sleep on training days.", "Take a rest day without guilt, since that is when you grow." ],
    men_optimise: [ "Set a consistent sleep and wake time.", "Get daylight early each day.", "Add two strength sessions this week.", "Build meals around protein and colourful veg.", "Keep alcohol to a minimum this week." ],

    women_flushes:  [ "Notice what tends to trigger your flushes this week.", "Keep your bedroom cool and layer your bedding.", "Ease back on alcohol and see if flushes settle.", "Add ground flaxseed to breakfast a few times this week.", "Try a few minutes of slow breathing when a flush builds." ],
    women_mood:     [ "Get outside for daylight early each day.", "Move your body daily, even gently.", "Protect a wind-down hour before bed.", "Reach out to someone who steadies you this week.", "Add oily fish or some omega-3 to your week." ],
    women_cycles:   [ "Keep a simple note of your cycle and symptoms this week.", "Add ground flaxseed or sesame to your day.", "Aim for steady, balanced meals to ease the swings.", "Get gentle movement on the days you feel up to it.", "Protect your sleep, especially before your period." ],
    women_brainfog: [ "Get morning daylight to sharpen your body clock.", "Add oily fish or berries to your week.", "Do one thing at a time rather than three at once.", "Take a short walk when your head feels foggy.", "Protect your sleep, since fog usually lifts with rest." ],
    women_weight:   [ "Build each meal around protein and vegetables.", "Take a short walk after your largest meal.", "Keep sugary drinks out of the house this week.", "Add gentle strength work to protect muscle.", "Prioritise sleep, since it steadies appetite." ],
    women_energy:   [ "Set a steady wake-up time for one week.", "Get daylight within an hour of waking.", "Add a source of protein to breakfast.", "Take a short walk when energy dips, rather than reaching for sugar.", "Wind down properly before bed." ],
    women_optimise: [ "Set a consistent sleep and wake time.", "Get daylight early each day.", "Add gentle strength work to your week.", "Build meals around protein, fibre and colour.", "Keep alcohol light this week." ]
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

  /* ---- Pagrindine: buildPlan -------------------------------------------- */
  function buildPlan(input, opts) {
    opts = opts || {};
    var p = normalise(input);
    var steps = selectSteps(p.track, p.goal, opts.weekIndex);

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
      foods: selectFoods(p.track, p.goal),
      tool: selectTool(p.track, p.stage),
      supplements: pick(SUPP_MAP, p.track, p.goal).slice(),
      questions: selectQuestions(p.track, p.goal),
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
          if (plan.questions.length !== 3) problems.push(track + '/' + goal + '/' + stage + ': questions != 3');
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
