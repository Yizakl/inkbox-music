import {
  FileImage,
  FileMusic,
  FolderOpen,
  Heart,
  Info,
  ListEnd,
  ListMusic,
  ListPlus,
  MoreHorizontal,
  Palette,
  Pause,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { chooseCoverImage } from "../services/coverService";
import { chooseLyricFile, readLyrics } from "../services/lyricService";
import { revealSong } from "../services/systemService";
import { useLibraryStore } from "../stores/libraryStore";
import { usePlayerStore } from "../stores/playerStore";
import { useUiStore } from "../stores/uiStore";
import type { GradientCover, Song } from "../types/music";
import { defaultGradientFor } from "../utils/gradientCover";
import { formatTime } from "../utils/formatTime";
import { CoverArt } from "./CoverArt";
import { ConfirmDialog } from "./ConfirmDialog";
import { GradientCoverModal } from "./GradientCoverModal";
import { SongInfoModal } from "./SongInfoModal";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { usePlaylistStore } from "../stores/playlistStore";

interface SongListProps {
  songs: Song[];
  playlistId?: string;
}

export function SongList({ songs, playlistId }: SongListProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNextSong = usePlayerStore((state) => state.playNextSong);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const updateSong = useLibraryStore((state) => state.updateSong);
  const removeFromLibrary = usePlayerStore((state) => state.removeFromLibrary);
  const removeSongFromPlaylist = usePlaylistStore((state) => state.removeSongFromPlaylist);
  const selectedSongId = useUiStore((state) => state.selectedSongId);
  const setSelectedSongId = useUiStore((state) => state.setSelectedSongId);
  const showToast = useUiStore((state) => state.showToast);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [menuSongId, setMenuSongId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [infoSong, setInfoSong] = useState<Song | null>(null);
  const [gradientSong, setGradientSong] = useState<Song | null>(null);
  const [gradientDraft, setGradientDraft] = useState<GradientCover | null>(null);
  const [removeCandidate, setRemoveCandidate] = useState<Song | null>(null);
  const [playlistCandidate, setPlaylistCandidate] = useState<Song | null>(null);
  const [removePlaylistCandidate, setRemovePlaylistCandidate] = useState<Song | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const activeMenuSong = songs.find((song) => song.id === menuSongId);

  useEffect(() => {
    if (!menuSongId) return;
    const closeMenu = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        (target.closest(".song-menu") || target.closest(".song-row__more"))
      ) return;
      setMenuSongId(null);
    };
    const closeOnKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMenuSongId(null);
    };
    const close = () => setMenuSongId(null);
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menuSongId]);

  function updateEverywhere(song: Song, changes: Partial<Song>) {
    updateSong(song.id, changes);
    usePlayerStore.setState((state) => ({
      currentSong:
        state.currentSong?.id === song.id
          ? { ...state.currentSong, ...changes }
          : state.currentSong,
      playlist: state.playlist.map((item) =>
        item.id === song.id ? { ...item, ...changes } : item,
      ),
    }));
  }

  function selectAt(index: number) {
    const target = songs[Math.max(0, Math.min(songs.length - 1, index))];
    if (!target) return;
    setSelectedSongId(target.id);
    rowRefs.current.get(target.id)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent, index: number, song: Song) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      selectAt(index + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      void startSong(song.id);
    } else if (event.key === " ") {
      event.preventDefault();
      void togglePlay();
    } else if (event.key === "Escape") {
      setMenuSongId(null);
    }
  }

  async function startSong(songId: string) {
    setLaunchingId(songId);
    setMenuSongId(null);
    await playSong(songId, songs);
    window.setTimeout(() => setLaunchingId(null), 420);
  }

  function openMenu(event: MouseEvent<HTMLButtonElement>, songId: string) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const menuHeight = 445;
    const margin = 8;
    const left = Math.min(
      Math.max(margin, rect.right - menuWidth),
      window.innerWidth - menuWidth - margin,
    );
    const top =
      rect.bottom + 6 + menuHeight <= window.innerHeight
        ? rect.bottom + 6
        : Math.max(margin, rect.top - menuHeight - 6);
    setMenuPosition({ left, top });
    setMenuSongId((current) => current === songId ? null : songId);
  }

  async function importLyrics(song: Song) {
    const path = await chooseLyricFile();
    if (!path) return;
    const parsed = await readLyrics(path);
    if (parsed.lines.length === 0) {
      showToast("没有匹配到有效的 LRC 时间行", "error");
      return;
    }
    updateEverywhere(song, { lyricPath: path });
    showToast("歌词导入成功", "success");
    setMenuSongId(null);
  }

  async function changeCover(song: Song) {
    const customCover = await chooseCoverImage();
    if (!customCover) return;
    updateEverywhere(song, { customCover, coverMode: "auto" });
    showToast("封面已更新", "success");
    setMenuSongId(null);
  }

  async function reveal(song: Song) {
    if (await revealSong(song.path)) showToast("已在资源管理器中定位", "success");
    else showToast("浏览器预览无法打开资源管理器", "info");
    setMenuSongId(null);
  }

  function confirmRemoveSong() {
    if (!removeCandidate) return;
    removeFromLibrary(removeCandidate.id);
    if (selectedSongId === removeCandidate.id) setSelectedSongId(null);
    setRemoveCandidate(null);
    showToast("已从音乐库移除，本地文件未删除", "success");
  }

  return (
    <>
      <div className="song-table" role="grid" aria-label="歌曲列表">
        <div className="song-table__head" role="row">
          <span>歌曲</span><span>专辑</span><span>时长</span><span />
        </div>
        {songs.map((song, index) => {
          const playing = currentSong?.id === song.id;
          const selected = selectedSongId === song.id;
          return (
            <div
              className={[
                "song-row",
                playing ? "is-playing" : "",
                selected ? "is-selected" : "",
                song.unavailable ? "is-unavailable" : "",
                launchingId === song.id ? "is-launching" : "",
              ].filter(Boolean).join(" ")}
              key={song.id}
              ref={(element) => {
                if (element) rowRefs.current.set(song.id, element);
                else rowRefs.current.delete(song.id);
              }}
              tabIndex={0}
              onClick={() => setSelectedSongId(song.id)}
              onDoubleClick={() => void startSong(song.id)}
              onKeyDown={(event) => handleKeyDown(event, index, song)}
              role="row"
              aria-selected={selected}
            >
              <span className="song-row__identity">
                <span className="song-row__status">
                  {playing && isPlaying ? (
                    <span className="playing-bars" aria-label="正在播放"><i /><i /><i /></span>
                  ) : (
                    <><span className="song-row__index">{index + 1}</span>{playing && !isPlaying ? <Pause /> : <Play />}</>
                  )}
                </span>
                <CoverArt song={song} />
                <span className="song-row__text">
                  <strong>{song.title}</strong>
                  <small>{song.unavailable ? "文件不可用" : song.artist}</small>
                </span>
              </span>
              <span className="song-row__album">{song.album}</span>
              <span>{formatTime(song.duration)}</span>
              <span className="song-row__menu-wrap">
                <button className="song-row__more" title="更多操作" onClick={(event) => openMenu(event, song.id)}>
                  <MoreHorizontal />
                </button>
              </span>
            </div>
          );
        })}
      </div>
      {activeMenuSong && createPortal(
        <div
          className="song-menu"
          style={{ left: menuPosition.left, top: menuPosition.top }}
          onClick={(event) => event.stopPropagation()}
        >
          <button onClick={() => void startSong(activeMenuSong.id)}><Play />播放</button>
          <button onClick={() => { playNextSong(activeMenuSong); setMenuSongId(null); showToast("已设为下一首播放", "success"); }}><ListEnd />下一首播放</button>
          <button onClick={() => { addToQueue(activeMenuSong); setMenuSongId(null); showToast("已添加到队列", "success"); }}><ListPlus />添加到队列</button>
          <button onClick={() => { updateEverywhere(activeMenuSong, { liked: !activeMenuSong.liked }); setMenuSongId(null); }}><Heart fill={activeMenuSong.liked ? "currentColor" : "none"} />{activeMenuSong.liked ? "取消喜欢" : "喜欢"}</button>
          <button onClick={() => { setPlaylistCandidate(activeMenuSong); setMenuSongId(null); }}><ListMusic />添加到歌单</button>
          {playlistId && <button className="is-danger" onClick={() => { setRemovePlaylistCandidate(activeMenuSong); setMenuSongId(null); }}><Trash2 />从当前歌单移除</button>}
          <hr />
          <button onClick={() => void importLyrics(activeMenuSong)}><FileMusic />导入歌词</button>
          <button onClick={() => void changeCover(activeMenuSong)}><FileImage />更换封面</button>
          <button onClick={() => { updateEverywhere(activeMenuSong, { coverMode: "gradient" }); setMenuSongId(null); }}><Sparkles />使用渐变封面</button>
          <button onClick={() => { setGradientSong(activeMenuSong); setGradientDraft(activeMenuSong.gradientCover ?? defaultGradientFor(activeMenuSong)); setMenuSongId(null); }}><Palette />编辑渐变封面</button>
          <button onClick={() => { setInfoSong(activeMenuSong); setMenuSongId(null); }}><Info />查看歌曲信息</button>
          <button onClick={() => void reveal(activeMenuSong)}><FolderOpen />在资源管理器中显示</button>
          <hr />
          <button className="is-danger" onClick={() => {
            setRemoveCandidate(activeMenuSong);
            setMenuSongId(null);
          }}><Trash2 />从音乐库移除</button>
        </div>,
        document.body,
      )}
      {infoSong && <SongInfoModal song={infoSong} onClose={() => setInfoSong(null)} />}
      {playlistCandidate && <AddToPlaylistModal song={playlistCandidate} onClose={() => setPlaylistCandidate(null)} />}
      {gradientSong && gradientDraft && (
        <GradientCoverModal
          song={gradientSong}
          value={gradientDraft}
          onChange={setGradientDraft}
          onClose={() => setGradientSong(null)}
          onSave={() => {
            updateEverywhere(gradientSong, { gradientCover: gradientDraft, coverMode: "gradient" });
            setGradientSong(null);
            showToast("渐变封面已保存", "success");
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(removeCandidate)}
        title="确认从音乐库移除？"
        description="这不会删除本地文件，只会从播放器音乐库中移除。"
        confirmLabel="确认移除"
        onCancel={() => setRemoveCandidate(null)}
        onConfirm={confirmRemoveSong}
      />
      <ConfirmDialog
        open={Boolean(removePlaylistCandidate)}
        title="确认从歌单移除？"
        description="歌曲仍会保留在音乐库中，也不会影响本地文件。"
        confirmLabel="确认移除"
        onCancel={() => setRemovePlaylistCandidate(null)}
        onConfirm={() => {
          if (playlistId && removePlaylistCandidate) {
            removeSongFromPlaylist(playlistId, removePlaylistCandidate.id);
            showToast("已从歌单移除", "success");
          }
          setRemovePlaylistCandidate(null);
        }}
      />
    </>
  );
}
