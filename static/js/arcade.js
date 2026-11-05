(function () {
  "use strict";

  var W = 360, H = 480;
  var HORIZON = 300;
  var PW = 72, PH = 12, PY = H - 46;
  var HI_KEY = "mf-arcade-hiscore";
  var MUTE_KEY = "mf-arcade-muted";
  var FONT = '"Press Start 2P", ui-monospace, monospace';
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SKILLS = [
    { label: "JS", bg: "#facc15", fg: "#1c1008" },
    { label: "PY", bg: "#3b82f6", fg: "#ffffff" },
    { label: "JAVA", bg: "#f97316", fg: "#1c1008" },
    { label: "SQL", bg: "#14b8a6", fg: "#04201c" },
    { label: "CSS", bg: "#6366f1", fg: "#ffffff" },
    { label: "HTML", bg: "#ef6c3a", fg: "#ffffff" },
    { label: "GIT", bg: "#f05033", fg: "#ffffff" },
    { label: "PHP", bg: "#8b93d6", fg: "#141633" },
    { label: "</>", bg: "#fcd34d", fg: "#1c1008" }
  ];

  var BUG = [
    "..X.....X..",
    "...X...X...",
    "..XXXXXXX..",
    ".XX.XXX.XX.",
    "XXXXXXXXXXX",
    "X.XXXXXXX.X",
    "X.X.....X.X",
    "...XX.XX..."
  ];
  var BUG_ALT = "..X.....X..";
  var HEART = [
    ".XX.XX.",
    "XXXXXXX",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    "...X..."
  ];

  function storage(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
    return null;
  }

  function readHi() { return parseInt(storage(HI_KEY), 10) || 0; }
  function pad(n) { return ("000000" + n).slice(-6); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function refreshHiDisplays() {
    var hi = pad(readHi());
    document.querySelectorAll("[data-arcade-hiscore]").forEach(function (el) { el.textContent = hi; });
  }

  // ---------------------------------------------------------------------
  // Sons 8 bits générés à la volée
  // ---------------------------------------------------------------------
  var audio = null;
  var muted = storage(MUTE_KEY) === "1";

  function beep(freq, dur, type, vol, slideTo, delay) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = audio.currentTime + (delay || 0);
      var o = audio.createOscillator();
      var gain = audio.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(vol || 0.05, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gain);
      gain.connect(audio.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) { /* audio indisponible : on joue sans son */ }
  }

  var sfx = {
    coin: function () { beep(988, 0.08, "square", 0.05); beep(1319, 0.3, "square", 0.05, null, 0.08); },
    pick: function () { beep(880, 0.07, "square", 0.04, 1500); },
    hurt: function () { beep(200, 0.3, "sawtooth", 0.06, 50); },
    heart: function () { beep(660, 0.08, "triangle", 0.07); beep(990, 0.14, "triangle", 0.07, null, 0.08); },
    level: function () { [523, 659, 784, 1047].forEach(function (f, i) { beep(f, 0.12, "square", 0.045, null, i * 0.09); }); },
    over: function () { [523, 415, 330, 196].forEach(function (f, i) { beep(f, 0.22, "triangle", 0.07, null, i * 0.18); }); }
  };

  // ---------------------------------------------------------------------
  // État du jeu
  // ---------------------------------------------------------------------
  var g = {
    state: "title",
    score: 0, lives: 3, level: 1, caught: 0, combo: 0,
    items: [], parts: [], texts: [], stars: [],
    spawnT: 0, t: 0, shake: 0, flash: 0, banner: null,
    px: W / 2, keys: { left: false, right: false }, pointerX: null,
    konami: false
  };

  for (var s = 0; s < 46; s++) {
    g.stars.push({ x: rand(0, W), y: rand(28, HORIZON - 40), s: Math.random() < 0.2 ? 2 : 1, tw: rand(1, 3), ph: rand(0, 6) });
  }

  var root, canvas, ctx, scanPattern, lastFocus, raf = 0, lastTs = 0, scale = 1;

  function contactUrl() {
    return (document.body && document.body.getAttribute("data-contact")) || "/contact/";
  }

  function build() {
    root = document.createElement("div");
    root.className = "arcade";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "arcade-title");
    root.innerHTML =
      '<div class="arcade-backdrop" data-arcade-close></div>' +
      '<div class="arcade-cabinet">' +
        '<div class="arcade-marquee">' +
          '<span class="arcade-marquee-text" id="arcade-title">MATTY ARCADE</span>' +
          '<div class="arcade-tools">' +
            '<button type="button" class="arcade-tool" data-arcade-sound></button>' +
            '<button type="button" class="arcade-tool" data-arcade-close aria-label="Fermer le mini-jeu">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="arcade-screen">' +
          '<canvas class="arcade-canvas" tabindex="0" aria-label="Zone de jeu : déplace la barre pour attraper les compétences et éviter les bugs"></canvas>' +
          '<div class="arcade-overlay" data-screen="title">' +
            '<p class="arcade-blink">INSERT COIN</p>' +
            '<h2 class="arcade-h">POWER-UPS<br>HUNTER</h2>' +
            '<p class="arcade-konami" data-arcade-konami hidden>KONAMI CODE ! 5 VIES</p>' +
            '<ul class="arcade-legend">' +
              '<li><span class="arcade-chip">JS</span> Compétence : des points</li>' +
              '<li><span class="arcade-chip arcade-chip--bug">BUG</span> À éviter : -1 vie</li>' +
              '<li><span class="arcade-chip arcade-chip--heart">♥</span> Bonus : +1 vie</li>' +
            '</ul>' +
            '<p class="arcade-small">RECORD <span data-arcade-hiscore>000000</span></p>' +
            '<button type="button" class="arcade-cta" data-arcade-start>▶ START</button>' +
          '</div>' +
          '<div class="arcade-overlay" data-screen="pause" hidden>' +
            '<p class="arcade-h">PAUSE</p>' +
            '<button type="button" class="arcade-cta" data-arcade-resume>▶ Reprendre</button>' +
          '</div>' +
          '<div class="arcade-overlay" data-screen="over" hidden>' +
            '<p class="arcade-h arcade-h--red">GAME OVER</p>' +
            '<p class="arcade-score">SCORE <strong data-arcade-final>000000</strong></p>' +
            '<p class="arcade-newhi" data-arcade-newhi hidden>NEW HI-SCORE !</p>' +
            '<p class="arcade-msg" data-arcade-msg></p>' +
            '<div class="arcade-actions">' +
              '<button type="button" class="arcade-cta" data-arcade-start>↻ Rejouer</button>' +
              '<a class="arcade-cta arcade-cta--alt" data-arcade-contact>Me contacter</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="arcade-pad">' +
          '<button type="button" class="arcade-pad-btn" data-dir="left" aria-label="Aller à gauche">◀</button>' +
          '<button type="button" class="arcade-pad-btn arcade-pad-btn--mid" data-arcade-toggle>START</button>' +
          '<button type="button" class="arcade-pad-btn" data-dir="right" aria-label="Aller à droite">▶</button>' +
        '</div>' +
        '<p class="arcade-help">← → ou Q / D pour bouger · Espace : start / pause · Échap : quitter</p>' +
      '</div>';
    document.body.appendChild(root);

    canvas = root.querySelector(".arcade-canvas");
    ctx = canvas.getContext("2d");
    root.querySelector("[data-arcade-contact]").setAttribute("href", contactUrl());

    var lines = document.createElement("canvas");
    lines.width = 1; lines.height = 3;
    var lctx = lines.getContext("2d");
    lctx.fillStyle = "rgba(0,0,0,0.28)";
    lctx.fillRect(0, 2, 1, 1);
    scanPattern = ctx.createPattern(lines, "repeat");

    updateSoundButton();

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-arcade-close]")) { close(); return; }
      if (e.target.closest("[data-arcade-start]")) { start(); return; }
      if (e.target.closest("[data-arcade-resume]")) { resume(); return; }
      if (e.target.closest("[data-arcade-toggle]")) { toggle(); return; }
      if (e.target.closest("[data-arcade-sound]")) {
        muted = !muted;
        storage(MUTE_KEY, muted ? "1" : "0");
        updateSoundButton();
      }
    });

    root.querySelectorAll("[data-dir]").forEach(function (btn) {
      var dir = btn.getAttribute("data-dir");
      function down(e) { e.preventDefault(); g.keys[dir] = true; g.pointerX = null; }
      function up() { g.keys[dir] = false; }
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("pointercancel", up);
    });

    function toLogical(e) {
      var r = canvas.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * W;
    }
    canvas.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse" || e.buttons) g.pointerX = toLogical(e);
    });
    canvas.addEventListener("pointerdown", function (e) {
      g.pointerX = toLogical(e);
      if (g.state !== "playing" && g.state !== "paused") return;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointerup", function (e) {
      if (e.pointerType !== "mouse") g.pointerX = null;
    });
    canvas.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse") g.pointerX = null;
    });

    if ("ResizeObserver" in window) new ResizeObserver(sizeCanvas).observe(canvas);
    window.addEventListener("resize", sizeCanvas);
  }

  function updateSoundButton() {
    var b = root.querySelector("[data-arcade-sound]");
    b.textContent = muted ? "🔇" : "🔊";
    b.setAttribute("aria-label", muted ? "Activer le son" : "Couper le son");
    b.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  function sizeCanvas() {
    if (!canvas || !canvas.clientWidth) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    scale = canvas.width / W;
  }

  function showScreen(name) {
    root.querySelectorAll("[data-screen]").forEach(function (el) {
      el.hidden = el.getAttribute("data-screen") !== name;
    });
    var toggleBtn = root.querySelector("[data-arcade-toggle]");
    toggleBtn.textContent = name === null ? "PAUSE" : name === "pause" ? "REPRISE" : "START";
  }

  // ---------------------------------------------------------------------
  // Ouverture / fermeture
  // ---------------------------------------------------------------------
  function open(opts) {
    if (!root) build();
    if (!root.hidden) return;
    lastFocus = document.activeElement;
    g.konami = !!(opts && opts.konami);
    root.querySelector("[data-arcade-konami]").hidden = !g.konami;
    root.hidden = false;
    document.documentElement.classList.add("arcade-open");
    requestAnimationFrame(function () { root.classList.add("is-open"); });
    resetGame();
    g.state = "title";
    showScreen("title");
    refreshHiDisplays();
    sizeCanvas();
    if (document.fonts && document.fonts.load) document.fonts.load('10px "Press Start 2P"');
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);
    lastTs = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    setTimeout(function () {
      var btn = root.querySelector('[data-screen="title"] [data-arcade-start]');
      if (btn) btn.focus();
    }, 60);
  }

  function close() {
    if (!root || root.hidden) return;
    root.classList.remove("is-open");
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("visibilitychange", onVisibility);
    g.keys.left = g.keys.right = false;
    setTimeout(function () {
      root.hidden = true;
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("arcade-open");
      g.state = "title";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 260);
  }

  function resetGame() {
    g.score = 0;
    g.lives = g.konami ? 5 : 3;
    g.level = 1;
    g.caught = 0;
    g.combo = 0;
    g.items = [];
    g.parts = [];
    g.texts = [];
    g.spawnT = 0.6;
    g.shake = 0;
    g.flash = 0;
    g.banner = null;
    g.px = W / 2;
    g.pointerX = null;
  }

  function start() {
    resetGame();
    g.state = "playing";
    g.spawnT = 1.3;
    g.banner = { text: "PLAYER 1 READY", t: 1.4 };
    showScreen(null);
    sfx.coin();
    canvas.focus();
  }

  function pause() {
    if (g.state !== "playing") return;
    g.state = "paused";
    g.keys.left = g.keys.right = false;
    showScreen("pause");
    var b = root.querySelector("[data-arcade-resume]");
    if (b) b.focus();
  }

  function resume() {
    if (g.state !== "paused") return;
    g.state = "playing";
    showScreen(null);
    canvas.focus();
  }

  function toggle() {
    if (g.state === "playing") pause();
    else if (g.state === "paused") resume();
    else start();
  }

  function gameOver() {
    g.state = "over";
    g.keys.left = g.keys.right = false;
    var hi = readHi();
    var isNew = g.score > hi;
    if (isNew) storage(HI_KEY, String(g.score));
    refreshHiDisplays();
    root.querySelector("[data-arcade-final]").textContent = pad(g.score);
    root.querySelector("[data-arcade-newhi]").hidden = !isNew;
    var msg;
    if (g.score < 150) msg = "Échauffement terminé. Le prochain essai sera le bon !";
    else if (g.score < 400) msg = "Beau score ! Tu as l'œil d'un développeur.";
    else if (g.score < 800) msg = "Impressionnant ! Il ne manque plus qu'une alternance…";
    else msg = "Score de légende. On travaille ensemble ?";
    root.querySelector("[data-arcade-msg]").textContent = msg;
    showScreen("over");
    sfx.over();
    setTimeout(function () {
      var b = root.querySelector('[data-screen="over"] [data-arcade-start]');
      if (b) b.focus();
    }, 50);
  }

  function onVisibility() {
    if (document.hidden) pause();
  }

  // ---------------------------------------------------------------------
  // Clavier
  // ---------------------------------------------------------------------
  function isLeft(k) { return k === "ArrowLeft" || k === "q" || k === "Q" || k === "a" || k === "A"; }
  function isRight(k) { return k === "ArrowRight" || k === "d" || k === "D"; }

  function onKey(e) {
    var k = e.key;
    if (k === "Escape") { e.preventDefault(); close(); return; }
    if (k === "Tab") { trapFocus(e); return; }
    var onControl = e.target.closest && e.target.closest("button, a");
    if ((k === " " || k === "Enter") && onControl) return;
    if (isLeft(k)) { g.keys.left = true; g.pointerX = null; e.preventDefault(); }
    else if (isRight(k)) { g.keys.right = true; g.pointerX = null; e.preventDefault(); }
    else if (k === " " || k === "Enter") { e.preventDefault(); toggle(); }
    else if (k === "p" || k === "P") { if (g.state === "playing") pause(); else resume(); }
    else if (k === "ArrowUp" || k === "ArrowDown") e.preventDefault();
  }

  function onKeyUp(e) {
    if (isLeft(e.key)) g.keys.left = false;
    if (isRight(e.key)) g.keys.right = false;
  }

  function trapFocus(e) {
    var list = Array.prototype.filter.call(
      root.querySelectorAll("button, a[href], canvas"),
      function (el) { return el.offsetParent !== null; }
    );
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // ---------------------------------------------------------------------
  // Logique
  // ---------------------------------------------------------------------
  function spawnItem(demo) {
    var r = Math.random();
    var bugChance = Math.min(0.4, 0.1 + g.level * 0.04);
    var kind;
    if (!demo && g.lives < 5 && r < 0.035) kind = "heart";
    else if (r < 0.035 + bugChance) kind = "bug";
    else kind = "skill";
    var size = kind === "bug" ? 33 : kind === "heart" ? 28 : 32;
    g.items.push({
      kind: kind,
      skill: SKILLS[Math.floor(Math.random() * SKILLS.length)],
      x: rand(size / 2 + 6, W - size / 2 - 6),
      y: -size,
      size: size,
      vy: demo ? rand(60, 95) : 105 + g.level * 17 + rand(0, 45),
      wob: rand(0, 6.28)
    });
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = rand(0, Math.PI * 2), sp = rand(60, 190);
      g.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: rand(0.4, 0.8), max: 0.8, color: color, size: Math.random() < 0.5 ? 3 : 2 });
    }
  }

  function floatText(x, y, text, color) {
    g.texts.push({ x: x, y: y, text: text, color: color, life: 1 });
  }

  function catchItem(it) {
    if (it.kind === "skill") {
      g.combo++;
      var mult = Math.min(5, 1 + Math.floor(g.combo / 4));
      var pts = 10 * mult;
      g.score += pts;
      g.caught++;
      burst(it.x, it.y, it.skill.bg, 12);
      floatText(it.x, it.y - 10, "+" + pts, "#fcd34d");
      if (mult > 1 && g.combo % 4 === 0) floatText(W / 2, PY - 40, "COMBO x" + mult, "#fb923c");
      sfx.pick();
      if (g.caught % 12 === 0) {
        g.level++;
        g.banner = { text: "LEVEL " + g.level, t: 1.5 };
        sfx.level();
      }
    } else if (it.kind === "bug") {
      g.lives--;
      g.combo = 0;
      g.shake = reduced ? 0 : 10;
      g.flash = 1;
      burst(it.x, it.y, "#ef4444", 18);
      floatText(it.x, it.y - 10, "-1 ♥", "#f87171");
      sfx.hurt();
      if (g.lives <= 0) gameOver();
    } else {
      g.lives = Math.min(5, g.lives + 1);
      burst(it.x, it.y, "#f472b6", 14);
      floatText(it.x, it.y - 10, "+1 ♥", "#f9a8d4");
      sfx.heart();
    }
  }

  function update(dt) {
    g.t += dt;
    var i, it;

    if (g.state === "playing") {
      var speed = 320;
      if (g.pointerX !== null) {
        var diff = g.pointerX - g.px;
        g.px += Math.sign(diff) * Math.min(Math.abs(diff), speed * 1.9 * dt);
      } else {
        g.px += ((g.keys.right ? 1 : 0) - (g.keys.left ? 1 : 0)) * speed * dt;
      }
      g.px = clamp(g.px, PW / 2 + 4, W - PW / 2 - 4);

      g.spawnT -= dt;
      if (g.spawnT <= 0) {
        spawnItem(false);
        g.spawnT = Math.max(0.32, 0.95 - g.level * 0.07) * rand(0.7, 1.3);
      }

      for (i = g.items.length - 1; i >= 0; i--) {
        it = g.items[i];
        it.y += it.vy * dt;
        var half = it.size / 2;
        if (it.y + half >= PY && it.y - half <= PY + PH &&
            it.x + half >= g.px - PW / 2 && it.x - half <= g.px + PW / 2) {
          g.items.splice(i, 1);
          catchItem(it);
          if (g.state !== "playing") break;
          continue;
        }
        if (it.y - half > H) {
          if (it.kind === "skill") g.combo = 0;
          g.items.splice(i, 1);
        }
      }
    } else if (g.state === "title") {
      g.spawnT -= dt;
      if (g.spawnT <= 0) { spawnItem(true); g.spawnT = rand(0.7, 1.2); }
      var target = W / 2 + Math.sin(g.t * 0.9) * 110;
      g.px += (target - g.px) * Math.min(1, dt * 3);
      for (i = g.items.length - 1; i >= 0; i--) {
        it = g.items[i];
        it.y += it.vy * dt;
        if (it.y - it.size > H) g.items.splice(i, 1);
      }
    }

    for (i = g.parts.length - 1; i >= 0; i--) {
      var p = g.parts[i];
      p.life -= dt;
      p.vy += 300 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) g.parts.splice(i, 1);
    }
    for (i = g.texts.length - 1; i >= 0; i--) {
      var tx = g.texts[i];
      tx.life -= dt * 0.9;
      tx.y -= 34 * dt;
      if (tx.life <= 0) g.texts.splice(i, 1);
    }
    if (g.banner) {
      g.banner.t -= dt;
      if (g.banner.t <= 0) g.banner = null;
    }
    g.shake = Math.max(0, g.shake - dt * 30);
    g.flash = Math.max(0, g.flash - dt * 2.5);
  }

  // ---------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------
  function sprite(rows, x, y, px, color) {
    ctx.fillStyle = color;
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        if (rows[r].charAt(c) === "X") ctx.fillRect(x + c * px, y + r * px, px, px);
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    var sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
    sky.addColorStop(0, "#0d0603");
    sky.addColorStop(1, "#2b1307");
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, W + 40, HORIZON + 20);

    for (var i = 0; i < g.stars.length; i++) {
      var st = g.stars[i];
      ctx.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(g.t * st.tw + st.ph));
      ctx.fillStyle = "#fff7eb";
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    var sun = ctx.createLinearGradient(0, HORIZON - 80, 0, HORIZON);
    sun.addColorStop(0, "#fcd34d");
    sun.addColorStop(0.55, "#fb923c");
    sun.addColorStop(1, "#db2777");
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, HORIZON, 72, Math.PI, 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = sun;
    ctx.fillRect(W / 2 - 80, HORIZON - 80, 160, 80);
    ctx.fillStyle = "#2b1307";
    for (var b = 0; b < 5; b++) {
      var by = HORIZON - 34 + b * 7;
      ctx.fillRect(W / 2 - 80, by, 160, 1.5 + b * 0.9);
    }
    ctx.restore();

    var floor = ctx.createLinearGradient(0, HORIZON, 0, H);
    floor.addColorStop(0, "#1a0b04");
    floor.addColorStop(1, "#331606");
    ctx.fillStyle = floor;
    ctx.fillRect(-20, HORIZON, W + 40, H - HORIZON + 20);

    ctx.strokeStyle = "rgba(251,146,60,0.45)";
    ctx.lineWidth = 1;
    var off = (g.t * 0.55) % 1;
    for (var k = 0; k < 12; k++) {
      var p = (k + off) / 12;
      var y = HORIZON + (H - HORIZON) * p * p;
      ctx.globalAlpha = 0.25 + p * 0.75;
      ctx.beginPath();
      ctx.moveTo(-20, y);
      ctx.lineTo(W + 20, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.6;
    for (var j = -9; j <= 9; j++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + j * 8, HORIZON);
      ctx.lineTo(W / 2 + j * 64, H + 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(251,146,60,0.9)";
    ctx.fillRect(-20, HORIZON - 1, W + 40, 2);
  }

  function drawItem(it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    if (it.kind === "skill") {
      ctx.rotate(Math.sin(it.wob + g.t * 3) * 0.12);
      ctx.shadowColor = it.skill.bg;
      ctx.shadowBlur = 12;
      roundRect(-16, -16, 32, 32, 6);
      ctx.fillStyle = it.skill.bg;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = it.skill.fg;
      ctx.font = (it.skill.label.length > 3 ? 6 : 8) + "px " + FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.skill.label, 0, 1);
    } else if (it.kind === "bug") {
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 14;
      var rows = BUG.slice();
      if (Math.floor(g.t * 6 + it.wob) % 2) rows[7] = BUG_ALT;
      sprite(rows, -16.5, -12, 3, "#ef4444");
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1c1008";
      ctx.fillRect(-16.5 + 4 * 3, -12 + 3 * 3, 3, 3);
      ctx.fillRect(-16.5 + 8 * 3, -12 + 3 * 3, 3, 3);
    } else {
      var pulse = 1 + Math.sin(g.t * 8) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#f472b6";
      ctx.shadowBlur = 14;
      sprite(HEART, -14, -12, 4, "#f472b6");
    }
    ctx.restore();
  }

  function drawPlayer() {
    var x = g.px - PW / 2;
    ctx.save();
    ctx.shadowColor = "#fb923c";
    ctx.shadowBlur = 16;
    var grad = ctx.createLinearGradient(x, 0, x + PW, 0);
    grad.addColorStop(0, "#f97316");
    grad.addColorStop(1, "#fcd34d");
    roundRect(x, PY, PW, PH, 4);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#1c1008";
    ctx.font = "7px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("</>", g.px, PY + PH / 2 + 1);
    ctx.fillStyle = "rgba(252,211,77," + (0.4 + Math.random() * 0.4).toFixed(2) + ")";
    ctx.fillRect(x + 8, PY + PH, 6, 3 + Math.random() * 3);
    ctx.fillRect(x + PW - 14, PY + PH, 6, 3 + Math.random() * 3);
    ctx.restore();
  }

  function drawHud() {
    ctx.fillStyle = "rgba(13,6,3,0.82)";
    ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = "rgba(251,146,60,0.5)";
    ctx.fillRect(0, 26, W, 1);
    ctx.font = "8px " + FONT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#fb923c";
    ctx.fillText("1UP", 8, 9);
    ctx.fillStyle = "#fff7eb";
    ctx.fillText(pad(g.score), 8, 19);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fb923c";
    ctx.fillText("HI-SCORE", W / 2, 9);
    ctx.fillStyle = "#fff7eb";
    ctx.fillText(pad(Math.max(readHi(), g.score)), W / 2, 19);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fb923c";
    ctx.fillText("LV " + g.level, W - 8, 9);
    for (var i = 0; i < g.lives; i++) sprite(HEART, W - 16 - i * 13, 15, 1.5, "#f472b6");
  }

  function render() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.save();
    if (g.shake > 0) ctx.translate(rand(-g.shake, g.shake), rand(-g.shake, g.shake));
    drawBackground();
    for (var i = 0; i < g.items.length; i++) drawItem(g.items[i]);
    if (g.state !== "over") drawPlayer();

    for (i = 0; i < g.parts.length; i++) {
      var p = g.parts[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "9px " + FONT;
    for (i = 0; i < g.texts.length; i++) {
      var t = g.texts[i];
      ctx.globalAlpha = clamp(t.life, 0, 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    if (g.banner) {
      var a = clamp(g.banner.t * 2, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = "14px " + FONT;
      ctx.fillStyle = "#1c1008";
      ctx.fillText(g.banner.text, W / 2 + 2, H * 0.4 + 2);
      ctx.fillStyle = Math.floor(g.t * 8) % 2 ? "#fcd34d" : "#fb923c";
      ctx.fillText(g.banner.text, W / 2, H * 0.4);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (g.state !== "title") drawHud();

    if (g.flash > 0) {
      ctx.fillStyle = "rgba(239,68,68," + (g.flash * 0.35).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = scanPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
    lastTs = ts;
    if (g.state !== "paused") update(dt);
    if (canvas.width) render();
  }

  // ---------------------------------------------------------------------
  // Points d'entrée : bouton flottant, boutons [data-arcade-open], Konami
  // ---------------------------------------------------------------------
  var fab = document.createElement("button");
  fab.type = "button";
  fab.className = "arcade-fab";
  fab.setAttribute("data-arcade-open", "");
  fab.setAttribute("aria-label", "Lancer le mini-jeu");
  fab.innerHTML = '<span class="arcade-fab-icon" aria-hidden="true">🕹️</span><span class="arcade-fab-text" aria-hidden="true">JOUER</span>';
  document.body.appendChild(fab);

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest && e.target.closest("[data-arcade-open]");
    if (!trigger) return;
    e.preventDefault();
    open();
  });

  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var buffer = [];
  document.addEventListener("keydown", function (e) {
    if (root && !root.hidden) return;
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    buffer.push(key);
    if (buffer.length > KONAMI.length) buffer.shift();
    if (buffer.join(",") === KONAMI.join(",")) {
      buffer = [];
      open({ konami: true });
    }
  });

  refreshHiDisplays();
})();
