import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const pathname = window.location.pathname;
const searchParams = new URLSearchParams(window.location.search);
const queryPlayerId = searchParams.get("player");

// Force-clear stale cached app versions (old service workers / caches)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}

// Backward compatibility: old links used /shot-tracker?player=<id>
if (pathname.startsWith("/shot-tracker") && queryPlayerId) {
  window.location.replace(`/player/${queryPlayerId}/shots`);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}

