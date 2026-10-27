/* ==========================================================================
   script.js — Neon Diwali Wish Card + Memory Game
   ========================================================================== */

(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isMobile = () => window.innerWidth <= 768;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = () => reducedMotionQuery.matches;
  const isLiteMode = () => document.body.classList.contains("lite-mode");

  /* ---------------- URL params ---------------- */
  const params = new URLSearchParams(window.location.search);

  function cleanName(v, fb = "") {
    if (v === null || v === undefined) return fb;
    const c = String(v)
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
    return c || fb;
  }

  const toName = cleanName(params.get("to"), "My Dear Friend");
  const fromName = cleanName(params.get("from"), "With Love");

  $("#toName").textContent = toName;
  $("#fromName").textContent = fromName;

  const toInput = $("#toInput");
  const fromInput = $("#fromInput");
  toInput.value = params.has("to") ? cleanName(params.get("to"), "") : "";
  fromInput.value = params.has("from") ? cleanName(params.get("from"), "") : "";

  /* ---------------- Sound ---------------- */
  const soundToggle = $("#soundToggle");
  const soundIcon = soundToggle.querySelector(".sound-toggle__icon");

  const Sound = (() => {
    let ctx = null, master = null, enabled = false;

    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.42;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }

    function updateButton() {
      soundToggle.setAttribute("aria-pressed", String(enabled));
      soundToggle.setAttribute("aria-label", enabled ? "Disable sound" : "Enable sound");
      soundIcon.textContent = enabled ? "🔊" : "🔇";
    }

    function setEnabled(v) { enabled = !!v; if (enabled) ensure(); updateButton(); }

    function chime() {
      if (!enabled) return;
      const a = ensure(); if (!a) return;
      const now = a.currentTime;
      [880, 1174.66, 1567.98].forEach((f, i) => {
        const osc = a.createOscillator(), g = a.createGain();
        osc.type = "sine"; osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.12 / (i + 1), now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        osc.connect(g).connect(master);
        osc.start(now); osc.stop(now + 1.2);
      });
    }

    function pop() {
      if (!enabled) return;
      const a = ensure(); if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator(), g = a.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(rand(180, 260), now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(g).connect(master);
      osc.start(now); osc.stop(now + 0.24);
    }

    return { ensure, setEnabled, isEnabled: () => enabled, chime, pop };
  })();

  Sound.setEnabled(false);
  soundToggle.addEventListener("click", () => {
    const next = !Sound.isEnabled();
    Sound.setEnabled(next);
    if (next) { Sound.ensure(); Sound.chime(); }
  });

  /* ---------------- Wishes + typewriter ---------------- */
  const wishes = [
    "May your Diwali be filled with light, love and endless laughter. 🪔",
    "दीयों की रोशनी से आपका जीवन हमेशा उज्ज्वल रहे। शुभ दीपावली! ✨",
    "Iss Diwali, dher saari khushiyan aur meethi mithai! 🍬",
    "May the glow of diyas bring peace to your heart and success to your path. 🌟",
    "आपके जीवन में धन, यश और सुख-समृद्धि की बरसात हो। शुभ दीपावली! 🪔",
    "A little light, a little love — wishing you a Diwali full of both. ❤️",
    "Roshni ka tyohar, khushiyon ki bahar — Happy Diwali yaar! 🎆",
    "May Goddess Lakshmi bless you with abundance and joy this Diwali. 🌸",
    "दिल से दुआ है कि आपकी हर मुराद पूरी हो। शुभ दीपावली! 🙏",
    "Let your worries fade like darkness before diyas. Shubh Deepavali! ✨"
  ];

  const wishTextEl = $("#wishText");
  const wishLive = $("#wishLive");
  let currentWishIndex = -1, typeToken = 0;

  function typeWish(text, { instant = false } = {}) {
    typeToken += 1;
    const token = typeToken;
    const chars = Array.from(text);
    wishTextEl.textContent = "";
    wishLive.textContent = text;
    if (instant || isReduced()) { wishTextEl.textContent = text; return; }
    let i = 0;
    const step = () => {
      if (token !== typeToken) return;
      wishTextEl.textContent += chars[i] || "";
      i += 1;
      if (i < chars.length) window.setTimeout(step, 26 + Math.random() * 34);
    };
    step();
  }

  function showRandomWish() {
    let next = Math.floor(Math.random() * wishes.length);
    while (wishes.length > 1 && next === currentWishIndex) {
      next = Math.floor(Math.random() * wishes.length);
    }
    currentWishIndex = next;
    wishTextEl.classList.remove("is-swapping");
    void wishTextEl.offsetWidth;
    wishTextEl.classList.add("is-swapping");
    window.setTimeout(() => wishTextEl.classList.remove("is-swapping"), 480);
    typeWish(wishes[currentWishIndex]);
  }

  $("#newWish").addEventListener("click", () => { showRandomWish(); Sound.pop(); });

  /* ---------------- Stars + floaters ---------------- */
  function createStars() {
    const layer = $("#stars"); if (!layer) return;
    const frag = document.createDocumentFragment();
    const count = isReduced() ? 25 : isMobile() ? 35 : 90;
    for (let i = 0; i < count; i += 1) {
      const s = document.createElement("span");
      s.className = "star";
      s.style.left = `${rand(0, 100)}%`;
      s.style.top = `${rand(0, 100)}%`;
      const size = rand(1, 2.6);
      s.style.width = `${size}px`; s.style.height = `${size}px`;
      s.style.animationDuration = `${rand(2.5, 6).toFixed(2)}s`;
      s.style.animationDelay = `${(-Math.random() * 6).toFixed(2)}s`;
      frag.appendChild(s);
    }
    layer.appendChild(frag);
  }

  function createFloaters() {
    const layer = $("#floaters"); if (!layer || isReduced()) return;
    const types = ["lantern", "petal", "spark"];
    const count = isMobile() ? 6 : 16;
    for (let i = 0; i < count; i += 1) {
      const el = document.createElement("span");
      el.className = `floater floater--${pick(types)}`;
      el.style.left = `${rand(2, 98)}vw`;
      el.style.animationDuration = `${rand(16, 34).toFixed(1)}s`;
      el.style.animationDelay = `${(-Math.random() * 34).toFixed(1)}s`;
      el.style.setProperty("--drift", `${rand(-70, 70).toFixed(1)}px`);
      el.style.setProperty("--scale", rand(0.7, 1.3).toFixed(2));
      layer.appendChild(el);
    }
  }

  createStars();
  createFloaters();

  /* ---------------- Fireworks ---------------- */
  const Fireworks = (() => {
    const canvas = $("#fireworks");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { start() {}, stop() {}, burst() {}, celebrate() {}, resize() {} };

    const COLORS = ["#ffb300", "#ff2e93", "#8a2be2", "#00e5ff", "#fff6c9", "#ff7a00", "#ff4d00"];
    let dpr = 1, W = 0, H = 0;
    let particles = [], running = false, rafId = 0, nextAutoAt = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.25 : 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
    }

    function burst(x, y, count) {
      if (isReduced()) return;
      if (!W || !H) resize();
      const n = count ?? (isMobile() ? 42 : 72);
      const base = pick(COLORS);
      for (let i = 0; i < n; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1.5, 7.5);
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: rand(0.008, 0.018),
          size: rand(1.2, 3.4),
          color: Math.random() < 0.7 ? base : pick(COLORS),
          gravity: rand(0.025, 0.055)
        });
      }
      const cap = isMobile() ? 800 : 1400;
      if (particles.length > cap) particles.splice(0, particles.length - cap);
    }

    function frame(now) {
      if (!running) return;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.vy += p.gravity; p.vx *= 0.992; p.vy *= 0.992;
        p.x += p.vx; p.y += p.vy;
        p.life -= p.decay; p.size *= 0.996;
        if (p.life <= 0 || p.size < 0.3) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (now > nextAutoAt) {
        burst(rand(W * 0.15, W * 0.85), rand(H * 0.12, H * 0.55));
        nextAutoAt = now + (isMobile() ? rand(2200, 3600) : rand(1000, 2000));
      }
      rafId = window.requestAnimationFrame(frame);
    }

    function start() { if (isReduced() || running) return; resize(); running = true; nextAutoAt = performance.now() + rand(700, 1500); rafId = requestAnimationFrame(frame); }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }
    function celebrate() {
      if (isReduced()) return;
      if (!running) start();
      const total = isMobile() ? 10 : 16;
      for (let i = 0; i < total; i += 1) {
        window.setTimeout(() => burst(rand(W * 0.1, W * 0.9), rand(H * 0.08, H * 0.65)), i * 110);
      }
    }

    resize();
    return { start, stop, burst, celebrate, resize };
  })();

  window.addEventListener("resize", Fireworks.resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) Fireworks.stop();
    else if (introDone) Fireworks.start();
  });

  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", () => {
      if (isReduced()) Fireworks.stop();
      else if (introDone) Fireworks.start();
    });
  }

  $("#celebrate").addEventListener("click", () => {
    if (isReduced()) { showToast("Fireworks are off because reduced motion is enabled."); return; }
    Fireworks.celebrate();
    Sound.pop();
  });

  /* ---------------- Toast ---------------- */
  const toast = $("#toast");
  let toastTimer = 0;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  /* ---------------- DIYA ROW ---------------- */
  const diyaRow = $("#diyaRow");
  const diyaMsg = $("#diyaMsg");
  const diyas = [];
  let surpriseActive = false;

  const diyaSVG = `
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <ellipse class="diya__glow" cx="60" cy="88" rx="52" ry="24" fill="url(#gGlow)"></ellipse>
      <g class="diya__flame">
        <path d="M60 32c10 16 14 25 0 39-14-14-10-23 0-39z" fill="url(#gFlame)"></path>
        <path d="M60 47c5.5 8.5 6.5 14 0 20-6.5-6-5.5-11.5 0-20z" fill="#fff8d6"></path>
      </g>
      <path d="M60 68v6" stroke="#2a1200" stroke-width="3.5" stroke-linecap="round"></path>
      <path d="M22 76q38 34 76 0z" fill="url(#gBowl)"></path>
      <ellipse cx="60" cy="76" rx="38" ry="7" fill="#7a3600"></ellipse>
      <ellipse cx="60" cy="75.4" rx="28" ry="4.2" fill="#a85000" opacity=".85"></ellipse>
    </svg>
  `;

  function triggerSparkleRain() {
    if (isReduced() || isLiteMode()) return;
    const layer = $("#sparkleLayer"); if (!layer) return;
    const count = isMobile() ? 30 : 60;
    for (let i = 0; i < count; i += 1) {
      const sp = document.createElement("span");
      sp.className = "sparkle-piece";
      sp.style.left = `${rand(0, 100)}vw`;
      sp.style.animationDelay = `${rand(0, 0.8).toFixed(2)}s`;
      sp.style.animationDuration = `${rand(2, 4).toFixed(2)}s`;
      sp.style.setProperty("--drift", `${rand(-40, 40).toFixed(1)}px`);
      layer.appendChild(sp);
      setTimeout(() => sp.remove(), 4800);
    }
  }

  function updateDiyaMessage() {
    const lit = diyas.filter((d) => d.classList.contains("is-lit")).length;
    if (lit === 5) {
      if (!surpriseActive) {
        surpriseActive = true;
        triggerSparkleRain();
        diyaMsg.textContent = "Your Diwali is now fully lit! 🪔";
        showToast("All diyas lit! Your Diwali is fully lit 🪔");
        Sound.chime();
        setTimeout(() => Sound.chime(), 260);
      }
      return;
    }
    surpriseActive = false;
    diyaMsg.textContent = lit === 0 ? "Tap a diya to light it." : `${lit} of 5 diyas lit. Keep going! ✨`;
  }

  for (let i = 0; i < 5; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "diya";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", `Diya ${i + 1} — unlit. Tap to light.`);
    btn.innerHTML = diyaSVG;
    btn.addEventListener("click", () => {
      const lit = btn.classList.toggle("is-lit");
      btn.setAttribute("aria-pressed", String(lit));
      btn.setAttribute("aria-label", `Diya ${i + 1} — ${lit ? "lit" : "unlit"}. Tap to ${lit ? "extinguish" : "light"}.`);
      if (lit) Sound.chime(); else Sound.pop();
      updateDiyaMessage();
    });
    diyaRow.appendChild(btn);
    diyas.push(btn);
  }
  diyaMsg.textContent = "Tap a diya to light it.";

  /* ---------------- SHARE ---------------- */
  const linkPreview = $("#linkPreview");

  function buildLink() {
    const base = window.location.href.split("?")[0].split("#")[0];
    const url = new URL(base);
    const to = cleanName(toInput.value, "");
    const from = cleanName(fromInput.value, "");
    if (to) url.searchParams.set("to", to); else url.searchParams.delete("to");
    if (from) url.searchParams.set("from", from); else url.searchParams.delete("from");
    return url.toString();
  }

  function updatePreview() { linkPreview.textContent = buildLink(); }
  toInput.addEventListener("input", updatePreview);
  fromInput.addEventListener("input", updatePreview);
  updatePreview();

  $("#copyLink").addEventListener("click", async () => {
    const link = buildLink();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select(); document.execCommand("copy");
        ta.remove();
      }
      showToast("Link copied! ✨");
    } catch { showToast("Could not copy — long-press the link."); }
  });

  $("#waShare").addEventListener("click", () => {
    const link = buildLink();
    const to = cleanName(toInput.value, "");
    const msg = `🪔 Happy Diwali${to ? ` ${to}` : ""}! May your life be filled with light and joy. ✨\n\n`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg + link)}`, "_blank", "noopener");
  });

  const nativeShare = $("#nativeShare");
  if (navigator.share) {
    nativeShare.hidden = false;
    nativeShare.addEventListener("click", async () => {
      const link = buildLink();
      const to = cleanName(toInput.value, "");
      try {
        await navigator.share({ title: "Happy Diwali 🪔", text: `🪔 Happy Diwali${to ? ` ${to}` : ""}!`, url: link });
      } catch (err) {
        if (!err || err.name !== "AbortError") showToast("Sharing was cancelled.");
      }
    });
  }

  /* ---------------- MEMORY GAME ---------------- */
  const memoryGrid = $("#memoryGrid");
  const memoryMsg = $("#memoryMsg");
  const memoryGame = $("#memoryGame");
  const memoryReset = $("#memoryReset");

  const ICONS = ["🪔", "🎆", "🪷"];
  let memoryState = { first: null, second: null, lock: false, matches: 0 };

  function buildMemoryGame() {
    memoryGrid.innerHTML = "";
    memoryState = { first: null, second: null, lock: false, matches: 0 };
    memoryGame.classList.remove("is-win");
    memoryMsg.classList.remove("is-win");
    memoryMsg.textContent = "Tap a card to begin.";

    const cards = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);

    cards.forEach((icon, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "memory-card";
      card.dataset.icon = icon;
      card.setAttribute("aria-label", `Card ${index + 1}, hidden`);
      card.innerHTML = `<span class="memory-card__back">✦</span>`;
      card.addEventListener("click", () => flipCard(card));
      memoryGrid.appendChild(card);
    });
  }

  function flipCard(card) {
    if (memoryState.lock) return;
    if (card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;

    card.classList.add("is-flipped");
    card.textContent = card.dataset.icon;
    card.setAttribute("aria-label", `Card revealed: ${card.dataset.icon}`);
    Sound.pop();

    if (!memoryState.first) {
      memoryState.first = card;
      return;
    }

    memoryState.second = card;
    memoryState.lock = true;

    if (memoryState.first.dataset.icon === memoryState.second.dataset.icon) {
      memoryState.first.classList.add("is-matched");
      memoryState.second.classList.add("is-matched");
      memoryState.matches += 1;
      memoryMsg.textContent = `${memoryState.matches}/3 pairs matched! 🎉`;
      Sound.chime();

      memoryState.first = null;
      memoryState.second = null;
      memoryState.lock = false;

      if (memoryState.matches === 3) handleWin();
    } else {
      setTimeout(() => {
        memoryState.first.classList.remove("is-flipped");
        memoryState.second.classList.remove("is-flipped");
        memoryState.first.innerHTML = `<span class="memory-card__back">✦</span>`;
        memoryState.second.innerHTML = `<span class="memory-card__back">✦</span>`;
        memoryState.first.setAttribute("aria-label", "Card, hidden");
        memoryState.second.setAttribute("aria-label", "Card, hidden");
        memoryState.first = null;
        memoryState.second = null;
        memoryState.lock = false;
      }, 900);
    }
  }

  function handleWin() {
    const name = toName !== "My Dear Friend" ? toName : "friend";
    memoryMsg.textContent = `🎉 You won, ${name}! Your Diwali wish is ready.`;
    memoryMsg.classList.add("is-win");
    memoryGame.classList.add("is-win");

    Fireworks.celebrate();
    triggerSparkleRain();
    Sound.chime();
    setTimeout(() => Sound.chime(), 300);
    setTimeout(() => Sound.chime(), 600);
  }

  memoryReset.addEventListener("click", buildMemoryGame);
  buildMemoryGame();

  /* ---------------- LITE MODE ---------------- */
  const liteToggle = $("#liteToggle");
  let liteOn = false;

  liteToggle.addEventListener("click", () => {
    liteOn = !liteOn;
    document.body.classList.toggle("lite-mode", liteOn);
    liteToggle.setAttribute("aria-pressed", String(liteOn));
    liteToggle.setAttribute("aria-label", liteOn ? "Disable lite mode" : "Enable lite mode");
    if (liteOn) { Fireworks.stop(); showToast("Lite mode ON ⚡"); }
    else { if (introDone) Fireworks.start(); showToast("Lite mode OFF"); }
  });

  /* ---------------- INTRO ---------------- */
  const intro = $("#intro");
  const introDiya = $("#introDiya");
  let introDone = false;

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    intro.classList.add("is-lit");
    Sound.setEnabled(true);
    Sound.chime();

    setTimeout(() => {
      document.body.classList.remove("is-locked");
      document.body.classList.add("is-ready");
      intro.setAttribute("aria-hidden", "true");
      introDiya.disabled = true;
      setTimeout(() => {
        showRandomWish();
        if (!liteOn) Fireworks.start();
      }, 650);
    }, 900);
  }

  introDiya.addEventListener("click", finishIntro);

  /* Click anywhere → burst (except interactive elements) */
  window.addEventListener("pointerdown", (e) => {
    if (!introDone || isReduced() || liteOn) return;
    if (e.target.closest("button, input, a, form, .memory-card")) return;
    Fireworks.burst(e.clientX, e.clientY);
    Sound.pop();
  }, { passive: true });

})();
