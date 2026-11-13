/* RYDER RISES: analytics (Google Analytics 4).
   One switch: paste the Measurement ID into GA_ID. While it is empty, nothing loads and nothing is sent.
   No advertising cookies, no Google Signals, nothing personal in any event.
   Visitors from the EEA, the UK and Switzerland are measured without cookies (consent mode, analytics denied). */
(() => {
  const GA_ID = "G-8V4HG3KMMC"; // "G-XXXXXXXXXX": GA4 › Admin › Data streams › Web › Measurement ID

  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  const OPTED_OUT = navigator.globalPrivacyControl === true; // the visitor's browser asked not to be tracked
  const live = /^G-[A-Z0-9]{6,}$/.test(GA_ID) && !LOCAL && !OPTED_OUT;

  if (live) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    const NO_COOKIES = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH"];
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", region: NO_COOKIES });
    gtag("js", new Date());
    gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  const track = (name, params = {}) => {
    if (live) window.gtag("event", name, params);
    else if (LOCAL) console.debug("[analytics]", name, JSON.stringify(params));
  };

  /* ---------- events the page itself reports: share, email_click, trailer_replay ---------- */
  document.addEventListener("rr:track", e => track(e.detail.name, e.detail.params || {}));

  /* ---------- which sections people actually reach ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      track("section_view", { section: e.target.id });
    }), { rootMargin: "-50% 0px -50% 0px" }); // counts when the section crosses the middle of the screen
    ["trailer", "story", "stills", "poster", "making", "credits", "contact"].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- the trailer: opened from where, and how much of it was really watched ---------- */
  document.querySelectorAll(".js-play").forEach(b => b.addEventListener("click", () =>
    track("trailer_open", { placement: b.closest(".dock") ? "dock" : b.closest(".nav") ? "nav" : b.closest(".hero") ? "hero" : "trailer_section" })));

  const tv = document.getElementById("trailerVideo"), theatre = document.getElementById("theatre");
  if (tv) {
    const TITLE = "Ryder Rises trailer", MARKS = [10, 25, 50, 75, 90];
    let watched = 0, last = null, started = false, hit = 0, reported = 0;
    const dur = () => tv.duration || 118.8;
    const base = () => ({ video_title: TITLE, video_provider: "self", video_duration: Math.round(dur()) });
    tv.addEventListener("play", () => { last = tv.currentTime; if (!started) { started = true; track("video_start", base()); } });
    tv.addEventListener("seeking", () => (last = null));
    tv.addEventListener("timeupdate", () => {
      const t = tv.currentTime;
      if (last !== null && t > last && t - last < 1.5) watched += t - last; // real playback only, scrubbing does not count
      last = tv.paused ? null : t;
      while (hit < MARKS.length && (watched / dur()) * 100 >= MARKS[hit]) track("video_progress", { ...base(), video_percent: MARKS[hit++] });
    });
    tv.addEventListener("ended", () => track("video_complete", base()));
    const report = () => { // once per viewing session: how many seconds were actually watched
      const s = Math.round(watched);
      if (s <= reported) return;
      reported = s;
      track("trailer_close", { seconds_watched: s, video_percent: Math.min(100, Math.round((watched / dur()) * 100)) });
    };
    tv.addEventListener("pause", () => setTimeout(() => { if (theatre && theatre.hidden) report(); }, 0));
    addEventListener("pagehide", report);
  }

  /* ---------- the two things a visitor can take away ---------- */
  document.querySelectorAll("a[download]").forEach(a => a.addEventListener("click", () => track("poster_download", { file_name: a.getAttribute("download") })));
  document.querySelectorAll('.close a.cta[href^="http"]').forEach(a => a.addEventListener("click", () => track("contact_click", { destination: "linkedin" })));
})();
