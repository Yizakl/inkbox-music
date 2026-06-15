import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { GripHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DesktopLyricsPayload } from "../components/DesktopLyricsBridge";
import "../stores/themeStore";

const emptyState: DesktopLyricsPayload = {
  title: "INKBOX Music",
  artist: "",
  current: "暂无歌词",
  next: "",
  isPlaying: false,
};

export function DesktopLyricsWindow() {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    document.documentElement.classList.add("desktop-lyrics-root");
    let disposeLyrics: (() => void) | undefined;
    let disposeResize: (() => void) | undefined;
    let resizeTimer: number | undefined;
    const currentWindow = getCurrentWindow();
    void listen<DesktopLyricsPayload>("desktop-lyrics-state", (event) => setState(event.payload))
      .then((unlisten) => {
        disposeLyrics = unlisten;
        void emit("desktop-lyrics-ready");
      });
    void currentWindow.onResized((event) => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        void currentWindow.scaleFactor().then((scaleFactor) =>
          emit("desktop-lyrics-resized", {
            width: event.payload.width / scaleFactor,
            height: event.payload.height / scaleFactor,
          })
        );
      }, 180);
    }).then((unlisten) => { disposeResize = unlisten; });
    return () => {
      document.documentElement.classList.remove("desktop-lyrics-root");
      window.clearTimeout(resizeTimer);
      disposeLyrics?.();
      disposeResize?.();
    };
  }, []);

  async function close() {
    await emit("desktop-lyrics-closed");
    await getCurrentWindow().close();
  }

  return <main className={`desktop-lyrics-window ${state.isPlaying ? "is-playing" : ""}`}>
    <button className="desktop-lyrics__drag" title="拖动窗口" onMouseDown={() => void getCurrentWindow().startDragging()}><GripHorizontal /></button>
    <div className="desktop-lyrics__content">
      <div className="desktop-lyrics__meta"><strong>{state.title}</strong>{state.artist && <span>{state.artist}</span>}</div>
      <p>{state.current}</p>
      <small>{state.next}</small>
    </div>
    <button className="desktop-lyrics__close" title="关闭桌面歌词" onClick={() => void close()}><X /></button>
  </main>;
}
