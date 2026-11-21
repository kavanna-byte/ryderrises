/* Ryder Rises case study: Diagram A (timeline) and in-view video playback.
   Strings are set as text nodes only. */
(() => {

  // ---------- Diagram A data ----------
  // Columns: 1 = lane label, 2 = Mar 2025, 3 = Apr-Dec 2025 (compressed), 4..15 = Jan..Dec 2026.
  const C = { mar25: 2, gap: 3 };
  const m26 = (m) => 3 + m; // 1 = Jan 2026
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const T = (o) => o;
  const lanes = [
    { id: 'sora', name: 'Sora' },
    { id: 'mj', name: 'Midjourney' },
    { id: 'veo', name: 'Veo / Flow' },
    { id: 'seed', name: 'Seedance', sub: '2 and 2.5' },
    { id: 'h3', name: 'MiniMax H3', sub: 'on fal' },
    { id: 'kling', name: 'Kling 4.0' },
  ];
  const events = [
    { lane: 'sora', col: C.mar25, span: 2, r: 'no', when: 'Mar 27, 2025', text: 'Too early. A picnic of knock-off pups' },
    { lane: 'sora', col: m26(1), span: 3, r: 'no', when: 'Jan 8', text: 'Ryder with stubble. 20 min later: frame one, elsewhere' },
    { lane: 'mj', col: m26(1), span: 3, r: 'part', when: 'Jan 11', text: '16 clips. A few made the film' },
    { lane: 'veo', col: m26(1), span: 3, r: 'no', when: 'Jan 11', text: '5 clips. Weak, watermarked' },
    { lane: 'veo', col: m26(7), span: 3, r: 'no', when: 'Jul 3', text: '30 shots, a 2:49 cut. Thrown out Aug 7' },
    { lane: 'seed', col: m26(8), span: 3, r: 'no', when: 'Aug 11', text: 'Good. About 5× the price' },
    { lane: 'h3', col: m26(8), span: 3, r: 'yes', when: 'Aug 11', text: 'Winner. 42 shots for $48.60' },
    { lane: 'kling', col: m26(11), span: 2, r: 'yes', when: 'Nov', text: 'Finishing fixes. Start, middle, end frames' },
  ];
  const prod = [
    { from: m26(1), to: m26(2), cls: '', text: 'Spec' },
    { from: m26(2), to: m26(8), cls: 'wait', text: 'Waiting for the tech' },
    { from: m26(8), to: m26(9), cls: '', text: 'Shoot' },
    { from: m26(9), to: m26(10), cls: '', text: 'Alt cuts' },
    { from: m26(10), to: m26(11), cls: '', text: 'Rebuild' },
    { from: m26(11), to: m26(12), cls: '', text: 'Lock' },
    { from: m26(12), to: m26(12) + 1, cls: 'launch', text: 'Launch' },
  ];
  const days = [
    { from: m26(1), to: m26(2), n: '8' }, { from: m26(7), to: m26(8), n: '1' },
    { from: m26(8), to: m26(10), n: '≈13' }, { from: m26(10), to: m26(12), n: '≈8' },
  ];
  const mobile = [
    ['no', 'Mar 27, 2025 · Sora', 'Too early', 'A picnic of knock-off pups. Back in the drawer.'],
    ['no', 'Jan 8, 2026 · Sora', 'Ryder with stubble', 'Twenty minutes later, frame one was made elsewhere.'],
    ['prod', 'Jan 8-25 · Spec', '64 frames in 8 days', 'The film, designed as stills.'],
    ['part', 'Jan 11 · Midjourney', '16 clips', 'A few made the film and set the bar.'],
    ['no', 'Jan 11 · Veo', '5 clips', 'Weak, watermarked.'],
    ['wait', 'Feb to Jul', 'Waiting for the tech', 'Frames ready. No model passes the six constraints.'],
    ['no', 'Jul 3 · Veo / Flow', '30 shots, a 2:49 cut', 'Thrown out Aug 7.'],
    ['no', 'Aug 11 · Seedance 2 and 2.5', 'Good', 'About five times the price.'],
    ['yes', 'Aug 11 · MiniMax H3', 'Winner', '42 shots for $48.60. The shoot runs Aug 11-24.'],
    ['prod', 'Oct 25 - Nov 6 · Rebuild', 'Music first', 'The trailer, re-cut as a trailer.'],
    ['yes', 'Nov · Kling 4.0', 'Finishing fixes', 'Start, middle and end frames.'],
    ['prod', 'Nov 11 · Lock', 'Picture, poster, site live', 'ryderrises.com goes up.'],
    ['prod', 'Dec 1 · Launch', 'Launch day', null],
  ];

  const el = (tag, cls, css, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (css) Object.assign(n.style, css);
    if (text != null) n.textContent = text;
    return n;
  };

  function drawTimeline() {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    tl.replaceChildren();
    tl.append(el('div', 'tl__month', { gridColumn: C.mar25 }, 'Mar'));
    tl.append(el('div', 'tl__month tl__month--gap', { gridColumn: C.gap }, '+9 mo'));
    MONTHS.forEach((mo, i) => tl.append(el('div', 'tl__month', { gridColumn: m26(i + 1) }, mo)));
    tl.append(el('div', 'tl__year', { gridColumn: C.mar25, gridRow: 1, position: 'relative', top: '-24px', alignSelf: 'start' }, '2025'));
    tl.append(el('div', 'tl__year', { gridColumn: m26(1), gridRow: 1, position: 'relative', top: '-24px', alignSelf: 'start' }, '2026'));
    let row = 2;
    tl.append(el('div', 'tl__lane tl__lane--group', { gridRow: row }, 'Video models'));
    row++;
    const laneRow = {};
    lanes.forEach((l) => {
      laneRow[l.id] = row;
      const lab = el('div', 'tl__lane', { gridRow: row }, l.name);
      if (l.sub) lab.append(el('small', null, null, T(l.sub)));
      tl.append(lab, el('div', 'tl__row', { gridRow: row }));
      row++;
    });
    tl.append(el('div', 'tl__bar tl__bar--h3', { gridRow: laneRow.h3, gridColumn: `${m26(8)} / ${m26(12)}` }));
    events.forEach((e) => {
      const ev = el('div', `tl__ev tl__ev--${e.r}${e.lane === 'h3' ? ' tl__ev--h3' : ''}`, { gridRow: laneRow[e.lane], gridColumn: `${e.col} / span ${e.span}` });
      const t = el('div', 'tl__txt');
      t.append(el('b', null, null, T(e.when)), document.createTextNode(T(e.text)));
      ev.append(el('span', 'tl__dot'), t);
      tl.append(ev);
    });
    tl.append(el('div', 'tl__lane tl__lane--group', { gridRow: row, paddingTop: '18px' }, 'Production'));
    row++;
    tl.append(el('div', 'tl__lane', { gridRow: row }, 'Phase'), el('div', 'tl__row', { gridRow: row }));
    prod.forEach((p) => tl.append(el('div', `tl__bar${p.cls ? ' tl__bar--' + p.cls : ''}`, { gridRow: row, gridColumn: `${p.from} / ${p.to}` }, T(p.text))));
    row++;
    tl.append(el('div', 'tl__lane', { gridRow: row }, 'Working days'), el('div', 'tl__row', { gridRow: row }));
    days.forEach((d) => {
      const n = el('div', 'tl__days', { gridRow: row, gridColumn: `${d.from} / ${d.to}` });
      n.append(el('b', null, null, d.n), document.createTextNode(d.n === '1' ? ' day' : ' days'));
      tl.append(n);
    });

    const tlm = document.getElementById('timelineM');
    if (!tlm) return;
    tlm.replaceChildren();
    mobile.forEach(([cls, when, what, note]) => {
      const li = el('li', cls);
      li.append(el('span', 'when', null, T(when)), el('span', 'what', null, T(what)));
      if (note) li.append(el('span', 'note', null, T(note)));
      tlm.append(li);
    });
  }

  drawTimeline();

  // videos load and play only while they are on screen
  const vids = document.querySelectorAll('video.js-inview');
  vids.forEach((v) => v.addEventListener('playing', () => v.classList.add('is-live'), { once: true }));
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    }), { rootMargin: '200px 0px' });
    vids.forEach((v) => vio.observe(v));
  } else vids.forEach((v) => { v.autoplay = true; v.play(); });
  // ---------- buttons: the same Storm Tag plasma as the film's site ----------
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.cta').forEach((btn) => {
    const c = btn.querySelector('.cta__plasma'); if (!c) return;
    const x = c.getContext('2d'), hue = ['201,162,255', '120,60,255'];
    let t = Math.random() * 10, boost = 0, w = 0, h = 0, onScreen = true, looping = false;
    const size = () => { const r = btn.getBoundingClientRect(); w = c.width = Math.max(1, r.width * 2); h = c.height = Math.max(1, r.height * 2); };
    size(); addEventListener('resize', size);
    const paint = () => {
      x.globalCompositeOperation = 'source-over'; x.fillStyle = '#1a0838'; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const px = w * (0.5 + 0.45 * Math.sin(t * (0.6 + i * 0.13) + i * 1.7)), py = h * (0.5 + 0.4 * Math.cos(t * (0.8 + i * 0.11) + i)), r = h * (0.55 + 0.25 * Math.sin(t + i));
        const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${hue[i % 2 ? 0 : 1]},${0.55 + boost * 0.35})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
      }
    };
    const loop = () => {
      if (!onScreen || document.hidden) { looping = false; return; }
      t += 0.016 + boost * 0.05; boost *= 0.94; paint(); requestAnimationFrame(loop);
    };
    const wake = () => { if (reduced) { paint(); return; } if (!looping && onScreen && !document.hidden) { looping = true; requestAnimationFrame(loop); } };
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; wake(); }).observe(btn);
    document.addEventListener('visibilitychange', wake);
    wake();
    btn.addEventListener('pointerenter', () => { boost = Math.min(1, boost + 0.3); });
    btn.addEventListener('click', () => { boost = 1; btn.classList.remove('is-boop'); void btn.offsetWidth; btn.classList.add('is-boop'); });
  });

  // ---------- the close: the title drawn once, then handed to the electricity (as on the film's site) ----------
  const ztitle = document.getElementById('ztitle');
  if (ztitle) document.fonts.load('700 200px "Archivo"').then(() => {
    const cv = document.createElement('canvas'), W = 1800, H = 680, g = cv.getContext('2d'); cv.width = W; cv.height = H;
    g.fillStyle = '#f3eefc'; g.textAlign = 'center'; g.font = '700 extra-condensed 330px "Archivo"';
    g.fillText('SEE IT', W / 2, 330); g.fillText('MOVE.', W / 2, 610);  // lines sit closer than on the film's site (Yoni, 20 Nov)
    const url = cv.toDataURL('image/png'), img = document.getElementById('zimg');
    ztitle.style.setProperty('--m', `url(${url})`);
    img.onload = () => { if (!reduced && typeof Electric !== 'undefined') Electric(document.getElementById('zcan'), img, { pad: 0.14, color: [176, 112, 255], hot: [252, 248, 255], rate: 1.6,
      onStrike() { ztitle.classList.add('is-strike'); setTimeout(() => ztitle.classList.remove('is-strike'), 170); } }); };
    img.src = url;
  });
})();
