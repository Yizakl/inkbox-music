import { Activity, Droplets, Gauge, MonitorCog, Palette, Settings, Sparkles } from "lucide-react";
import { usePlayerStore } from "../stores/playerStore";
import { type AccentColor, type ThemeMode, useThemeStore } from "../stores/themeStore";

const modes: Array<[ThemeMode, string]> = [["dark", "深色"], ["black", "更深黑色"], ["system", "跟随系统"]];
const accents: Array<[AccentColor, string]> = [
  ["blue-violet", "蓝紫"], ["pink-violet", "粉紫"], ["cyan", "青蓝"],
  ["orange-red", "橙红"], ["green", "绿色"],
];

export function SettingsPage() {
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const theme = useThemeStore();

  return <main className="settings-page page-enter">
    <header className="page-header"><div><span className="eyebrow">PREFERENCES</span><h1>设置</h1><p>调整播放、主题与视觉效果</p></div></header>
    <div className="settings-grid">
      <section className="settings-card">
        <header><MonitorCog /><div><h2>主题模式</h2><p>选择应用基础明暗风格</p></div></header>
        <div className="segmented-control">{modes.map(([value, label]) => <button className={theme.mode === value ? "is-active" : ""} key={value} onClick={() => theme.setMode(value)}>{label}</button>)}</div>
      </section>
      <section className="settings-card">
        <header><Palette /><div><h2>强调色</h2><p>用于按钮、高亮和播放状态</p></div></header>
        <div className="accent-picker">{accents.map(([value, label]) => <button className={theme.accent === value ? "is-active" : ""} key={value} title={label} onClick={() => theme.setAccent(value)}><i data-color={value} /><span>{label}</span></button>)}</div>
      </section>
      <section className="settings-card settings-card--wide">
        <header><Sparkles /><div><h2>背景效果</h2><p>按设备性能调整界面层次</p></div></header>
        <div className="toggle-list">
          <label><span><Droplets /><span><strong>毛玻璃</strong><small>为侧边栏、播放器和弹窗添加透明模糊</small></span></span><input type="checkbox" checked={theme.glass} onChange={(event) => theme.setGlass(event.target.checked)} /></label>
          <label><span><Palette /><span><strong>模糊封面背景</strong><small>在正在播放页面显示封面氛围背景</small></span></span><input type="checkbox" checked={theme.coverBlur} onChange={(event) => theme.setCoverBlur(event.target.checked)} /></label>
          <label><span><Gauge /><span><strong>降低动画</strong><small>减少页面、歌词滚动与模糊过渡动画</small></span></span><input type="checkbox" checked={theme.reduceMotion} onChange={(event) => theme.setReduceMotion(event.target.checked)} /></label>
        </div>
      </section>
      <section className="settings-card settings-card--wide">
        <header><Activity /><div><h2>音频可视化</h2><p>在正在播放页面显示实时音频动画</p></div></header>
        <div className="visualizer-settings">
          <label className="settings-switch"><span><strong>启用音频可视化</strong><small>使用 Web Audio API 分析当前播放内容</small></span><input type="checkbox" checked={theme.visualizerEnabled} onChange={(event) => theme.setVisualizerEnabled(event.target.checked)} /></label>
          <div className="segmented-control">
            <button className={theme.visualizerMode === "spectrum" ? "is-active" : ""} onClick={() => theme.setVisualizerMode("spectrum")}>柔和频谱柱</button>
            <button className={theme.visualizerMode === "waveform" ? "is-active" : ""} onClick={() => theme.setVisualizerMode("waveform")}>平滑波形</button>
          </div>
        </div>
      </section>
      <section className="settings-card settings-card--wide">
        <header><Settings /><div><h2>默认音量</h2><p>音量和播放模式会自动保存在此设备</p></div></header>
        <div className="settings-volume"><input aria-label="默认音量" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} style={{ "--progress": `${volume * 100}%` } as React.CSSProperties} /><strong>{Math.round(volume * 100)}%</strong></div>
      </section>
    </div>
  </main>;
}
