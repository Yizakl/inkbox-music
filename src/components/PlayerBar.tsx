import {
  ListRestart,
  Mic2,
  Pause,
  Play,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  PanelTopOpen,
} from "lucide-react";
import { useState, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../stores/playerStore";
import { formatTime } from "../utils/formatTime";
import { CoverArt } from "./CoverArt";
import { useDesktopLyricsStore } from "../stores/desktopLyricsStore";

const modeIcons = {
  sequence: ListRestart,
  "repeat-one": Repeat1,
  shuffle: Shuffle,
};

const modeLabels = {
  sequence: "顺序播放",
  "repeat-one": "单曲循环",
  shuffle: "随机播放",
};

export function PlayerBar() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const desktopLyrics = useDesktopLyricsStore();
  const ModeIcon = modeIcons[player.playMode];
  const shownTime = scrubTime ?? player.currentTime;
  const progress = player.duration ? (shownTime / player.duration) * 100 : 0;

  function commitSeek(event: PointerEvent<HTMLInputElement>) {
    const seconds = Number(event.currentTarget.value);
    setScrubTime(null);
    void player.seekTo(seconds);
  }

  return (
    <footer className="player-bar">
      <button
        className="player-bar__song"
        onClick={() => player.currentSong && navigate("/now-playing")}
        disabled={!player.currentSong}
      >
        {player.currentSong ? (
          <>
            <CoverArt song={player.currentSong} />
            <span>
              <strong>{player.currentSong.title}</strong>
              <small>{player.currentSong.artist}</small>
            </span>
          </>
        ) : (
          <span className="player-bar__placeholder">双击一首本地歌曲开始播放</span>
        )}
      </button>

      <div className="player-bar__center">
        <div className="transport">
          <button className="icon-button" title="上一首" onClick={() => void player.playPrevious()}>
            <SkipBack />
          </button>
          <button
            className={`play-button ${player.isLoading ? "is-loading" : ""}`}
            title={player.isPlaying ? "暂停" : "播放"}
            onClick={() => void player.togglePlay()}
            disabled={!player.currentSong || player.isLoading}
          >
            {player.isPlaying ? <Pause /> : <Play />}
          </button>
          <button className="icon-button" title="下一首" onClick={() => void player.playNext()}>
            <SkipForward />
          </button>
        </div>
        <div className="timeline">
          <span>{formatTime(shownTime)}</span>
          <input
            aria-label="播放进度"
            type="range"
            min="0"
            max={player.duration || 0}
            step="0.1"
            value={Math.min(shownTime, player.duration || 0)}
            onChange={(event) => setScrubTime(Number(event.target.value))}
            onPointerUp={commitSeek}
            onKeyUp={(event) => void player.seekTo(Number(event.currentTarget.value))}
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
          />
          <span>{formatTime(player.duration)}</span>
        </div>
      </div>

      <div className="player-bar__tools">
        <button
          className={`icon-button ${desktopLyrics.enabled ? "is-accent" : ""}`}
          title={desktopLyrics.enabled ? "关闭桌面歌词" : "打开桌面歌词"}
          onClick={() => void desktopLyrics.setEnabled(!desktopLyrics.enabled)}
        >
          <PanelTopOpen />
        </button>
        <button
          className={`icon-button ${player.playMode !== "sequence" ? "is-accent" : ""}`}
          title={modeLabels[player.playMode]}
          aria-label={modeLabels[player.playMode]}
          onClick={player.togglePlayMode}
        >
          <ModeIcon />
        </button>
        <button
          className="icon-button"
          title="歌词页"
          onClick={() => navigate("/now-playing")}
          disabled={!player.currentSong}
        >
          <Mic2 />
        </button>
        <div className="volume">
          {player.volume < 0.5 ? <Volume1 /> : <Volume2 />}
          <input
            aria-label="音量"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={player.volume}
            onChange={(event) => player.setVolume(Number(event.target.value))}
            style={{ "--progress": `${player.volume * 100}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </footer>
  );
}
