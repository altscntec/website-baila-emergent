/* Noctia — shared behaviour */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Site nav: transparent over the hero, glass after ──
  var nav = document.querySelector(".site-nav");
  var hero = document.querySelector(".frame.hero");
  if (nav && hero) {
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > hero.offsetHeight - 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ── Slide counter: "01 / 06" follows the section in view ──
  var counter = document.querySelector("[data-counter]");
  var slides = document.querySelectorAll("[data-slide]");
  if (counter && slides.length && "IntersectionObserver" in window) {
    var total = String(slides.length).padStart(2, "0");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) counter.textContent = String(e.target.getAttribute("data-slide")).padStart(2, "0") + " / " + total;
      });
    }, { threshold: 0.4 });
    slides.forEach(function (s) { io.observe(s); });
  }

  // ── Hero thumbnail rail: highlight follows the section too ──
  var thumbs = document.querySelectorAll(".thumbs img[data-for], .swatches span[data-for]");
  if (thumbs.length && "IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target.getAttribute("data-slide");
        thumbs.forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-for") === n); });
      });
    }, { threshold: 0.4 });
    slides.forEach(function (s) { io2.observe(s); });
  }

  // ── Reveal on scroll ──
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length && !reduce) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io3.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io3.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // ── Film strip: drag to scroll ──
  document.querySelectorAll(".strip-scroller").forEach(function (el) {
    var down = false, startX = 0, startLeft = 0;
    el.addEventListener("pointerdown", function (e) {
      down = true; startX = e.clientX; startLeft = el.scrollLeft; el.classList.add("dragging"); el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function (e) { if (down) el.scrollLeft = startLeft - (e.clientX - startX); });
    var up = function () { down = false; el.classList.remove("dragging"); };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });

  // ── Menu button (phone): toggles the link list ──
  var menuBtn = document.querySelector(".menu-btn");
  var links = document.querySelector(".site-nav .links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", function () {
      var open = links.style.display === "flex";
      links.style.display = open ? "" : "flex";
      links.style.position = open ? "" : "absolute";
      links.style.top = open ? "" : "72px";
      links.style.right = open ? "" : "16px";
      links.style.flexDirection = open ? "" : "column";
      links.style.padding = open ? "" : "16px 20px";
      links.style.borderRadius = open ? "" : "18px";
      links.style.background = open ? "" : "rgba(15,15,18,0.85)";
      links.style.color = open ? "" : "#fff";
      links.style.backdropFilter = open ? "" : "blur(20px)";
      menuBtn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  }

  // ── "Updated n seconds ago" tick on app pages ──
  var ago = document.querySelector("[data-ago]");
  if (ago) {
    var t0 = Date.now() - 4000;
    setInterval(function () {
      var s = Math.round((Date.now() - t0) / 1000);
      ago.textContent = "Updated " + (s < 60 ? s + " seconds" : Math.floor(s / 60) + " min") + " ago";
    }, 1000);
  }

  // ── Running timers on task cards ──
  var timers = document.querySelectorAll("[data-running]");
  if (timers.length) {
    setInterval(function () {
      timers.forEach(function (el) {
        var s = parseInt(el.getAttribute("data-running"), 10) + 1;
        el.setAttribute("data-running", s);
        el.textContent = Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s";
      });
    }, 1000);
  }

  // ── Toggle groups (filters, genres, providers) ──
  document.querySelectorAll("[data-toggle-group]").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      group.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
    });
  });

  // ── Start page: mode switch and steps ──
  var seg = document.querySelector(".seg");
  if (seg) {
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      seg.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
      document.querySelectorAll(".mode").forEach(function (m) { m.classList.toggle("active", m.id === b.getAttribute("data-mode")); });
    });
    var form = document.querySelector("#start-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        form.style.display = "none";
        var done = document.querySelector(".done");
        if (done) done.classList.add("active");
      });
    }
    var surprise = document.querySelector("[data-surprise]");
    if (surprise) {
      var IDEAS = ["Winter Reggaeton Night", "Bachata Rooftop, Eindhoven", "Salsa Social, Groningen", "Dembow Block Party, Amsterdam"];
      surprise.addEventListener("click", function () {
        var ev = document.querySelector("#ev");
        if (ev) ev.value = IDEAS[Math.floor(Math.random() * IDEAS.length)];
      });
    }
  }
})();
