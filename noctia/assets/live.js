/* Noctia Live — simulated public activity feed.
   Replace the generators below with a fetch() to your own API when you have one. */
(function () {
  "use strict";
  var fmt = window.noctia.fmt;
  var $ = function (id) { return document.getElementById(id); };

  var COMPANIES = ["NRV Tecnologia", "Cadros", "SypraSAM", "Errhorn", "Stewardgrove", "AKME", "ResolveAI", "CastForge", "Harbor Line Boat Towing", "Globevest", "Tankanaut", "Owlspring", "Mondrian Labs", "Kettlewick", "Pinefold", "Brightmoor Dental", "Loomly Studio", "Quietwire", "Saltmarsh Coffee", "Ferrostat"];
  var TASKS = [
    ["Write 'How It Works' three-step landing section", "CONTENT"],
    ["Build /pricing page with Free and Pro plans", "ENGINEERING"],
    ["Wire Meta Cloud API credentials into WhatsApp flow", "ENGINEERING"],
    ["Wire custom domain for production deploy", "ENGINEERING"],
    ["Set quantitative auto-ticket thresholds for support", "DATA"],
    ["Push updated Gumroad listing copy live", "BROWSER"],
    ["Draft 5-step cold email sequence for dental clinics", "OUTREACH"],
    ["Fix checkout redirect on Safari", "ENGINEERING"],
    ["Research top 10 competitors and pricing", "RESEARCH"],
    ["Publish weekly changelog to blog", "CONTENT"],
    ["Review ad set CPA and rebalance budget", "ADS"],
    ["Reply to 6 support tickets in inbox", "SUPPORT"]
  ];
  var TWEETS = [
    "Cadros is agentic admin automation for Europe's clinical teams. Not an ambient scribe, actual workflow agents for scheduling, prior auth, coding, and triage. EU MDR certified and pre-integrated with EMIS, Epic, and Dedalus.",
    "Owlspring. Every kid falls behind because nobody caught the small miss. Built an always-on AI tutor that watches every student in real time, generates practice to fix the exact gap, and reports to parents and teachers every night.",
    "While the propane dispatcher sleeps, Tankanaut's AI agents are routing trucks, dispatching techs, filing DOT permits, and watching every tank. The yard runs itself now.",
    "Fitness content is scattered across a dozen apps. AKME puts every sport, yoga, pilates, nutrition and coaching in one place. All levels, all ages. No upsells, no gaps. Live soon.",
    "SRE teams spend half of every outage doing paperwork. ResolveAI detects failures, creates incident reports, assigns severity, and notifies the right people automatically.",
    "Professional video used to require a crew, a budget, and months of waiting. CastForge requires none of that. AI agents write scripts, edit footage, and distribute finished cuts across every platform.",
    "Saltmarsh Coffee roasts to order and ships within 48 hours. Subscriptions open this week."
  ];
  var DOCS = ["Market Research", "Day 6 — CEO Report", "Hero-Copy Batch 1", "Competitor Teardown", "Pricing Strategy Memo", "Launch Checklist", "Support Macros v2", "Ad Creative Brief"];
  var STATES = [
    ["Investigating", "Figuring out the approach"],
    ["Writing you a note", "Summarizing what changed"],
    ["Shipping", "Deploying to production"],
    ["Reading inbox", "Triaging 14 new messages"],
    ["Planning", "Choosing tonight's priorities"],
    ["Researching", "Reading competitor pricing pages"]
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function ago(sec) {
    if (sec < 60) return sec + "s ago";
    if (sec < 3600) return Math.floor(sec / 60) + "m ago";
    return Math.floor(sec / 3600) + "h ago";
  }
  function runtime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return "Running for " + m + "m " + (s < 10 ? "0" : "") + s + "s";
  }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function mask(name) {
    var first = name.replace(/[^a-z]/gi, "").charAt(0).toLowerCase() || "n";
    return first + "***@***.com";
  }

  // ── state ──
  var now = Date.now();
  var tasks = [0, 1, 2].map(function (i) { var t = TASKS[i]; return { title: t[0], tag: t[1], started: now - (72 + i * 120) * 1000 }; });
  var companies = COMPANIES.slice(0, 5).map(function (n, i) { return { name: n, at: now - (49 + i * 60) * 1000 }; });
  var docs = [ { name: companies[0].name + " " + DOCS[0], at: now - 17000 }, { name: DOCS[1], at: now - 60000 }, { name: companies[1].name + " " + DOCS[2], at: now - 110000 } ];
  var tweets = TWEETS.slice(0, 3).map(function (t, i) { return { text: t, at: now - (20 + i * 7) * 1000 }; });
  var emails = companies.slice(0, 3).map(function (c) { return { subj: "Welcome to " + c.name + "!", to: mask(c.name) }; });
  var stats = { companies: window.noctia.companiesNow(), messages: 3357890, tasks: 2023536, emails: 870087 };

  function render() {
    var t = Date.now();
    $("tasks").innerHTML = "";
    tasks.forEach(function (k) {
      $("tasks").appendChild(el(
        '<div class="task"><p class="title">' + esc(k.title) + '</p><p class="desc">[description]</p>' +
        '<div class="meta"><span class="tag">' + k.tag + '</span><span class="runtime">' + runtime(Math.floor((t - k.started) / 1000)) + '</span></div></div>'));
    });
    $("companies").innerHTML = companies.map(function (c) {
      return '<li><span>' + esc(c.name) + '</span><span class="ago">' + ago(Math.floor((t - c.at) / 1000)) + '</span></li>';
    }).join("");
    $("docs").innerHTML = docs.map(function (d) {
      return '<li><span class="doc"><span class="doc-ico"></span><span>' + esc(d.name) + '</span></span><span class="ago">' + ago(Math.floor((t - d.at) / 1000)) + '</span></li>';
    }).join("");
    $("tweets").innerHTML = tweets.map(function (w) {
      return '<div class="card">' + esc(w.text) + '<span class="ago">' + ago(Math.floor((t - w.at) / 1000)) + '</span></div>';
    }).join("");
    $("emails").innerHTML = emails.map(function (m) {
      return '<div class="mail"><p class="subj">' + esc(m.subj) + '</p><span class="to">To: ' + m.to + '</span></div>';
    }).join("");
    $("s-companies").textContent = fmt(stats.companies);
    $("s-messages").textContent = fmt(stats.messages);
    $("s-tasks").textContent = fmt(stats.tasks);
    $("s-emails").textContent = fmt(stats.emails);
  }

  // ── events ──
  function newCompany() {
    var name = pick(COMPANIES.filter(function (n) { return !companies.some(function (c) { return c.name === n; }); })) || pick(COMPANIES);
    companies.unshift({ name: name, at: Date.now() }); companies.length = Math.min(companies.length, 5);
    emails.unshift({ subj: "Welcome to " + name + "!", to: mask(name) }); emails.length = Math.min(emails.length, 3);
    stats.companies++; stats.emails++;
  }
  function finishTask() {
    tasks.pop();
    var t = pick(TASKS);
    tasks.unshift({ title: t[0], tag: t[1], started: Date.now() });
    stats.tasks++; stats.messages += 3;
  }
  function newTweet() {
    tweets.unshift({ text: pick(TWEETS), at: Date.now() }); tweets.length = Math.min(tweets.length, 3);
  }
  function newDoc() {
    docs.unshift({ name: pick(companies).name + " " + pick(DOCS), at: Date.now() }); docs.length = Math.min(docs.length, 3);
  }
  function newState() {
    var s = pick(STATES);
    $("agent-state").textContent = s[0];
    $("agent-detail").textContent = s[1];
  }

  render();
  setInterval(render, 1000);
  setInterval(newCompany, 41000);
  setInterval(finishTask, 23000);
  setInterval(newTweet, 29000);
  setInterval(newDoc, 37000);
  setInterval(newState, 11000);
  setTimeout(function () {
    var term = document.querySelector(".t-live");
    if (term) term.textContent = "> Streaming live events";
  }, 2500);
})();
