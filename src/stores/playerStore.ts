import { create } from "zustand";
import { persist } from "zustand/middleware";
import { audioService } from "../services/audioService";
import { resolveSongSrc } from "../services/mediaSourceService";
import type { PlayMode, Song } from "../types/music";
import { clampNumber } from "../utils/safeNumber";
import { useLibraryStore } from "./libraryStore";
import { useUiStore } from "./uiStore";
import { usePlaylistStore } from "./playlistStore";

interface PlayerState {
  currentSong: Song | null;
  playlist: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playMode: PlayMode;
  error: string | null;
  playSong: (songId: string, playlist?: Song[]) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  playNext: (automatic?: boolean) => Promise<void>;
  playPrevious: () => Promise<void>;
  playNextSong: (song: Song) => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;
  removeFromLibrary: (songId: string) => void;
  seekTo: (seconds: number, continuePlaying?: boolean) => Promise<void>;
  setVolume: (volume: number) => void;
  togglePlayMode: () => void;
}

const modes: PlayMode[] = ["sequence", "repeat-one", "shuffle"];

function nextIndex(state: PlayerState, direction: 1 | -1): number {
  const currentIndex = state.playlist.findIndex(
    (song) => song.id === state.currentSong?.id,
  );
  if (state.playMode === "shuffle" && state.playlist.length > 1) {
    let candidate = currentIndex;
    while (candidate === currentIndex) {
      candidate = Math.floor(Math.random() * state.playlist.length);
    }
    return candidate;
  }
  return currentIndex + direction;
}

function reportPlaybackError(message: string): void {
  useUiStore.getState().showToast(message, "error");
}

export const usePlayerStore = create<PlayerState>()(persist((set, get) => ({
  currentSong: null,
  playlist: [],
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playMode: "sequence",
  error: null,
  playSong: async (songId, playlist) => {
    const queue = playlist ?? get().playlist;
    const song =
      queue.find((item) => item.id === songId) ??
      useLibraryStore.getState().songs.find((item) => item.id === songId);
    if (!song) {
      reportPlaybackError("找不到这首歌曲，请重新导入文件。");
      return;
    }

    if (
      get().currentSong?.id === song.id &&
      audioService.isLoaded(song.path)
    ) {
      set({ playlist: queue.length > 0 ? queue : [song] });
      await get().play();
      return;
    }

    const src = await resolveSongSrc(song);
    if (!src) {
      useLibraryStore.getState().updateSong(song.id, { unavailable: true });
      reportPlaybackError("音频文件不可用，请重新导入或检查原始文件。");
      return;
    }
    useLibraryStore.getState().updateSong(song.id, { unavailable: false });
    const playableSong = { ...song, unavailable: false };
    set({
      currentSong: playableSong,
      playlist: queue.length > 0 ? queue : [song],
      currentTime: 0,
      duration: song.duration > 0 ? song.duration : 0,
      isLoading: true,
      error: null,
    });
    audioService.load(src, song.path);
    audioService.setVolume(get().volume);
    try {
      await audioService.play();
    } catch {
      const error = "播放失败，请检查音频文件是否仍然可访问。";
      set({ error, isLoading: false });
      reportPlaybackError(error);
    }
  },
  play: async () => {
    const currentSong = get().currentSong;
    if (!currentSong) return;
    if (!audioService.isLoaded(currentSong.path)) {
      const src = await resolveSongSrc(currentSong);
      if (!src) {
        useLibraryStore.getState().updateSong(currentSong.id, { unavailable: true });
        reportPlaybackError("音频文件不可用，请重新导入或检查原始文件。");
        return;
      }
      audioService.load(src, currentSong.path);
      const savedTime = get().currentTime;
      if (savedTime > 0) audioService.seekTo(savedTime, get().duration);
    }
    audioService.setVolume(get().volume);
    try {
      await audioService.play();
    } catch {
      const error = "播放失败，请检查音频文件是否仍然可访问。";
      set({ error });
      reportPlaybackError(error);
    }
  },
  pause: () => {
    const currentTime = audioService.getCurrentTime();
    audioService.pause();
    set({ currentTime });
  },
  togglePlay: async () => {
    if (get().isPlaying) get().pause();
    else await get().play();
  },
  playNext: async (automatic = false) => {
    const state = get();
    if (!state.currentSong || state.playlist.length === 0) return;
    if (automatic && state.playMode === "repeat-one") {
      await get().seekTo(0, true);
      return;
    }
    let index = nextIndex(state, 1);
    if (index >= state.playlist.length) {
      audioService.pause();
      set({ isPlaying: false, currentTime: state.duration });
      return;
    }
    await get().playSong(state.playlist[index].id, state.playlist);
  },
  playPrevious: async () => {
    if (get().currentTime > 3) {
      await get().seekTo(0);
      return;
    }
    const state = get();
    let index = nextIndex(state, -1);
    if (index < 0) index = 0;
    const song = state.playlist[index];
    if (song) await get().playSong(song.id, state.playlist);
  },
  playNextSong: (song) =>
    set((state) => {
      const queue = state.playlist.filter((item) => item.id !== song.id);
      const currentIndex = Math.max(
        0,
        queue.findIndex((item) => item.id === state.currentSong?.id),
      );
      queue.splice(currentIndex + 1, 0, song);
      return { playlist: queue };
    }),
  addToQueue: (song) =>
    set((state) => ({
      playlist: state.playlist.some((item) => item.id === song.id)
        ? state.playlist
        : [...state.playlist, song],
    })),
  clearQueue: () => {
    audioService.unload();
    set({
      currentSong: null,
      playlist: [],
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
    });
  },
  removeFromLibrary: (songId) => {
    const removingCurrent = get().currentSong?.id === songId;
    if (removingCurrent) audioService.unload();
    useLibraryStore.getState().removeSong(songId);
    for (const playlist of usePlaylistStore.getState().playlists) {
      if (playlist.songIds.includes(songId)) {
        usePlaylistStore.getState().removeSongFromPlaylist(playlist.id, songId);
      }
    }
    set((state) => ({
      currentSong: removingCurrent ? null : state.currentSong,
      playlist: state.playlist.filter((song) => song.id !== songId),
      isPlaying: removingCurrent ? false : state.isPlaying,
      isLoading: removingCurrent ? false : state.isLoading,
      currentTime: removingCurrent ? 0 : state.currentTime,
      duration: removingCurrent ? 0 : state.duration,
      error: removingCurrent ? null : state.error,
    }));
  },
  seekTo: async (seconds, continuePlaying = false) => {
    const duration = get().duration;
    if (
      typeof seconds !== "number" ||
      Number.isNaN(seconds) ||
      seconds < 0 ||
      (duration > 0 && seconds > duration)
    ) return;
    const applied = audioService.seekTo(seconds, duration);
    if (applied === null) return;
    set({ currentTime: applied });
    if (continuePlaying) await get().play();
  },
  setVolume: (volume) => {
    const safeVolume = clampNumber(volume, 0, 1, 0.8);
    audioService.setVolume(safeVolume);
    set({ volume: safeVolume });
  },
  togglePlayMode: () => {
    const current = get().playMode;
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    set({ playMode: next });
    useUiStore.getState().showToast({
      sequence: "已切换到顺序播放",
      "repeat-one": "已切换到单曲循环",
      shuffle: "已切换到随机播放",
    }[next], "success");
  },
}), {
  name: "inkbox-player",
  version: 3,
  migrate: (persisted) => {
    const state = persisted as Partial<PlayerState>;
    const isStable = (song: Song | null | undefined) =>
      !!song && (song.sourceType === "tauri" || song.path.startsWith("browser-audio://"));
    return {
      ...state,
      playMode:
        state.playMode === "repeat-one" || state.playMode === "shuffle"
          ? state.playMode
          : "sequence",
      currentSong: isStable(state.currentSong) ? state.currentSong : null,
      playlist: (state.playlist ?? []).filter(isStable),
    } as PlayerState;
  },
  partialize: (state) => ({
    currentSong: state.currentSong,
    playlist: state.playlist,
    volume: state.volume,
    playMode: state.playMode,
  }),
  onRehydrateStorage: () => (state) => {
    if (state) audioService.setVolume(state.volume);
  },
}));

audioService.connect({
  onTimeUpdate: (currentTime) => usePlayerStore.setState({ currentTime }),
  onDurationChange: (duration) => {
    const currentSong = usePlayerStore.getState().currentSong;
    if (!currentSong || duration <= 0) {
      usePlayerStore.setState({ duration });
      return;
    }
    const updatedSong = { ...currentSong, duration };
    usePlayerStore.setState((state) => ({
      duration,
      currentSong: updatedSong,
      playlist: state.playlist.map((song) =>
        song.id === updatedSong.id ? updatedSong : song,
      ),
    }));
    useLibraryStore.getState().updateSong(updatedSong.id, { duration });
  },
  onPlayChange: (isPlaying) =>
    usePlayerStore.setState({ isPlaying, isLoading: false }),
  onEnded: () => void usePlayerStore.getState().playNext(true),
  onError: (error) => {
    usePlayerStore.setState({ error, isPlaying: false, isLoading: false });
    reportPlaybackError(error);
  },
});
