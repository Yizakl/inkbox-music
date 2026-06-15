import { useEffect, useRef } from "react";
import { audioVisualizerService } from "../services/audioVisualizerService";
import { useThemeStore } from "../stores/themeStore";
import { useUiStore } from "../stores/uiStore";

interface AudioVisualizerProps {
  isPlaying: boolean;
}

function accentRgb(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const expanded = hex.length === 3
      ? hex.split("").map((part) => part + part).join("")
      : hex;
    return `${parseInt(expanded.slice(0, 2), 16)}, ${parseInt(expanded.slice(2, 4), 16)}, ${parseInt(expanded.slice(4, 6), 16)}`;
  }
  const match = value.match(/\d+(?:\.\d+)?/g);
  return match?.slice(0, 3).join(", ") ?? "250, 75, 140";
}

export function AudioVisualizer({ isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const opacityRef = useRef(0);
  const unsupportedShownRef = useRef(false);
  const enabled = useThemeStore((state) => state.visualizerEnabled);
  const mode = useThemeStore((state) => state.visualizerMode);
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!audioVisualizerService.isSupported()) {
      if (!unsupportedShownRef.current) {
        unsupportedShownRef.current = true;
        showToast("当前环境不支持音频可视化", "info");
      }
      return;
    }

    let analyser: AnalyserNode;
    try {
      analyser = audioVisualizerService.getAnalyser();
    } catch {
      showToast("无法启动音频可视化", "info");
      return;
    }

    if (isPlaying) {
      void audioVisualizerService.resume().catch(() => {
        if (!unsupportedShownRef.current) {
          unsupportedShownRef.current = true;
          showToast("音频可视化需要播放权限", "info");
        }
      });
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const waveformData = new Uint8Array(analyser.fftSize);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      opacityRef.current = isPlaying
        ? Math.min(1, opacityRef.current + 0.055)
        : Math.max(0, opacityRef.current - 0.025);

      const rgb = accentRgb();
      if (mode === "spectrum") {
        analyser.getByteFrequencyData(frequencyData);
        const bars = 34;
        const gap = 4;
        const barWidth = Math.max(2, (width - gap * (bars - 1)) / bars);
        for (let index = 0; index < bars; index += 1) {
          const sampleIndex = Math.floor((index / bars) ** 1.55 * frequencyData.length * 0.62);
          const strength = frequencyData[sampleIndex] / 255;
          const barHeight = Math.max(2, strength * height * 0.82 * opacityRef.current);
          const x = index * (barWidth + gap);
          const y = height - barHeight;
          const gradient = context.createLinearGradient(0, y, 0, height);
          gradient.addColorStop(0, `rgba(${rgb}, ${0.72 * opacityRef.current})`);
          gradient.addColorStop(1, `rgba(${rgb}, ${0.12 * opacityRef.current})`);
          context.fillStyle = gradient;
          context.beginPath();
          context.roundRect(x, y, barWidth, barHeight, Math.min(barWidth / 2, 3));
          context.fill();
        }
      } else {
        analyser.getByteTimeDomainData(waveformData);
        context.lineWidth = 2;
        context.strokeStyle = `rgba(${rgb}, ${0.78 * opacityRef.current})`;
        context.shadowColor = `rgba(${rgb}, ${0.28 * opacityRef.current})`;
        context.shadowBlur = 12;
        context.beginPath();
        for (let index = 0; index < waveformData.length; index += 1) {
          const x = (index / (waveformData.length - 1)) * width;
          const normalized = (waveformData[index] - 128) / 128;
          const y = height / 2 + normalized * height * 0.36 * opacityRef.current;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
        context.shadowBlur = 0;
      }
      if (isPlaying || opacityRef.current > 0.01) {
        frameRef.current = requestAnimationFrame(draw);
      }
    };
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [enabled, isPlaying, mode, showToast]);

  if (!enabled) return null;
  return <div className={`audio-visualizer ${isPlaying ? "is-playing" : ""}`} aria-hidden="true">
    <canvas ref={canvasRef} />
  </div>;
}
