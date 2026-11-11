/* Runs before the first paint. A visitor who already sat through the green band in this tab goes straight to the film. */
try { if (sessionStorage.getItem("rr-band") === "1") document.documentElement.classList.add("is-return"); } catch (e) {}
