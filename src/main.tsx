import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const ensureLatestFrontendVersion = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.update();

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  } catch {
    // silent: should never block app rendering
  }
};

ensureLatestFrontendVersion();

createRoot(document.getElementById("root")!).render(<App />);

