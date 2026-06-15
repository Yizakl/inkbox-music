import { ListMusic, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { SongList } from "../components/SongList";
import { useLibraryStore } from "../stores/libraryStore";
import { usePlaylistStore } from "../stores/playlistStore";

export function PlaylistsPage() {
  const playlists = usePlaylistStore((state) => state.playlists);
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const renamePlaylist = usePlaylistStore((state) => state.renamePlaylist);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const songs = useLibraryStore((state) => state.songs);
  const [selectedId, setSelectedId] = useState<string | null>(playlists[0]?.id ?? null);
  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const selected = playlists.find((item) => item.id === selectedId) ?? playlists[0];
  const playlistSongs = useMemo(() => selected?.songIds
    .map((id) => songs.find((song) => song.id === id))
    .filter((song): song is NonNullable<typeof song> => Boolean(song)) ?? [], [selected, songs]);

  function create() {
    if (!name.trim()) return;
    setSelectedId(createPlaylist(name));
    setName("");
  }

  if (!playlists.length) return <main className="library-page page-enter">
    <header className="page-header"><div><span className="eyebrow">PLAYLISTS</span><h1>歌单</h1><p>整理属于你的播放集合</p></div></header>
    <div className="playlist-empty-create">
      <EmptyState icon={ListMusic} title="还没有歌单" description="创建一个歌单，然后从歌曲菜单中添加音乐。" />
      <div className="playlist-create-row"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="歌单名称" /><button className="primary-button" onClick={create}><Plus />创建歌单</button></div>
    </div>
  </main>;

  return <main className="playlists-page page-enter">
    <aside className="playlist-sidebar">
      <header><span className="eyebrow">PLAYLISTS</span><h1>歌单</h1></header>
      <div className="playlist-create-row"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="新歌单" /><button className="icon-button" title="创建歌单" onClick={create}><Plus /></button></div>
      <nav>{playlists.map((playlist) => <button className={playlist.id === selected?.id ? "is-active" : ""} key={playlist.id} onClick={() => setSelectedId(playlist.id)}><ListMusic /><span><strong>{playlist.name}</strong><small>{playlist.songIds.length} 首</small></span></button>)}</nav>
    </aside>
    <section className="playlist-detail">
      <header className="page-header">
        <div><span className="eyebrow">CURATED PLAYLIST</span><h1>{selected?.name}</h1><p>{playlistSongs.length} 首歌曲</p></div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => {
            if (!selected) return;
            const next = window.prompt("输入新的歌单名称", selected.name);
            if (next?.trim()) renamePlaylist(selected.id, next);
          }}><Pencil />重命名</button>
          <button className="secondary-button" onClick={() => setDeleteOpen(true)}><Trash2 />删除歌单</button>
        </div>
      </header>
      {playlistSongs.length ? <SongList songs={playlistSongs} playlistId={selected?.id} /> : <EmptyState icon={ListMusic} title="歌单还是空的" description="从音乐库的歌曲菜单中选择“添加到歌单”。" />}
    </section>
    <ConfirmDialog open={deleteOpen} title="确认删除歌单？" description="歌单中的歌曲仍会保留在音乐库中。" confirmLabel="确认删除" onCancel={() => setDeleteOpen(false)} onConfirm={() => {
      if (selected) deletePlaylist(selected.id);
      setSelectedId(null);
      setDeleteOpen(false);
    }} />
  </main>;
}
