import { audioService } from "./audioService";

class AudioVisualizerService {
  private context: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;

  isSupported(): boolean {
    return Boolean(window.AudioContext || window.webkitAudioContext);
  }

  getAnalyser(): AnalyserNode {
    if (this.analyser) return this.analyser;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio API is not supported");

    this.context = new AudioContextClass();
    this.source = this.context.createMediaElementSource(audioService.getMediaElement());
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.84;
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    return this.analyser;
  }

  async resume(): Promise<void> {
    if (!this.context) this.getAnalyser();
    if (this.context?.state === "suspended") await this.context.resume();
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const audioVisualizerService = new AudioVisualizerService();
