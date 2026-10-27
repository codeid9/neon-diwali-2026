/* ==========================================================================
   script.js — Neon Diwali Wish Card
   Vanilla JS only. Mobile-optimized: fewer particles, capped DPR,
   optional Lite Mode toggle.
   ========================================================================== */

(() => {
  "use strict";

  /* ========================================================================
     Helpers
     ======================================================================== */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isMobile = () => window.innerWidth <= 768;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = () => reducedMotionQuery.matches;

  /* ========================================================================
     URL params / personalised names
     ======================================================================== */
  const params = new URLSearchParams(window.location.search);

  function cleanName(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    const cleaned = String(value)
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
    return cleaned || fallback;
  }

  const toName = cleanName(params.get("to"), "My Dear Friend");
  const fromName = cleanName(params.get("from"), "With Love");

  $("#toName").textContent = toName;
  $("#fromName").textContent = fromName;

  const toInput = $("#toInput");
  const fromInput = $("#fromInput");

  toInput.value = params.has("to") ? cleanName(params.get("to"), "") : "";
  fromInput.value = params.has("from") ? cleanName(params.get("from"), "") : "";

  /* ========================================================================
     Sound (Web Audio API only)
     ======================================================================== */
  const soundToggle = $("#soundToggle");
  const soundIcon = soundToggle.querySelector(".sound-toggle__icon");

  const Sound = (() => {
    let ctx = null;
    let master = null;
    let enabled = false;

    function ensure() {
      if (!ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;

        ctx = new AudioContextClass();
        master = ctx.createGain();
        master.gain.value = 0.42;
        master.connect(ctx.destination);
      }

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      return ctx;
    }

    function updateButton() {
      soundToggle.setAttribute("aria-pressed", String(enabled));
      soundToggle.setAttribute("aria-label", enabled ? "Disable sound" : "Enable sound");
      soundIcon.textContent = enabled ? "🔊" : "🔇";
    }

    function setEnabled(value) {
      enabled = Boolean(value);
      if (enabled) ensure();
      updateButton();
    }

    function chime() {
      if (!enabled) return;
      const audio = ensure();
      if (!audio) return;

      const now = audio.currentTime;
      const frequencies = [880, 1174.66, 1567.98];

      frequencies.forEach((freq, index) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12 / (index + 1), now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

        osc.connect(gain).connect(master);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    }

    function pop() {
      if (!enabled) return;
      const audio = ensure();
      if (!audio) return;

      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(rand(180, 260), now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + 0.24);
    }

    return {
      ensure,
      setEnabled,
      isEnabled: () => enabled,
      chime,
      pop,
      updateButton
    };
  })();

  Sound.setEnabled(false);

  soundToggle.addEventListener("click", () => {
    const next = !Sound.isEnabled();
    Sound.setEnabled(next);
    if (next) {
      Sound.ensure();
      Sound.chime();
    }
  });

  /* ========================================================================
     Wishes + typewriter
     ======================================================================== */
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
  let currentWishIndex = -1;
  let typeToken = 0;

  function typeWish(text, { instant = false } = {}) {
    typeToken += 1;
    const token = typeToken;
    const characters = Array.from(text);

    wishTextEl.textContent = "";
    wishLive.textContent = text;

    if (instant || isReduced()) {
      wishTextEl.textContent = text;
      return;
    }

    let index = 0;

    const step = () => {
      if (token !== typeToken) return;

      wishTextEl.textContent += characters[index] || "";
      index += 1;

      if (index < characters.length) {
        window.setTimeout(step, 26 + Math.random() * 34);
      }
    };

    step();
  }

  function showRandomWish() {
    let nextIndex = Math.floor(Math.random() * wishes.length);

    if (wishes.length > 1) {
      while (nextIndex === currentWishIndex) {
        nextIndex = Math.floor(Math.random() * wishes.length);
      }
    }

    currentWishIndex = nextIndex;

    wishTextEl.classList.remove("is-swapping");
    void wishTextEl.offsetWidth;
    wishTextEl.classList.add("is-swapping");
    window.setTimeout(() => wishTextEl.classList.remove("is-swapping"), 480);

    typeWish(wishes[currentWishIndex]);
  }

  $("#newWish").addEventListener("click", () => {
    showRandomWish();
    Sound.pop();
  });

  /* ========================================================================
     Starfield + floating elements
     ======================================================================== */
  function createStars() {
    const layer = $("#stars");
    if (!layer) return;

    const fragment = document.createDocumentFragment();
    const count = isReduced() ? 25 : isMobile() ? 35 : 90;

    for (let i = 0; i < count; i += 1) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = `${rand(0, 100)}%`;
      star.style.top = `${rand(0, 100)}%`;

      const size = rand(1, 2.6);
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.animationDuration = `${rand(2.5, 6).toFixed(2)}s`;
      star.style.animationDelay = `${(-Math.random() * 6).toFixed(2)}s`;

      fragment.appendChild(star);
    }

    layer.appendChild(fragment);
  }

  function createFloaters() {
    const layer = $("#floaters");
    if (!layer) return;
    if (isReduced()) return;

    const types = ["lantern", "petal", "spark"];
    const count = isMobile() ? 6 : 16;

    for (let i = 0; i < count; i += 1) {
      const el = document.createElement("span");
      const type = pick(types);

      el.className = `floater floater--${type}`;
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

  /* ========================================================================
     Fireworks canvas
     ======================================================================== */
  const Fireworks = (() => {
    const canvas = $("#fireworks");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return {
        start() {},
        stop() {},
        burst() {},
        celebrate() {},
        resize() {}
      };
    }

    const COLORS = [
      "#ffb300",
      "#ff2e93",
      "#8a2be2",
      "#00e5ff",
      "#fff6c9",
      "#ff7a00",
      "#ff4d00"
    ];

    let dpr = 1;
    let width = 0;
    let height = 0;
    let particles = [];
    let running = false;
    let rafId = 0;
    let nextAutoAt = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.25 : 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
    }

    function burst(x, y, count) {
      if (isReduced()) return;

      if (!width || !height) resize();

      const n = count ?? (isMobile() ? 42 : 72);
      const baseColor = pick(COLORS);

      for (let i = 0; i < n; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1.5, 7.5);
        const color = Math.random() < 0.7 ? baseColor : pick(COLORS);

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: rand(0.008, 0.018),
          size: rand(1.2, 3.4),
          color,
          gravity: rand(0.025, 0.055)
        });
      }

      const cap = isMobile() ? 800 : 1400;
      if (particles.length > cap) {
        particles.splice(0, particles.length - cap);
      }
    }

    function frame(now) {
      if (!running) return;

      /* Fade previous frame to create soft trails */
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];

        p.vy += p.gravity;
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.size *= 0.996;

        if (p.life <= 0 || p.size < 0.3) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (now > nextAutoAt) {
        burst(rand(width * 0.15, width * 0.85), rand(height * 0.12, height * 0.55));
        nextAutoAt = now + (isMobile() ? rand(2200, 3600) : rand(1000, 2000));
      }

      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (isReduced() || running) return;

      resize();
      running = true;
      nextAutoAt = performance.now() + rand(700, 1500);
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = 0;
    }

    function celebrate() {
      if (isReduced()) return;

      if (!running) start();

      const total = isMobile() ? 10 : 16;

      for (let i = 0; i < total; i += 1) {
        window.setTimeout(() => {
          burst(
            rand(width * 0.1, width * 0.9),
            rand(height * 0.08, height * 0.65)
          );
        }, i * 110);
      }
    }

    resize();

    return { start, stop, burst, celebrate, resize };
  })();

  window.addEventListener("resize", Fireworks.resize);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      Fireworks.stop();
    } else if (introDone) {
      Fireworks.start();
    }
  });

  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", () => {
      if (isReduced()) {
        Fireworks.stop();
      } else if (introDone) {
        Fireworks.start();
      }
    });
  }

  $("#celebrate").addEventListener("click", () => {
    if (isReduced()) {
      showToast("Fireworks are off because reduced motion is enabled.");
      return;
    }

    Fireworks.celebrate();
    Sound.pop();
  });

  /* ========================================================================
     Diya row + all-lit surprise
     ======================================================================== */
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
    if (isReduced()) return;

    const layer = $("#sparkleLayer");
    if (!layer) return;

    const count = isMobile() ? 30 : 60;

    for (let i = 0; i < count; i += 1) {
      const sparkle = document.createElement("span");
      sparkle.className = "sparkle-piece";
      sparkle.style.left = `${rand(0, 100)}vw`;
      sparkle.style.animationDelay = `${rand(0, 0.8).toFixed(2)}s`;
      sparkle.style.animationDuration = `${rand(2, 4).toFixed(2)}s`;
      sparkle.style.setProperty("--drift", `${rand(-40, 40).toFixed(1)}px`);

      layer.appendChild(sparkle);

      window.setTimeout(() => sparkle.remove(), 4800);
    }
  }

  function updateDiyaMessage() {
    const litCount = diyas.filter((diya) => diya.classList.contains("is-lit")).length;

    if (litCount === 5) {
      if (!surpriseActive) {
        surpriseActive = true;
        triggerSparkleRain();
        diyaMsg.textContent = "Your Diwali is now fully lit! 🪔";
        showToast("All diyas lit! Your Diwali is fully lit 🪔");
        Sound.chime();
        window.setTimeout(() => Sound.chime(), 260);
      }
      return;
    }

    surpriseActive = false;

    if (litCount === 0) {
      diyaMsg.textContent = "Tap a diya to light it.";
    } else {
      diyaMsg.textContent = `${litCount} of 5 diyas lit. Keep going! ✨`;
    }
  }

  function buildDiyas() {
    for (let i = 0; i < 5; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "diya";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `Diya ${i + 1} — unlit. Tap to light.`);
      button.innerHTML = diyaSVG;

      button.addEventListener("click", () => {
        const isLit = button.classList.toggle("is-lit");

        button.setAttribute("aria-pressed", String(isLit));
        button.setAttribute(
          "aria-label",
          `Diya ${i + 1} — ${isLit ? "lit" : "unlit"}. Tap to ${isLit ? "extinguish" : "light"}.`
        );

        if (isLit) {
          Sound.chime();
        } else {
          Sound.pop();
        }

        updateDiyaMessage();
      });

      diyaRow.appendChild(button);
      diyas.push(button);
    }
  }

  buildDiyas();
  diyaMsg.textContent = "Tap a diya to light it.";

  /* ========================================================================
     Share section
     ======================================================================== */
  const linkPreview = $("#linkPreview");
  const toast = $("#toast");
  let toastTimer = 0;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function buildLink() {
    const base = window.location.href.split("?")[0].split("#")[0];
    const url = new URL(base);

    const to = cleanName(toInput.value, "");
    const from = cleanName(fromInput.value, "");

    if (to) {
      url.searchParams.set("to", to);
    } else {
      url.searchParams.delete("to");
    }

    if (from) {
      url.searchParams.set("from", from);
    } else {
      url.searchParams.delete("from");
    }

    return url.toString();
  }

  function updatePreview() {
    linkPreview.textContent = buildLink();
  }

  toInput.addEventListener("input", updatePreview);
  fromInput.addEventListener("input", updatePreview);
  updatePreview();

  $("#copyLink").addEventListener("click", async () => {
    const link = buildLink();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      showToast("Link copied! ✨");
    } catch (error) {
      showToast("Could not copy — long-press the link to copy.");
    }
  });

  $("#waShare").addEventListener("click", () => {
    const link = buildLink();
    const to = cleanName(toInput.value, "");
    const message = `🪔 Happy Diwali${to ? ` ${to}` : ""}! May your life be filled with light and joy. ✨\n\n`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message + link)}`,
      "_blank",
      "noopener"
    );
  });

  const nativeShare = $("#nativeShare");

  if (navigator.share) {
    nativeShare.hidden = false;

    nativeShare.addEventListener("click", async () => {
      const link = buildLink();
      const to = cleanName(toInput.value, "");

      try {
        await navigator.share({
          title: "Happy Diwali 🪔",
          text: `🪔 Happy Diwali${to ? ` ${to}` : ""}!`,
          url: link
        });
      } catch (error) {
        if (!error || error.name !== "AbortError") {
          showToast("Sharing was cancelled.");
        }
      }
    });
  }

  /* ========================================================================
     Lite mode toggle (⚡) — manual performance switch
     ======================================================================== */
  const liteToggle = $("#liteToggle");
  let liteOn = false;

  liteToggle.addEventListener("click", () => {
    liteOn = !liteOn;
    document.body.classList.toggle("lite-mode", liteOn);
    liteToggle.setAttribute("aria-pressed", String(liteOn));
    liteToggle.setAttribute(
      "aria-label",
      liteOn ? "Disable lite mode" : "Enable lite mode"
    );

    if (liteOn) {
      Fireworks.stop();
      showToast("Lite mode ON ⚡");
    } else {
      if (introDone) Fireworks.start();
      showToast("Lite mode OFF");
    }
  });

  /* ========================================================================
     Intro / tap to light the diya
     ======================================================================== */
  const intro = $("#intro");
  const introDiya = $("#introDiya");
  let introDone = false;

  function finishIntro() {
    if (introDone) return;
    introDone = true;

    intro.classList.add("is-lit");

    /* This user gesture unlocks the Web Audio API. */
    Sound.setEnabled(true);
    Sound.chime();

    window.setTimeout(() => {
      document.body.classList.remove("is-locked");
      document.body.classList.add("is-ready");

      intro.setAttribute("aria-hidden", "true");
      introDiya.disabled = true;

      window.setTimeout(() => {
        showRandomWish();
        if (!liteOn) Fireworks.start();
      }, 650);
    }, 900);
  }

  introDiya.addEventListener("click", finishIntro);

  /* ========================================================================
     Click / tap anywhere to launch a firework burst
     ======================================================================== */
  window.addEventListener(
    "pointerdown",
    (event) => {
      if (!introDone || isReduced() || liteOn) return;

      Fireworks.burst(event.clientX, event.clientY);
      Sound.pop();
    },
    { passive: true }
  );

  /* ========================================================================
     Initial state
     ======================================================================== */
  /* The HTML already contains a fallback wish for no-JS visitors.
     The first real wish is typed after the intro completes. */
})();