/* Noctia — shared behaviour */
(function () {
  "use strict";

  // ── Live company counter (shared across pages, drifts upward slowly) ──
  var BASE_COMPANIES = 12418;
  var EPOCH = Date.UTC(2026, 10, 1); // counter starts drifting from this date
  function companiesNow() {
    var perHour = 9;
    var hours = Math.max(0, (Date.now() - EPOCH) / 36e5);
    return BASE_COMPANIES + Math.floor(hours * perHour);
  }
  function fmt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  window.noctia = { companiesNow: companiesNow, fmt: fmt };

  document.querySelectorAll("[data-companies]").forEach(function (el) {
    el.textContent = fmt(companiesNow());
  });

  // ── Terminal strip: rotating "activity" lines, typed out ──
  var LINES = [
    "Creating new UGC videos",
    "Updating task list...",
    "Listing files...",
    "Checking available services...",
    "Found 3 services",
    "Drafting cold email sequence...",
    "Deploying landing page v2...",
    "Reading inbox: 14 new messages",
    "Writing you a note",
    "Optimising ad set budget...",
    "Opening pull request #212",
    "Running nightly plan"
  ];
  var term = document.querySelector("[data-terminal]");
  if (term) {
    var fixed = term.getAttribute("data-terminal");
    var live = term.querySelector(".t-live");
    if (fixed) {
      live.textContent = "> " + fixed;
    } else if (live) {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var i = Math.floor(Math.random() * LINES.length);
      var typeLine = function () {
        var text = "> " + LINES[i];
        i = (i + 1) % LINES.length;
        if (reduce) { live.textContent = text; return; }
        var k = 0;
        live.textContent = "> ";
        var t = setInterval(function () {
          k++;
          live.textContent = text.slice(0, k + 2);
          if (k + 2 >= text.length) clearInterval(t);
        }, 38);
      };
      typeLine();
      setInterval(typeLine, 3600);
    }
  }

  // ── Reveal on scroll ──
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // ── Onboarding steps (new.html) ──
  var steps = document.querySelectorAll(".step");
  if (steps.length) {
    var show = function (id) {
      steps.forEach(function (s) { s.classList.toggle("active", s.id === id); });
      var h = document.querySelector("#" + id + " h1, #" + id + " input, #" + id + " textarea");
      if (h && h.focus) h.focus();
    };
    document.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); show(b.getAttribute("data-go")); });
    });
    document.querySelectorAll("form[data-next]").forEach(function (f) {
      f.addEventListener("submit", function (e) { e.preventDefault(); show(f.getAttribute("data-next")); });
    });
    var surprise = document.querySelector("[data-surprise]");
    if (surprise) {
      var IDEAS = [
        "A subscription that mails dog owners a vet-approved treat box every month",
        "An AI phone receptionist for independent dental clinics",
        "A marketplace for second-hand camera lenses with verified condition grading",
        "A weekly newsletter that summarises planning permissions in your city",
        "A tool that turns podcast episodes into LinkedIn carousels"
      ];
      surprise.addEventListener("click", function (e) {
        e.preventDefault();
        var ta = document.querySelector("#idea textarea");
        if (ta) ta.value = IDEAS[Math.floor(Math.random() * IDEAS.length)];
        show("idea");
      });
    }
  }
})();
