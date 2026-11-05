(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function whenVisible(el, cb, options) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting, io); });
    }, options || { threshold: 0.2 });
    io.observe(el);
  }

  // ---------------------------------------------------------------------
  // Transition de sortie entre les pages du site
  // ---------------------------------------------------------------------
  function pageTransitions() {
    if (reduced) return;
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target || a.hasAttribute("download")) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (!/(\/|\.html)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(function () { location.href = url.href; }, 230);
    });
    window.addEventListener("pageshow", function () {
      document.body.classList.remove("is-leaving");
    });
  }

  // ---------------------------------------------------------------------
  // Halo lumineux qui suit la souris
  // ---------------------------------------------------------------------
  function cursorGlow() {
    if (!finePointer || reduced) return;
    var glow = document.createElement("div");
    glow.className = "fx-cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, running = false;
    function loop() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      glow.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) requestAnimationFrame(loop);
      else running = false;
    }
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add("is-on");
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () {
      glow.classList.remove("is-on");
    });
  }

  // ---------------------------------------------------------------------
  // Cartes qui s'inclinent en 3D sous la souris
  // ---------------------------------------------------------------------
  function tiltCards() {
    if (!finePointer || reduced) return;
    var sel = ".about-card, .temoignage, .skill-card, .search-side, .contact-tile, .contact-cv, .fp-media img, .bonus-cabinet";
    document.querySelectorAll(sel).forEach(function (el) {
      var max = el.matches(".fp-media img") ? 5 : 7;
      var timer;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        clearTimeout(timer);
        el.style.transition = "transform 120ms ease-out, border-color 250ms ease, box-shadow 250ms ease";
        el.style.transform = "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" +
          (px * max).toFixed(2) + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), border-color 250ms ease, box-shadow 250ms ease";
        el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
        timer = setTimeout(function () {
          el.style.transition = "";
          el.style.transform = "";
        }, 540);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Boutons "aimantés" : ils suivent légèrement le curseur
  // ---------------------------------------------------------------------
  function magneticButtons() {
    if (!finePointer || reduced) return;
    document.querySelectorAll(".button, .arcade-fab").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        b.style.translate = (dx * 12).toFixed(1) + "px " + (dy * 9).toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }

  // ---------------------------------------------------------------------
  // Titre principal : lettres qui tombent une par une, vague au survol
  // ---------------------------------------------------------------------
  function splitHeroTitle() {
    var h1 = document.querySelector(".hero h1");
    if (!h1 || reduced) return;
    var text = h1.textContent.trim();
    h1.setAttribute("aria-label", text);
    h1.textContent = "";
    var i = 0;
    text.split(/\s+/).forEach(function (word, wi) {
      if (wi > 0) h1.appendChild(document.createTextNode(" "));
      var w = document.createElement("span");
      w.className = "fx-word";
      w.setAttribute("aria-hidden", "true");
      Array.prototype.forEach.call(word, function (ch) {
        var c = document.createElement("span");
        c.className = "fx-char";
        c.style.setProperty("--i", i++);
        c.textContent = ch;
        w.appendChild(c);
      });
      h1.appendChild(w);
    });
  }

  // ---------------------------------------------------------------------
  // Clavier du hero : touches qui s'enfoncent comme si quelqu'un tapait
  // ---------------------------------------------------------------------
  function keyboardTyping() {
    var keyboard = document.querySelector(".keyboard");
    if (!keyboard || reduced) return;
    var keys = Array.prototype.slice.call(keyboard.querySelectorAll(".key"));
    if (!keys.length) return;

    function pressKey() {
      var target = keys[Math.floor(Math.random() * keys.length)];
      target.classList.add("is-pressed");
      setTimeout(function () { target.classList.remove("is-pressed"); }, 280);
    }

    var active = false, timer = null;
    function tick() {
      if (!active) return;
      pressKey();
      timer = setTimeout(tick, 1600 + Math.random() * 1600);
    }
    whenVisible(keyboard, function (visible) {
      active = visible;
      clearTimeout(timer);
      if (active) tick();
    });

    keys.forEach(function (k) {
      k.addEventListener("pointerdown", function () {
        k.classList.add("is-pressed");
        setTimeout(function () { k.classList.remove("is-pressed"); }, 280);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Sur-titre du hero : texte tapé puis effacé, en boucle
  // ---------------------------------------------------------------------
  function typedEyebrow() {
    var el = document.querySelector("[data-typed]");
    if (!el || reduced) return;
    var phrases = el.getAttribute("data-typed").split("|").filter(Boolean);
    if (!phrases.length) return;

    var label = document.createElement("span");
    label.className = "fx-typed-text";
    var caret = document.createElement("span");
    caret.className = "fx-caret";
    caret.setAttribute("aria-hidden", "true");
    el.setAttribute("aria-label", phrases[0]);
    el.textContent = "";
    el.appendChild(label);
    el.appendChild(caret);

    var p = 0, n = 0, deleting = false;
    function step() {
      var phrase = phrases[p];
      if (!deleting) {
        n++;
        label.textContent = phrase.slice(0, n);
        if (n >= phrase.length) {
          deleting = true;
          return setTimeout(step, 2400);
        }
        return setTimeout(step, 55 + Math.random() * 60);
      }
      n--;
      label.textContent = phrase.slice(0, n);
      if (n <= 0) {
        deleting = false;
        p = (p + 1) % phrases.length;
        return setTimeout(step, 380);
      }
      setTimeout(step, 28);
    }
    setTimeout(step, 600);
  }

  // ---------------------------------------------------------------------
  // Braises qui montent dans le hero
  // ---------------------------------------------------------------------
  function heroEmbers() {
    var hero = document.querySelector(".hero");
    if (!hero || reduced) return;
    var canvas = document.createElement("canvas");
    canvas.className = "fx-embers";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1, parts = [], active = false, last = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 10,
        r: 0.8 + Math.random() * 2.2,
        vy: 12 + Math.random() * 30,
        sway: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.7 ? "251,146,60" : "252,211,77",
        life: 0.35 + Math.random() * 0.55
      };
    }
    function frame(t) {
      if (!active) return;
      var dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      ctx.clearRect(0, 0, w, h);
      parts.forEach(function (p, i) {
        p.y -= p.vy * dt;
        p.sway += dt * 1.4;
        var x = p.x + Math.sin(p.sway) * 14;
        var fade = Math.max(0, Math.min(1, p.y / h));
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.hue + "," + (p.life * fade).toFixed(3) + ")";
        ctx.shadowColor = "rgba(" + p.hue + ",0.9)";
        ctx.shadowBlur = 8;
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.y < -10) parts[i] = spawn(false);
      });
      requestAnimationFrame(frame);
    }
    resize();
    var count = Math.round(Math.min(46, w / 28));
    for (var i = 0; i < count; i++) parts.push(spawn(true));
    window.addEventListener("resize", resize);
    whenVisible(hero, function (visible) {
      var was = active;
      active = visible && !document.hidden;
      if (active && !was) { last = 0; requestAnimationFrame(frame); }
    }, { threshold: 0 });
    document.addEventListener("visibilitychange", function () {
      var was = active;
      active = !document.hidden;
      if (active && !was) { last = 0; requestAnimationFrame(frame); }
    });
  }

  // ---------------------------------------------------------------------
  // Chiffres clés qui défilent jusqu'à leur valeur
  // ---------------------------------------------------------------------
  function countUp() {
    if (reduced) return;
    document.querySelectorAll(".about-stats strong").forEach(function (el) {
      var text = el.textContent;
      var m = text.match(/\d+/);
      if (!m) return;
      var target = parseInt(m[0], 10);
      var from = target >= 1000 ? target - 40 : 0;
      el.textContent = text.replace(m[0], String(from));
      whenVisible(el, function (visible, io) {
        if (!visible) return;
        if (io) io.disconnect();
        var start = null, dur = 1500;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = text.replace(m[0], String(Math.round(from + (target - from) * eased)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
    });
  }

  // ---------------------------------------------------------------------
  // Étincelles pixel au clic
  // ---------------------------------------------------------------------
  function clickSparks() {
    if (reduced) return;
    var colors = ["#fb923c", "#fcd34d", "#f97316", "#fff7eb"];
    document.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      if (e.target.closest("input, textarea, select, .arcade-screen")) return;
      for (var i = 0; i < 9; i++) {
        var s = document.createElement("span");
        s.className = "fx-spark";
        var angle = (Math.PI * 2 * i) / 9 + Math.random() * 0.5;
        var dist = 26 + Math.random() * 26;
        s.style.left = e.clientX + "px";
        s.style.top = e.clientY + "px";
        s.style.setProperty("--dx", (Math.cos(angle) * dist).toFixed(1) + "px");
        s.style.setProperty("--dy", (Math.sin(angle) * dist).toFixed(1) + "px");
        s.style.background = colors[i % colors.length];
        document.body.appendChild(s);
        s.addEventListener("animationend", function () { this.remove(); });
      }
    });
  }

  // ---------------------------------------------------------------------
  // Page Compétences : "+1 XP" quand on survole une compétence
  // ---------------------------------------------------------------------
  function skillXp() {
    if (!finePointer || reduced) return;
    document.querySelectorAll(".skill-chip").forEach(function (chip) {
      var lastTime = 0;
      chip.addEventListener("pointerenter", function () {
        var now = Date.now();
        if (now - lastTime < 1200) return;
        lastTime = now;
        var r = chip.getBoundingClientRect();
        var xp = document.createElement("span");
        xp.className = "fx-xp";
        xp.setAttribute("aria-hidden", "true");
        xp.textContent = "+1 XP";
        xp.style.left = (r.left + r.width / 2) + "px";
        xp.style.top = r.top + "px";
        document.body.appendChild(xp);
        xp.addEventListener("animationend", function () { xp.remove(); });
      });
    });
  }

  pageTransitions();
  onReady(function () {
    splitHeroTitle();
    keyboardTyping();
    typedEyebrow();
    heroEmbers();
    countUp();
    cursorGlow();
    tiltCards();
    magneticButtons();
    clickSparks();
    skillXp();
  });
})();
