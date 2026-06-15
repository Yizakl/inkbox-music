import { Check, ListMusic, Plus, X } from "lucide-react";
import { useState } from "react";
import { usePlaylistStore } from "../stores/playlistStore";
import { useUiStore } from "../stores/uiStore";
import type { Song } from "../types/music";

export function AddToPlaylistModal({ song, onClose }: { song: Song; onClose: () => void }) {
  const playlists = usePlaylistStore((state) => state.playlists);
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const addSongToPlaylist = usePlaylistStore((state) => state.addSongToPlaylist);
  const showToast = useUiStore((state) => state.showToast);
  const [name, setName] = useState("");

  function add(playlistId: string) {
    addSongToPlaylist(playlistId, song.id);
    showToast("已添加到歌单", "success");
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal playlist-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header">
          <div><span className="eyebrow">ADD TO PLAYLIST</span><h2>添加到歌单</h2></div>
          <button className="icon-button" title="关闭" onClick={onClose}><X /></button>
        </header>
        <div className="playlist-modal__body">
          <div className="playlist-create-row">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="新歌单名称" />
            <button className="primary-button" disabled={!name.trim()} onClick={() => {
              const id = createPlaylist(name);
              add(id);
              setName("");
            }}><Plus />新建并加入</button>
          </div>
          <div className="playlist-picker">
            {playlists.length === 0 && <p>还没有歌单，可直接在上方创建。</p>}
            {playlists.map((playlist) => {
              const added = playlist.songIds.includes(song.id);
              return <button key={playlist.id} disabled={added} onClick={() => add(playlist.id)}>
                <ListMusic /><span><strong>{playlist.name}</strong><small>{playlist.songIds.length} 首歌曲</small></span>
                {added && <><Check /><em>已添加</em></>}
              </button>;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
