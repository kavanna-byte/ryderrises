/* RYDER RISES — campaign site v2 behaviour.
   House rule (same as the trailer edit): no dissolves. Things cut, wipe, slide or flash. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isDesk = () => innerWidth > 640;
  const hasGsap = typeof gsap !== "undefined";
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- lightning flash ---------- */
  const flashEl = $("#flash");
  function flash(power = 1) {
    if (reduced || !hasGsap) return;
    gsap.timeline()
      .set(flashEl, { opacity: 0.9 * power })
      .to(flashEl, { opacity: 0.08, duration: 0.06, ease: "none" })
      .set(flashEl, { opacity: 0.55 * power }, "+=0.05")
      .to(flashEl, { opacity: 0, duration: 0.22, ease: "power2.in" });
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduced && hasGsap && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    const el = id === "#top" ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(id === "#top" ? 0 : el, { duration: 1.6 }) : el.scrollIntoView();
  }));

  /* ---------- preloader: the green band, then a hard cut ---------- */
  const band = $("#band"), meter = $("#bandMeter"), heroVideo = $("#heroVideo");
  const MIN = reduced ? 600 : 2600, MAX = 4500, t0 = performance.now();
  let videoReady = false, done = false;
  heroVideo.addEventListener("canplaythrough", () => (videoReady = true), { once: true });
  heroVideo.load();
  function tickMeter() {
    if (done) return;
    const el = performance.now() - t0;
    if (heroVideo.readyState >= 3) videoReady = true;
    meter.style.width = (Math.min(1, el / MIN) * (videoReady ? 1 : 0.92) * 100).toFixed(1) + "%";
    if ((el >= MIN && videoReady) || el >= MAX) return cut();
    requestAnimationFrame(tickMeter);
  }
  function cut() {
    if (done) return; done = true;
    try { sessionStorage.setItem("rr-band", "1"); } catch (e) {}
    band.remove();                                  // a cut, not a fade
    document.body.classList.remove("is-loading");
    heroVideo.play().catch(() => {});
    lenis && lenis.start();
    heroIn();
  }
  band.addEventListener("click", cut);
  addEventListener("keydown", e => { if (!done && (e.key === "Enter" || e.key === " " || e.key === "Escape")) cut(); });
  if (document.documentElement.classList.contains("is-return")) cut(); // seen it once in this tab: no second wait
  else { requestAnimationFrame(tickMeter); setTimeout(cut, MAX + 500); } // the timeout is a safety net: rAF is throttled in background tabs

  function heroIn() {
    if (!hasGsap || reduced) return;
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(".logo3d", { scale: 1.18, yPercent: 6, duration: 1.6 }, 0)
      .from(".hero__video", { scale: 1.25, duration: 2.4 }, 0)
      .set(".tagline .cut", { visibility: "hidden" }, 0)
      .set(".tagline .cut:nth-child(1)", { visibility: "visible" }, 0.5)
      .set(".tagline .cut:nth-child(2)", { visibility: "visible" }, 0.95)
      .fromTo(".hero__actions > *", { yPercent: 120, clipPath: "inset(0 0 100% 0)" }, { yPercent: 0, clipPath: "inset(0 0 0% 0)", duration: 1, stagger: 0.12, clearProps: "clipPath" }, 0.6)
      .from(".nav", { yPercent: -120, duration: 1 }, 0.8);
  }

  if (!hasGsap) { document.body.classList.remove("is-loading"); return; }

  /* ---------- the logo: live light + 3D tilt ---------- */
  const logo = $("#logo3d"), heroLoops = [];          // endless tweens, paused while the hero is off screen
  if (logo && !reduced) {
    const aura = $(".logo3d__aura", logo), core = $(".logo3d__core", logo);
    heroLoops.push(gsap.to(aura, { opacity: 0.55, scale: 1.04, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    heroLoops.push(gsap.to(core, { scale: 1.08, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 50%" }));
    // real electricity: arcs crawl the silhouette, tendrils shoot off it, a strike from the sky now and then
    if (typeof Electric !== "undefined") Electric($("#arcs"), $(".logo3d__img", logo), { pad: 0.22, color: [176, 112, 255], hot: [252, 248, 255], rate: 1.5, onStrike() {
      logo.classList.add("is-strike"); setTimeout(() => logo.classList.remove("is-strike"), 170);
    } });
    if (fine) {
      const rx = gsap.quickTo(logo, "rotationX", { duration: 0.9, ease: "power3" }), ry = gsap.quickTo(logo, "rotationY", { duration: 0.9, ease: "power3" });
      $(".hero").addEventListener("mousemove", e => { ry((e.clientX / innerWidth - 0.5) * 16); rx(-(e.clientY / innerHeight - 0.5) * 10); });
      $(".hero").addEventListener("mouseleave", () => { rx(0); ry(0); });
    } else {
      heroLoops.push(gsap.to(logo, { rotationY: 6, rotationX: -3, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    }
  }

  /* ---------- hero: pause the loop off-screen, parallax out ---------- */
  ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top",
    onLeave: () => { heroVideo.pause(); heroLoops.forEach(t => t.pause()); },
    onEnterBack: () => { heroVideo.play().catch(() => {}); heroLoops.forEach(t => t.resume()); } });
  if (!reduced) gsap.to(".hero__content", { yPercent: -16, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- nav ---------- */
  const nav = $("#nav"); let navHidden = false;
  ScrollTrigger.create({
    start: 120, end: "max",
    onUpdate: s => {
      const hide = s.direction === 1 && s.scroll() > 400;
      if (hide !== navHidden) { navHidden = hide; gsap.to(nav, { yPercent: hide ? -110 : 0, duration: 0.5, ease: "expo.out", overwrite: true }); }
      nav.classList.toggle("is-solid", s.scroll() > innerHeight * 0.8);
    }
  });

  /* ---------- line-mask reveals (split only after the webfonts are in, or the lines break wrong) ---------- */
  if (!reduced && typeof SplitType !== "undefined") document.fonts.ready.then(() => {
    $$("[data-reveal]").forEach(el => {
      const split = new SplitType(el, { types: "lines" });
      split.lines.forEach(l => { const w = document.createElement("span"); w.className = "line-mask"; l.parentNode.insertBefore(w, l); w.appendChild(l); });
      gsap.from(split.lines, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 86%", refreshPriority: -1 } });
    });
    // metal titles slam in from below their own mask
    $$(".metal").forEach(el => gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)", yPercent: 18 }, { clipPath: "inset(0 0 0% 0)", yPercent: 0, duration: 1.2, ease: "expo.out", clearProps: "clipPath", scrollTrigger: { trigger: el, start: "top 88%", refreshPriority: -1 } }));
    ScrollTrigger.refresh();
  });

  /* ---------- story: words light up as metal ---------- */
  const story = $("#storyText");
  if (typeof SplitType !== "undefined" && !reduced) {
    const words = new SplitType(story, { types: "words" }).words;
    words.forEach((w, i) => {
      const k = w.textContent.toLowerCase().replace(/[^a-z]/g, "");
      if (k === "humdinger" || (k === "one" && /call/i.test((words[i + 1] || {}).textContent || "")) || (k === "call" && /one/i.test((words[i - 1] || {}).textContent || ""))) w.dataset.gold = "1";
    });
    let lastLit = -1;
    ScrollTrigger.create({
      trigger: story, start: "top 78%", end: "bottom 42%", scrub: true,
      onUpdate: s => {
        const n = Math.round(s.progress * words.length);
        if (n === lastLit) return;
        words.forEach((w, i) => { w.classList.toggle("is-lit", i < n); w.classList.toggle("is-gold", i < n && w.dataset.gold === "1"); });
        lastLit = n;
      }
    });
  }

  /* ---------- stills: pinned horizontal run on desktop, native swipe on phones ---------- */
  const track = $("#stillsTrack"), idx = $("#stillIdx"), items = $$("li", track);
  const setIdx = i => (idx.textContent = String(Math.min(items.length, Math.max(1, i))).padStart(2, "0"));
  const mm = gsap.matchMedia();
  mm.add("(min-width: 641px) and (prefers-reduced-motion: no-preference)", () => {
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".stills", start: "top top", end: () => "+=" + dist() * 0.65, pin: true, scrub: 0.6, invalidateOnRefresh: true, onUpdate: s => setIdx(Math.round(s.progress * (items.length - 1)) + 1) }
    });
    items.forEach(li => gsap.fromTo($("img", li), { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: li, containerAnimation: tween, start: "left right", end: "right left", scrub: true } }));
  });
  const vp = $(".stills__viewport");
  vp.addEventListener("scroll", () => { if (!isDesk()) setIdx(Math.round(vp.scrollLeft / (items[0].offsetWidth + 14)) + 1); }, { passive: true });

  /* ---------- poster loupe ---------- */
  const fig = $("#posterFig"), pimg = $("#posterImg"), lens = $("#posterLens");
  if (fine) {
    let hi = false; const Z = 2.6;
    fig.addEventListener("mouseenter", () => { if (!hi) { lens.style.backgroundImage = `url(${pimg.dataset.hi})`; hi = true; } fig.classList.add("is-zoom"); });
    fig.addEventListener("mouseleave", () => fig.classList.remove("is-zoom"));
    fig.addEventListener("mousemove", e => {
      const r = fig.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      lens.style.left = x - 120 + "px"; lens.style.top = y - 120 + "px";
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lens.style.backgroundPosition = `${-(x * Z - 120)}px ${-(y * Z - 120)}px`;
    });
  }
  if (!reduced) gsap.from(fig, { yPercent: 12, rotate: -2, ease: "none", scrollTrigger: { trigger: ".poster", start: "top bottom", end: "center center", scrub: true } });

  /* ---------- the slate: the clapper closes on scroll — CLAP + flash ---------- */
  const slate = $("#slate");
  if (!reduced) {
    const stick = $(".slate__stick", slate);
    ScrollTrigger.create({
      trigger: slate, start: "top 70%", once: true, refreshPriority: -1,
      onEnter: () => {
        gsap.timeline()
          .to(stick, { rotate: -16, duration: 0.35, ease: "power2.out" })
          .to(stick, { rotate: 0, duration: 0.16, ease: "power4.in" })
          .to(slate, { y: 6, duration: 0.06, yoyo: true, repeat: 1 }, "<");
        $$(".slate__cell b[data-count]", slate).forEach(b => {
          const to = +b.dataset.count, o = { v: 0 };
          gsap.to(o, { v: to, duration: 1.4, delay: 0.5, ease: "power3.out", onUpdate: () => (b.textContent = Math.round(o.v)) });
        });
      }
    });
  }

  /* ---------- two frames, one move: the shot plays only while it is on screen ---------- */
  $$(".move__shot video").forEach(v => {
    ScrollTrigger.create({ trigger: v, start: "top 90%", end: "bottom 10%", refreshPriority: -1,
      onToggle: s => (s.isActive ? v.play().catch(() => {}) : v.pause()) });
  });

  /* ---------- film strip: the visitor drives it (drag, arrows, snap), never the page scroll ---------- */
  const strip = $("#strip");
  if (strip) {
    const step = () => { const f = $(".frame", strip); return f ? f.getBoundingClientRect().width : 400; };
    $("#stripPrev").addEventListener("click", () => strip.scrollBy({ left: -step(), behavior: "smooth" }));
    $("#stripNext").addEventListener("click", () => strip.scrollBy({ left: step(), behavior: "smooth" }));
    const navState = () => { $("#stripPrev").disabled = strip.scrollLeft < 4; $("#stripNext").disabled = strip.scrollLeft > strip.scrollWidth - strip.clientWidth - 4; };
    strip.addEventListener("scroll", navState, { passive: true }); navState();
    if (fine) { // drag to scroll with the mouse
      let down = false, x0 = 0, s0 = 0, moved = false;
      strip.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = strip.scrollLeft; strip.classList.add("is-drag"); });
      addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 3) moved = true; strip.scrollLeft = s0 - dx; });
      addEventListener("pointerup", () => { if (!down) return; down = false; strip.classList.remove("is-drag"); });
      strip.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
    // vertical wheel over the strip stays the page's; a horizontal trackpad swipe moves the strip natively
  }

  /* ---------- house rules: each rule slams in ---------- */
  if (!reduced) $$(".rules__list li").forEach(li => gsap.fromTo(li, { xPercent: -6, clipPath: "inset(0 100% 0 0)" }, { xPercent: 0, clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: li, start: "top 88%", refreshPriority: -1 } }));

  /* ---------- the credits gag: a real end roll, pinned, the list rising through the frame ---------- */
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // the whole block rolls: "presents" with the names right under it, like a real end roll
    const stage = $("#creditsStage"), list = $("#creditsList");
    gsap.timeline({ scrollTrigger: { trigger: ".credits", start: "top top", end: "+=160%", pin: true, scrub: 0.6, invalidateOnRefresh: true } })
      .fromTo(stage, { y: 0 }, { y: () => -(list.offsetTop + list.offsetHeight - innerHeight * 0.62), ease: "none" });
  });

  /* ---------- the close: draw the title once, then hand it to the electricity ---------- */
  const ztitle = $("#ztitle");
  if (ztitle) document.fonts.load('700 200px "Archivo"').then(() => {
    const cv = document.createElement("canvas"), W = 1800, H = 760, g = cv.getContext("2d"); cv.width = W; cv.height = H;
    g.fillStyle = "#f3eefc"; g.textAlign = "center"; g.font = '700 extra-condensed 330px "Archivo"';
    g.fillText("ONE CALL", W / 2, 330); g.fillText("LEFT.", W / 2, 690);
    const url = cv.toDataURL("image/png"), img = $("#zimg");
    ztitle.style.setProperty("--m", `url(${url})`);
    img.onload = () => { if (!reduced && typeof Electric !== "undefined") Electric($("#zcan"), img, { pad: 0.14, color: [176, 112, 255], hot: [252, 248, 255], rate: 1.6,
      onStrike() { ztitle.classList.add("is-strike"); setTimeout(() => ztitle.classList.remove("is-strike"), 170); } }); };
    img.src = url;
  });

  /* ---------- the call to action: Storm Tag ---------- */
  const root = document.documentElement;
  root.dataset.btn = "14"; // Storm Tag: the toy badge with the storm alive inside it
  // plasma inside the capsule (4) and the badge (1+4)
  $$(".cta").forEach(btn => {
    const rose = btn.classList.contains("cta--rose"), base = rose ? "#3a0a32" : "#1a0838", hue = rose ? ["255,160,220", "255,72,176"] : ["201,162,255", "120,60,255"]; // the share tag burns pink
    const c = $(".cta__plasma", btn), x = c.getContext("2d"); let t = Math.random() * 10, boost = 0, w = 0, h = 0;
    const size = () => { const r = btn.getBoundingClientRect(); w = c.width = Math.max(1, r.width * 2); h = c.height = Math.max(1, r.height * 2); };
    size(); addEventListener("resize", size); btn._size = size;
    btn._boost = v => (boost = Math.min(1, boost + v));
    // the plasma only animates while its button is on screen and the tab is visible (an off-screen loop still costs a phone its CPU)
    let onScreen = true, looping = false;
    const wake = () => { if (!looping && onScreen && !document.hidden) { looping = true; requestAnimationFrame(plasma); } };
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; wake(); }).observe(btn);
    document.addEventListener("visibilitychange", wake);
    wake();
    function plasma() {
      if (!onScreen || document.hidden) { looping = false; return; }
      if (root.dataset.btn !== "1" && w) {
        t += 0.016 + boost * 0.05; boost *= 0.94;
        x.globalCompositeOperation = "source-over"; x.fillStyle = base; x.fillRect(0, 0, w, h);
        x.globalCompositeOperation = "lighter";
        for (let i = 0; i < 7; i++) {
          const px = w * (0.5 + 0.45 * Math.sin(t * (0.6 + i * 0.13) + i * 1.7)), py = h * (0.5 + 0.4 * Math.cos(t * (0.8 + i * 0.11) + i)), r = h * (0.55 + 0.25 * Math.sin(t + i));
          const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${hue[i % 2 ? 0 : 1]},${0.55 + boost * 0.35})`); g.addColorStop(1, "rgba(0,0,0,0)");
          x.fillStyle = g; x.fillRect(0, 0, w, h);
        }
      }
      requestAnimationFrame(plasma);
    }
    // the badge leans toward the pointer (4, 1+4)
    if (fine) {
      btn.addEventListener("mousemove", e => { if (root.dataset.btn === "1") return; const r = btn.getBoundingClientRect(); btn.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.12}px ${(e.clientY - r.top - r.height / 2) * 0.18}px`; btn._boost(0.04); });
      btn.addEventListener("mouseleave", () => (btn.style.translate = ""));
    }
    btn.addEventListener("click", () => {
      if (root.dataset.btn !== "4") { btn.classList.remove("is-boop"); void btn.offsetWidth; btn.classList.add("is-boop"); }
      if (root.dataset.btn !== "1") { btn._boost(1); skyStrike(btn); }
    });
  });
  // lightning from the top of the screen into a button
  const sky = $("#skyfx"), sx = sky.getContext("2d"); let skyBolts = [], skyOn = false;
  const skySize = () => { sky.width = innerWidth; sky.height = innerHeight; }; skySize(); addEventListener("resize", skySize);
  const jag = (a, b, r, d) => { if (!d) return [a, b]; const m = [(a[0] + b[0]) / 2 + (Math.random() - 0.5) * r, (a[1] + b[1]) / 2 + (Math.random() - 0.5) * r]; return jag(a, m, r / 2, d - 1).concat(jag(m, b, r / 2, d - 1).slice(1)); };
  function skyStrike(el) {
    const r = el.getBoundingClientRect(), end = [r.left + r.width / 2, r.top + 4];
    skyBolts.push({ p: jag([end[0] + (Math.random() - 0.5) * 260, -10], end, 160, 7), t: performance.now() });
    if (!skyOn) { skyOn = true; requestAnimationFrame(drawSky); }
  }
  function drawSky(now) {
    sx.clearRect(0, 0, sky.width, sky.height); skyBolts = skyBolts.filter(b => now - b.t < 300);
    sx.globalCompositeOperation = "lighter"; sx.lineCap = "round";
    for (const b of skyBolts) {
      const a = (1 - (now - b.t) / 300) * (0.6 + Math.random() * 0.4);
      sx.beginPath(); b.p.forEach((p, i) => (i ? sx.lineTo(p[0], p[1]) : sx.moveTo(p[0], p[1])));
      sx.shadowColor = "#9b5cff"; sx.shadowBlur = 26; sx.strokeStyle = `rgba(155,92,255,${0.6 * a})`; sx.lineWidth = 8; sx.stroke();
      sx.shadowBlur = 6; sx.strokeStyle = `rgba(245,238,255,${a})`; sx.lineWidth = 2.2; sx.stroke();
    }
    if (skyBolts.length) requestAnimationFrame(drawSky); else { sx.clearRect(0, 0, sky.width, sky.height); skyOn = false; }
  }

  /* ---------- hover labels on media (no generic cursor) ---------- */
  const tip = $("#tip");
  if (fine) {
    const tx = gsap.quickTo(tip, "left", { duration: 0.25, ease: "power3" }), ty = gsap.quickTo(tip, "top", { duration: 0.25, ease: "power3" });
    addEventListener("mousemove", e => { tx(e.clientX); ty(e.clientY); });
    document.addEventListener("mouseover", e => { const t = e.target.closest("[data-tip]"); tip.classList.toggle("is-on", !!t); if (t) tip.textContent = t.dataset.tip; });
  }

  /* ---------- small shared tools: analytics hand-off, copy, share ---------- */
  const report = (name, params = {}) => document.dispatchEvent(new CustomEvent("rr:track", { detail: { name, params } }));
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try { // older browsers and non-secure contexts
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.className = "visually-hidden";
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch (e) { return false; }
  }
  async function share(btn) {
    const url = location.origin + location.pathname + "?utm_source=share&utm_medium=visitor";
    let method = "copy";
    const touch = navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches; // phones and tablets, an iPad with a trackpad included
    if (touch && navigator.share) { // the system share sheet (iPhone / Android); desktops copy the link
      try { await navigator.share({ title: "Ryder Rises", text: "PAW Patrol: Ryder Rises. An unsanctioned fan parody trailer.", url }); method = "native"; }
      catch (e) { if (e && e.name === "AbortError") return; } // closed the sheet: done; any other refusal falls back to copying
    }
    if (method === "copy" && !(await copyText(url))) return;
    report("share", { method, content_type: "trailer", placement: btn.dataset.place || "" });
    if (method !== "copy") return;
    const label = $(".cta__label", btn), was = label && label.textContent;
    btn.classList.add("is-copied"); if (label) label.textContent = "Link copied";
    setTimeout(() => { btn.classList.remove("is-copied"); if (label) label.textContent = was; }, 1900);
  }
  $$(".js-share").forEach(b => b.addEventListener("click", () => share(b)));

  /* ---------- the close: a second, quieter way to write ---------- */
  const MAIL = ["woodgate", "gmail.com"]; // kept in two parts so the address never sits whole in the source
  const mailLine = $("#mailLine");
  if (mailLine && MAIL[0] && MAIL[1]) {
    const addr = MAIL.join("@"), a = $(".js-mail", mailLine), note = $(".close__copied", mailLine);
    a.textContent = addr; a.href = "mailto:" + addr + "?subject=" + encodeURIComponent("Ryder Rises"); mailLine.hidden = false;
    a.addEventListener("click", () => { // the mail app opens if there is one; the address is on the clipboard either way
      report("email_click");
      copyText(addr).then(ok => { if (!ok) return; note.textContent = "Address copied"; setTimeout(() => (note.textContent = ""), 2400); });
    });
  }

  /* ---------- theatre: custom player ---------- */
  const theatre = $("#theatre"), tv = $("#trailerVideo"), screen = $("#screen"), closeBtn = $("#theatreClose"), endcard = $("#endcard");
  const scrub = $("#scrub"), fill = $("#fill"), buf = $("#buf"), head = $("#head"), ticks = $("#ticks"), hoverTip = $("#hoverTip");
  const tcNow = $("#tcNow"), tcDur = $("#tcDur"), chapEl = $("#chap");
  // chapters from the v38 edit list
  const CH = [[0, "Humblin Pictures"], [8, "The prison"], [17.7, "Adventure Bay has fallen"], [25.6, "The key"], [34.7, "The escape"], [39.1, "The Lookout"], [44.8, "Robo Dog"], [49.2, "Suit up"], [56.9, "The city"], [60.7, "The cat army"], [72.2, "The tower"], [79.6, "Gabi"], [87.4, "Kaiju"], [97.6, "Ryder Rises"], [104.4, "The dollhouse"], [114.8, "A film by Yoni Levy"]];
  const fmt = t => { t = Math.max(0, t | 0); return String((t / 60) | 0).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };
  const chapterAt = t => { let c = CH[0][1]; for (const [s, n] of CH) if (t >= s) c = n; return c; };
  let dur = 118.8, lastFocus = null, idleT = null, dragging = false;
  const buildTicks = () => { ticks.replaceChildren(...CH.slice(1).map(([s]) => { const i = document.createElement("i"); i.style.left = (s / dur) * 100 + "%"; return i; })); };
  buildTicks();
  tv.addEventListener("loadedmetadata", () => { dur = tv.duration || dur; tcDur.textContent = fmt(dur); buildTicks(); });
  function loop() { paint(); if (!tv.paused) requestAnimationFrame(loop); }
  function paint() {
    const p = (tv.currentTime / dur) * 100;
    fill.style.width = p + "%"; head.style.left = p + "%";
    tcNow.textContent = fmt(tv.currentTime); chapEl.textContent = chapterAt(tv.currentTime);
    scrub.setAttribute("aria-valuenow", tv.currentTime | 0);
    if (tv.buffered.length) buf.style.width = (tv.buffered.end(tv.buffered.length - 1) / dur) * 100 + "%";
  }
  tv.addEventListener("timeupdate", paint); // also keeps the bar honest when rAF is throttled
  tv.addEventListener("play", () => { endcard.hidden = true; theatre.classList.add("is-playing"); loop(); idle(); });
  tv.addEventListener("pause", () => { theatre.classList.remove("is-playing", "is-idle"); paint(); });
  tv.addEventListener("seeked", paint);
  tv.addEventListener("volumechange", () => theatre.classList.toggle("is-muted", tv.muted));
  const toggle = () => (tv.paused ? tv.play().catch(() => {}) : tv.pause());
  $("#plPlay").addEventListener("click", toggle);
  tv.addEventListener("click", toggle);
  $("#plMute").addEventListener("click", () => (tv.muted = !tv.muted));
  // captions: off by default, the viewer's choice is remembered
  const ccBtn = $("#plCC"), ccTrack = tv.textTracks[0];
  const setCC = on => {
    if (ccTrack) ccTrack.mode = on ? "showing" : "hidden";
    ccBtn.setAttribute("aria-pressed", String(on)); theatre.classList.toggle("is-cc", on);
    try { localStorage.setItem("rr-cc", on ? "1" : "0"); } catch (e) {}
  };
  setCC((() => { try { return localStorage.getItem("rr-cc") === "1"; } catch (e) { return false; } })());
  ccBtn.addEventListener("click", () => setCC(!theatre.classList.contains("is-cc")));
  $("#plFull").addEventListener("click", () => (document.fullscreenElement ? document.exitFullscreen() : (screen.requestFullscreen ? screen.requestFullscreen() : tv.webkitEnterFullscreen && tv.webkitEnterFullscreen())));
  const seekFrom = e => { const r = scrub.getBoundingClientRect(); tv.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * dur; paint(); };
  scrub.addEventListener("pointerdown", e => { dragging = true; scrub.setPointerCapture(e.pointerId); seekFrom(e); });
  scrub.addEventListener("pointermove", e => {
    const r = scrub.getBoundingClientRect(), p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    hoverTip.style.left = p * 100 + "%"; hoverTip.textContent = fmt(p * dur) + " · " + chapterAt(p * dur);
    if (dragging) seekFrom(e);
  });
  scrub.addEventListener("pointerup", () => (dragging = false));
  scrub.addEventListener("keydown", e => { if (e.key === "ArrowRight") tv.currentTime += 5; if (e.key === "ArrowLeft") tv.currentTime -= 5; });
  function idle() { theatre.classList.remove("is-idle"); clearTimeout(idleT); idleT = setTimeout(() => { if (!tv.paused) theatre.classList.add("is-idle"); }, 2400); }
  theatre.addEventListener("pointermove", idle);
  function openTheatre() {
    lastFocus = document.activeElement;
    theatre.hidden = false; endcard.hidden = true; $(".endcard__bg", endcard).loading = "eager";
    heroVideo.pause(); lenis && lenis.stop(); document.body.style.overflow = "hidden";
    tv.play().catch(() => {}); closeBtn.focus();
  }
  function closeTheatre() {
    tv.pause(); if (document.fullscreenElement) document.exitFullscreen();
    theatre.hidden = true; endcard.hidden = true; lenis && lenis.start(); document.body.style.overflow = "";
    if (scrollY < innerHeight) heroVideo.play().catch(() => {});
    lastFocus && lastFocus.focus();
  }
  $$(".js-play").forEach(b => b.addEventListener("click", () => setTimeout(openTheatre, document.documentElement.dataset.btn === "1" ? 120 : 260))); // let the boop / the strike land first
  closeBtn.addEventListener("click", closeTheatre);
  addEventListener("keydown", e => {
    if (theatre.hidden) return;
    if (e.key === "Escape" && !document.fullscreenElement) closeTheatre();
    if (e.key === " " && e.target !== scrub && endcard.hidden) { e.preventDefault(); toggle(); } // on the end card, space presses the focused button
    if (e.key === "m") tv.muted = !tv.muted;
    if (e.key === "c") ccBtn.click();
    if (e.key === "f") $("#plFull").click();
  });
  // the last frame is a card, not an exit: a hard cut to it, like everything else here
  tv.addEventListener("ended", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    if (tv.webkitDisplayingFullscreen && tv.webkitExitFullscreen) tv.webkitExitFullscreen();
    endcard.hidden = false;
    $$(".cta", endcard).forEach(b => b._size && b._size());
    $(".js-share", endcard).focus({ preventScroll: true });
  });
  $(".js-replay", endcard).addEventListener("click", () => { report("trailer_replay"); tv.currentTime = 0; tv.play().catch(() => {}); });
  $(".js-tocontact", endcard).addEventListener("click", () => {
    lastFocus = null; closeTheatre();
    const c = $("#contact"); lenis ? lenis.scrollTo(c, { duration: 1.6 }) : c.scrollIntoView();
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
