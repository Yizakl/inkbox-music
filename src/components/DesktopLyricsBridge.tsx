import { isTauri } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState } from "react";
import { readLyrics } from "../services/lyricService";
import { usePlayerStore } from "../stores/playerStore";
import type { LyricLine } from "../types/lyric";

export interface DesktopLyricsPayload {
  title: string;
  artist: string;
  current: string;
  next: string;
  isPlaying: boolean;
}

export function DesktopLyricsBridge() {
  const song = usePlayerStore((state) => state.currentSong);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!isTauri()) return;
    let dispose: (() => void) | undefined;
    void listen("desktop-lyrics-ready", () => setRequestVersion((value) => value + 1))
      .then((unlisten) => { dispose = unlisten; });
    return () => dispose?.();
  }, []);

  useEffect(() => {
    setLines([]);
    if (!song?.lyricPath) return;
    void readLyrics(song.lyricPath).then((result) => setLines(result.lines)).catch(() => setLines([]));
  }, [song?.id, song?.lyricPath]);

  const activeIndex = useMemo(() => {
    let index = -1;
    for (let cursor = 0; cursor < lines.length; cursor += 1) {
      if (lines[cursor].startTime > currentTime) break;
      index = cursor;
    }
    return index;
  }, [currentTime, lines]);

  useEffect(() => {
    if (!isTauri()) return;
    void emitTo("desktop-lyrics", "desktop-lyrics-state", {
      title: song?.title ?? "INKBOX Music",
      artist: song?.artist ?? "",
      current: lines[activeIndex]?.text ?? "暂无歌词",
      next: lines[activeIndex + 1]?.text ?? "",
      isPlaying,
    } satisfies DesktopLyricsPayload);
  }, [activeIndex, isPlaying, lines, requestVersion, song?.artist, song?.title]);

  return null;
}
