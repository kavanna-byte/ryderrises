/* Electric halo for a cut-out image: real arcs that crawl along the silhouette, branch off it,
   and now and then a strike from above. Canvas 2D, additive light, no libraries.
   usage: Electric(canvasEl, imgEl, { pad: .22, color: [155, 92, 255] }) */
(function () {
  function Electric(canvas, img, opt = {}) {
    const pad = opt.pad ?? 0.22, col = opt.color || [155, 92, 255], hot = opt.hot || [236, 220, 255], rate = opt.rate || 1;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), edges = [], normals = [], bolts = [], t0 = performance.now(), nextStrike = 1800, raf = 0, alive = true;
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    function sample() {
      // read the image's alpha at low res and keep its edge pixels + an outward normal for each
      const S = 220, ratio = img.naturalHeight / img.naturalWidth, sw = S, sh = Math.round(S * ratio);
      const oc = document.createElement("canvas"); oc.width = sw; oc.height = sh;
      const o = oc.getContext("2d", { willReadFrequently: true }); o.drawImage(img, 0, 0, sw, sh);
      const a = o.getImageData(0, 0, sw, sh).data, A = (x, y) => (x < 0 || y < 0 || x >= sw || y >= sh ? 0 : a[(y * sw + x) * 4 + 3]);
      edges = []; normals = [];
      for (let y = 1; y < sh - 1; y++) for (let x = 1; x < sw - 1; x++) {
        if (A(x, y) < 128) continue;
        if (A(x - 1, y) < 128 || A(x + 1, y) < 128 || A(x, y - 1) < 128 || A(x, y + 1) < 128) {
          const gx = A(x + 1, y) - A(x - 1, y), gy = A(x, y + 1) - A(x, y - 1), len = Math.hypot(gx, gy) || 1;
          edges.push([x / sw, y / sh]); normals.push([-gx / len, -gy / len]);
        }
      }
    }
    function resize() {
      const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // image box inside the canvas (the canvas is bigger by `pad` on every side)
    const box = () => { const iw = W / (1 + 2 * pad), ih = H / (1 + 2 * pad); return { x: (W - iw) / 2, y: (H - ih) / 2, w: iw, h: ih }; };
    const P = (i, b, out = 0) => [b.x + edges[i][0] * b.w + normals[i][0] * out, b.y + edges[i][1] * b.h + normals[i][1] * out];

    function crawl(b) { // an arc that hugs the silhouette: hop between nearby edge pixels
      let i = (Math.random() * edges.length) | 0; const pts = [P(i, b, 2 + Math.random() * 6)], steps = 6 + (Math.random() * 10) | 0, reach = b.w * 0.07;
      for (let s = 0; s < steps; s++) {
        const [cx, cy] = P(i, b); let best = -1, bd = 1e9;
        for (let k = 0; k < 40; k++) { const j = (Math.random() * edges.length) | 0, [x, y] = P(j, b), d = Math.hypot(x - cx, y - cy); if (d > reach * 0.35 && d < reach && d < bd) { bd = d; best = j; } }
        if (best < 0) break; i = best; pts.push(P(i, b, 2 + Math.random() * 10));
      }
      return pts;
    }
    function jag(a, c, rough, depth) { // midpoint displacement
      if (depth === 0) return [a, c];
      const m = [(a[0] + c[0]) / 2 + (Math.random() - 0.5) * rough, (a[1] + c[1]) / 2 + (Math.random() - 0.5) * rough];
      return jag(a, m, rough / 2, depth - 1).concat(jag(m, c, rough / 2, depth - 1).slice(1));
    }
    function spawn(kind) {
      const b = box(); if (!edges.length) return;
      if (kind === "strike") { // from the sky to a point on the badge
        const i = (Math.random() * edges.length) | 0, end = P(i, b), start = [end[0] + (Math.random() - 0.5) * W * 0.5, -10];
        const main = jag(start, end, W * 0.18, 7);
        bolts.push({ path: main, life: 260, born: performance.now(), w: 2.4, glow: 1 });
        for (let k = 0; k < 3; k++) { const at = main[(main.length * (0.3 + Math.random() * 0.5)) | 0]; bolts.push({ path: jag(at, [at[0] + (Math.random() - 0.5) * 140, at[1] + 40 + Math.random() * 90], 50, 4), life: 200, born: performance.now(), w: 1.1, glow: 0.7 }); }
        opt.onStrike && opt.onStrike();
        return;
      }
      if (kind === "branch") { // a short tendril shooting off the edge
        const i = (Math.random() * edges.length) | 0, a = P(i, b, 1), len = b.w * (0.05 + Math.random() * 0.12), c = P(i, b, len);
        bolts.push({ path: jag(a, [c[0] + (Math.random() - 0.5) * len * 0.6, c[1] + (Math.random() - 0.5) * len * 0.6], len * 0.5, 4), life: 90 + Math.random() * 120, born: performance.now(), w: 1, glow: 0.6 });
        return;
      }
      const pts = crawl(b); if (pts.length < 2) return; let path = [];
      for (let k = 0; k < pts.length - 1; k++) path = path.concat(jag(pts[k], pts[k + 1], 9, 3).slice(k ? 1 : 0));
      bolts.push({ path, life: 110 + Math.random() * 160, born: performance.now(), w: 1.4, glow: 0.9 });
    }
    function stroke(path, w, color, blur) {
      if (!path || path.length < 2) return;
      ctx.beginPath(); ctx.moveTo(path[0][0], path[0][1]); for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.lineWidth = w; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.stroke();
    }
    function frame(now) {
      if (!alive) return;
      const dt = now - t0; t0 = now;
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = ctx.lineJoin = "round";
      // spawn: a steady crackle along the edge, tendrils, and a strike now and then
      if (Math.random() < 0.55 * rate * (dt / 16)) spawn("crawl");
      if (Math.random() < 0.18 * rate * (dt / 16)) spawn("branch");
      nextStrike -= dt; if (nextStrike < 0) { spawn("strike"); nextStrike = 3500 + Math.random() * 5000; }
      bolts = bolts.filter(bl => now - bl.born < bl.life);
      for (const bl of bolts) {
        const k = 1 - (now - bl.born) / bl.life, flick = 0.55 + Math.random() * 0.45, a = k * flick * bl.glow;
        stroke(bl.path, bl.w * 7, rgba(col, 0.24 * a), 30);
        stroke(bl.path, bl.w * 2.6, rgba(col, 0.75 * a), 16);
        stroke(bl.path, bl.w * 1.2, rgba(hot, a), 6);
      }
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-over";
      raf = onScreen && !document.hidden ? requestAnimationFrame(frame) : 0;
    }
    // only draw while the canvas is on screen and the tab is visible: an off-screen loop still costs a phone its CPU
    let onScreen = true;
    const run = () => { if (alive && onScreen && !document.hidden && !raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); } };
    const halt = () => { cancelAnimationFrame(raf); raf = 0; };
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? run() : halt(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => (document.hidden ? halt() : run()));
    function start() { sample(); resize(); run(); }
    img.complete && img.naturalWidth ? start() : img.addEventListener("load", start, { once: true });
    addEventListener("resize", resize);
    return { strike: () => spawn("strike"), stop() { alive = false; cancelAnimationFrame(raf); }, burst(n = 6) { for (let i = 0; i < n; i++) spawn(i % 2 ? "branch" : "crawl"); } };
  }
  window.Electric = Electric;
})();
