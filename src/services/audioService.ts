export interface AudioEvents {
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayChange: (isPlaying: boolean) => void;
  onEnded: () => void;
  onError: (message: string) => void;
}

class AudioService {
  private readonly audio = new Audio();
  private events?: AudioEvents;
  private loadedSrc = "";
  private loadedKey = "";

  constructor() {
    this.audio.preload = "metadata";
    this.audio.addEventListener("timeupdate", () =>
      this.events?.onTimeUpdate(this.audio.currentTime),
    );
    this.audio.addEventListener("durationchange", () =>
      this.events?.onDurationChange(
        Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
      ),
    );
    this.audio.addEventListener("play", () => this.events?.onPlayChange(true));
    this.audio.addEventListener("pause", () => this.events?.onPlayChange(false));
    this.audio.addEventListener("ended", () => this.events?.onEnded());
    this.audio.addEventListener("error", () =>
      this.events?.onError("无法播放这个文件，请检查文件格式或访问权限。"),
    );
  }

  connect(events: AudioEvents): void {
    this.events = events;
  }

  load(src: string, sourceKey: string): void {
    if (sourceKey === this.loadedKey && this.audio.src) return;
    this.loadedSrc = src;
    this.loadedKey = sourceKey;
    this.audio.src = src;
    this.audio.load();
  }

  isLoaded(sourceKey: string): boolean {
    return this.loadedKey === sourceKey && Boolean(this.audio.src);
  }

  getCurrentTime(): number {
    return Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0;
  }

  getMediaElement(): HTMLAudioElement {
    return this.audio;
  }

  async play(): Promise<void> {
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  unload(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.loadedSrc = "";
    this.loadedKey = "";
  }

  seekTo(seconds: number, duration?: number): number | null {
    const maximum =
      Number.isFinite(duration) && Number(duration) > 0
        ? Number(duration)
        : Number.isFinite(this.audio.duration)
          ? this.audio.duration
          : Number.MAX_SAFE_INTEGER;
    if (
      typeof seconds !== "number" ||
      Number.isNaN(seconds) ||
      seconds < 0 ||
      (Number.isFinite(maximum) && seconds > maximum)
    ) return null;
    const target = clampNumber(seconds, 0, maximum, seconds);
    this.audio.currentTime = target;
    return target;
  }

  setVolume(volume: number): void {
    this.audio.volume = clampNumber(volume, 0, 1, 0.8);
  }
}

export const audioService = new AudioService();
import { clampNumber } from "../utils/safeNumber";
