import { isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DesktopLyricsState {
  enabled: boolean;
  width: number;
  height: number;
  setEnabled: (enabled: boolean) => Promise<void>;
  setSize: (width: number, height: number) => void;
}

async function openWindow() {
  const existing = await WebviewWindow.getByLabel("desktop-lyrics");
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }
  new WebviewWindow("desktop-lyrics", {
    url: "index.html#/desktop-lyrics",
    title: "INKBOX Desktop Lyrics",
    width: useDesktopLyricsStore.getState().width,
    height: useDesktopLyricsStore.getState().height,
    minWidth: 360,
    minHeight: 80,
    decorations: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    center: true,
  });
}

export const useDesktopLyricsStore = create<DesktopLyricsState>()(persist((set) => ({
  enabled: false,
  width: 520,
  height: 120,
  setEnabled: async (enabled) => {
    if (!isTauri()) return;
    if (enabled) await openWindow();
    else await (await WebviewWindow.getByLabel("desktop-lyrics"))?.close();
    set({ enabled });
  },
  setSize: (width, height) => set({
    width: Math.max(360, Math.round(width)),
    height: Math.max(80, Math.round(height)),
  }),
}), {
  name: "inkbox-desktop-lyrics",
  version: 2,
  migrate: (persisted) => {
    const state = persisted as Partial<DesktopLyricsState>;
    return {
      ...state,
      enabled: state.enabled ?? false,
      width: state.width ?? 520,
      height: state.height ?? 120,
    } as DesktopLyricsState;
  },
  partialize: (state) => ({
    enabled: state.enabled,
    width: state.width,
    height: state.height,
  }),
  onRehydrateStorage: () => (state) => {
    if (state?.enabled && isTauri()) void openWindow();
  },
}));

if (isTauri()) {
  void listen("desktop-lyrics-closed", () => {
    useDesktopLyricsStore.setState({ enabled: false });
  });
  void listen<{ width: number; height: number }>("desktop-lyrics-resized", (event) => {
    useDesktopLyricsStore.getState().setSize(event.payload.width, event.payload.height);
  });
}
