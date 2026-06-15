import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@applemusic-like-lyrics/core/style.css";
import "./styles.css";
import App from "./App";
import { DesktopLyricsWindow } from "./pages/DesktopLyricsWindow";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {window.location.hash.startsWith("#/desktop-lyrics") ? (
      <DesktopLyricsWindow />
    ) : (
      <HashRouter><App /></HashRouter>
    )}
  </React.StrictMode>,
);
