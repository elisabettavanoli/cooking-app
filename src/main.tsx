import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";

import "./styles/tokens.css";
import "./styles/global.css";

import { App } from "./App";
import { primeCache } from "./lib/category";

// Load the learned product→category cache so the Add sheet can fill the category
// synchronously on the first keystroke.
void primeCache();

// App feel: iOS Safari still honours pinch-zoom gestures even with
// `user-scalable=no` / `touch-action`. Cancel the gesture events it fires so the
// PWA can't be zoomed like a web page.
for (const evt of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
}

const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
