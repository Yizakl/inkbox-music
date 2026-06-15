import { Disc3, Heart, Info, ListMusic, Mic2, Settings, Rows3 } from "lucide-react";
import { NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__mark"><Disc3 /></span>
        <span>Inkbox</span>
      </div>
      <nav className="sidebar__nav">
        <NavLink to="/" end>
          <ListMusic />
          <span>音乐库</span>
        </NavLink>
        <NavLink to="/now-playing">
          <Mic2 />
          <span>正在播放</span>
        </NavLink>
        <NavLink to="/playlists">
          <ListMusic />
          <span>歌单</span>
        </NavLink>
        <NavLink to="/queue">
          <Rows3 />
          <span>播放队列</span>
        </NavLink>
        <NavLink to="/favorites">
          <Heart />
          <span>喜欢</span>
        </NavLink>
        <NavLink to="/settings">
          <Settings />
          <span>设置</span>
        </NavLink>
        <NavLink to="/about">
          <Info />
          <span>关于</span>
        </NavLink>
      </nav>
      <div className="sidebar__footer">
        <span>本地资料库</span>
        <strong>只在此设备上</strong>
      </div>
    </aside>
  );
}
