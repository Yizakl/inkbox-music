import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useLibraryStore } from "./libraryStore";

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  getPlaylistSongs: (playlistId: string) => ReturnType<typeof useLibraryStore.getState>["songs"];
}

export const usePlaylistStore = create<PlaylistState>()(persist((set, get) => ({
  playlists: [],
  createPlaylist: (name) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    set((state) => ({
      playlists: [...state.playlists, {
        id,
        name: name.trim() || "未命名歌单",
        songIds: [],
        createdAt: now,
        updatedAt: now,
      }],
    }));
    return id;
  },
  renamePlaylist: (id, name) =>
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === id
          ? { ...playlist, name: name.trim() || playlist.name, updatedAt: Date.now() }
          : playlist
      ),
    })),
  deletePlaylist: (id) =>
    set((state) => ({
      playlists: state.playlists.filter((playlist) => playlist.id !== id),
    })),
  addSongToPlaylist: (playlistId, songId) =>
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId && !playlist.songIds.includes(songId)
          ? { ...playlist, songIds: [...playlist.songIds, songId], updatedAt: Date.now() }
          : playlist
      ),
    })),
  removeSongFromPlaylist: (playlistId, songId) =>
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              songIds: playlist.songIds.filter((id) => id !== songId),
              updatedAt: Date.now(),
            }
          : playlist
      ),
    })),
  getPlaylistSongs: (playlistId) => {
    const playlist = get().playlists.find((item) => item.id === playlistId);
    if (!playlist) return [];
    const songs = useLibraryStore.getState().songs;
    return playlist.songIds
      .map((id) => songs.find((song) => song.id === id))
      .filter((song): song is NonNullable<typeof song> => Boolean(song));
  },
}), {
  name: "inkbox-playlists",
  version: 1,
  partialize: (state) => ({ playlists: state.playlists }),
}));
