import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "black" | "system";
export type AccentColor = "blue-violet" | "pink-violet" | "cyan" | "orange-red" | "green";
export type VisualizerMode = "spectrum" | "waveform";

interface ThemeState {
  mode: ThemeMode;
  accent: AccentColor;
  glass: boolean;
  coverBlur: boolean;
  reduceMotion: boolean;
  visualizerEnabled: boolean;
  visualizerMode: VisualizerMode;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setGlass: (glass: boolean) => void;
  setCoverBlur: (coverBlur: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setVisualizerEnabled: (visualizerEnabled: boolean) => void;
  setVisualizerMode: (visualizerMode: VisualizerMode) => void;
}

function applyTheme(state: Pick<ThemeState, "mode" | "accent" | "glass" | "coverBlur" | "reduceMotion">) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme =
    state.mode === "system" ? (systemDark ? "dark" : "light") : state.mode;
  document.documentElement.dataset.themeMode = state.mode;
  document.documentElement.dataset.accent = state.accent;
  document.documentElement.dataset.glass = String(state.glass);
  document.documentElement.dataset.coverBlur = String(state.coverBlur);
  document.documentElement.dataset.reduceMotion = String(state.reduceMotion);
}

export const useThemeStore = create<ThemeState>()(persist((set, get) => ({
  mode: "dark",
  accent: "pink-violet",
  glass: true,
  coverBlur: true,
  reduceMotion: false,
  visualizerEnabled: true,
  visualizerMode: "spectrum",
  setMode: (mode) => set({ mode }),
  setAccent: (accent) => set({ accent }),
  setGlass: (glass) => set({ glass }),
  setCoverBlur: (coverBlur) => set({ coverBlur }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setVisualizerEnabled: (visualizerEnabled) => set({ visualizerEnabled }),
  setVisualizerMode: (visualizerMode) => set({ visualizerMode }),
}), {
  name: "inkbox-theme",
  version: 1,
  onRehydrateStorage: () => (state) => {
    if (state) applyTheme(state);
  },
}));

useThemeStore.subscribe((state) => applyTheme(state));
applyTheme(useThemeStore.getState());
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const state = useThemeStore.getState();
  if (state.mode === "system") applyTheme(state);
});
