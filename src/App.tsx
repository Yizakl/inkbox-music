import { isTauri } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { PlayerBar } from "./components/PlayerBar";
import { Sidebar } from "./components/Sidebar";
import { ToastViewport } from "./components/Toast";
import { LibraryPage } from "./pages/LibraryPage";
import { NowPlayingPage } from "./pages/NowPlayingPage";
import { PlaylistsPage } from "./pages/PlaylistsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AboutPage } from "./pages/AboutPage";
import { FavoritePage } from "./pages/FavoritePage";
import { QueuePage } from "./pages/QueuePage";
import { refreshSongMetadata } from "./services/metadataService";
import { installBundledExampleSong } from "./services/exampleSongService";
import { useLibraryStore } from "./stores/libraryStore";
import { usePlayerStore } from "./stores/playerStore";
import { DesktopLyricsBridge } from "./components/DesktopLyricsBridge";
import "./stores/themeStore";

let metadataRepairStarted = false;

export default function App() {
  useEffect(() => {
    if (!isTauri() || metadataRepairStarted) return;
    metadataRepairStarted = true;

    void (async () => {
      try {
        await installBundledExampleSong();
      } catch {
        // A missing example resource must not prevent the app from starting.
      }

      const candidates = useLibraryStore.getState().songs.filter(
        (song) =>
          song.sourceType === "tauri" &&
          (song.metadataResolved !== true || !(song.duration > 0)),
      );

      for (const song of candidates) {
        let changes;
        try {
          changes = await refreshSongMetadata(song);
        } catch {
          continue;
        }
        if (Object.keys(changes).length === 0) continue;
        useLibraryStore.getState().updateSong(song.id, changes);
        usePlayerStore.setState((state) => ({
          currentSong:
            state.currentSong?.id === song.id
              ? { ...state.currentSong, ...changes }
              : state.currentSong,
          duration:
            state.currentSong?.id === song.id && Number(changes.duration) > 0
              ? Number(changes.duration)
              : state.duration,
          playlist: state.playlist.map((item) =>
            item.id === song.id ? { ...item, ...changes } : item,
          ),
        }));
      }
    })();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/now-playing" element={<NowPlayingPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/favorites" element={<FavoritePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
      <PlayerBar />
      <ToastViewport />
      <DesktopLyricsBridge />
    </div>
  );
}
