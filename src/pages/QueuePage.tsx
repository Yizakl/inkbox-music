import { Rows3 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { SongList } from "../components/SongList";
import { usePlayerStore } from "../stores/playerStore";

export function QueuePage() {
  const playlist = usePlayerStore((state) => state.playlist);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return <main className="library-page page-enter">
    <header className="page-header">
      <div><span className="eyebrow">UP NEXT</span><h1>播放队列</h1><p>{playlist.length} 首歌曲 · 当前播放顺序</p></div>
      {playlist.length > 0 && <button className="secondary-button" onClick={() => setConfirmOpen(true)}>清空队列</button>}
    </header>
    {playlist.length > 0 ? <SongList songs={playlist} /> : <EmptyState icon={Rows3} title="播放队列还是空的" description="双击歌曲后，会从当前列表建立播放队列。" />}
    <ConfirmDialog open={confirmOpen} title="确认清空播放队列？" description="当前播放会停止，音乐库中的歌曲不会被移除。" confirmLabel="确认清空" onCancel={() => setConfirmOpen(false)} onConfirm={() => { clearQueue(); setConfirmOpen(false); }} />
  </main>;
}
