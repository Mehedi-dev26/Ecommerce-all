import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Auto-recover from stale lazy-chunk hashes after a new deploy.
// When the browser tries to fetch an old chunk that no longer exists,
// force a one-time reload so it picks up the new index.html + hashes.
const RELOAD_FLAG = "__lov_chunk_reloaded__";
const isChunkLoadError = (msg?: string) =>
  !!msg &&
  (msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module"));

const tryReload = () => {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
    window.location.reload();
  } catch {
    window.location.reload();
  }
};

window.addEventListener("error", (e) => {
  if (isChunkLoadError(e?.message)) tryReload();
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e?.reason && (e.reason.message || String(e.reason))) || "";
  if (isChunkLoadError(msg)) tryReload();
});
// Clear the guard once the new build loads cleanly
window.addEventListener("load", () => {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* noop */
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Register a minimal service worker so the browser shows the PWA install prompt.
// Skip registration inside iframes and on Lovable preview hosts to avoid
// interfering with the in-editor preview.
(function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isInIframe || isPreviewHost) {
    // Make sure no stale SW is left over in preview contexts
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore — install button has fallback messaging */
    });
  });
})();
