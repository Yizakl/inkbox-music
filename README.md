# INKBOX Music

INKBOX Music 是一款注重视觉体验与本地隐私的桌面音乐播放器，基于
Tauri、React 和 TypeScript 开发。

应用支持本地音乐导入、音频 metadata 读取、内嵌封面、LRC 同步歌词、
喜欢列表、播放队列和多种播放模式。音乐文件与应用资料均保留在本地，
不会上传至云端。

当前版本：**Release 1.0**

## AI 辅助开发声明

本软件由作者 **ink** 在 AI 工具辅助下设计与开发。

AI 参与了部分代码生成、问题排查、实现建议、界面调整和文档整理。
项目的功能规划、技术选择、代码整合、测试与最终发布由作者完成。


### 内置示例

安装后的应用自带一首示例歌曲 (《Whatever She Wants》 - Bryson Tiller) 及对应歌词，用于体验播放、封面、
歌曲信息和同步歌词功能。

示例歌曲只会在首次初始化时添加。用户主动将其从音乐库移除后，
应用不会在每次启动时重复添加。

## 技术栈

- [Tauri](https://tauri.app/)：桌面应用框架与 Rust 后端
- [React](https://react.dev/)：用户界面
- [TypeScript](https://www.typescriptlang.org/)：前端类型系统
- [Vite](https://vite.dev/)：开发服务器与前端构建
- [Zustand](https://zustand.docs.pmnd.rs/)：播放器和音乐库状态管理
- [music-metadata](https://www.npmjs.com/package/music-metadata)：音频 metadata 与封面解析
- [AMLL React](https://www.npmjs.com/package/@applemusic-like-lyrics/react)：歌词项目技术参考
- [Lucide React](https://lucide.dev/)：界面图标
- HTMLAudioElement：音频播放与时长读取

## 参考项目

开发过程中参考了以下开源项目及相关技术资料：

| 项目 | 用途 | 链接 |
| --- | --- | --- |
| Tauri | 桌面应用框架 | [GitHub](https://github.com/tauri-apps/tauri) |
| applemusic-like-lyrics | Apple Music 风格歌词实现参考 | [GitHub](https://github.com/amll-dev/applemusic-like-lyrics) |
| AMLL React | AMLL 的 React 绑定 | [npm](https://www.npmjs.com/package/@applemusic-like-lyrics/react) |
| music-metadata | 音频标签、时长和封面解析 | [npm](https://www.npmjs.com/package/music-metadata) |
| jsmediatags | 浏览器音频标签读取方案参考 | [GitHub](https://github.com/aadsm/jsmediatags) |
| Zustand | 轻量状态管理 | [GitHub](https://github.com/pmndrs/zustand) |
| Lucide | 开源图标库 | [GitHub](https://github.com/lucide-icons/lucide) |

INKBOX Music 与上述项目不存在官方隶属或合作关系。各项目名称及商标归
其对应权利人所有。

## 环境要求

开发环境建议使用：

- Node.js 20 或更高版本
- npm
- Rust stable
- Tauri v2 所需的 Windows 系统依赖
- Microsoft Edge WebView2 Runtime

## 安装依赖

```powershell
npm install
```

## 开发运行

运行完整 Tauri 桌面应用：

```powershell
npm run tauri:dev
```

仅运行浏览器前端预览：

```powershell
npm run dev
```

浏览器模式使用文件选择器和 IndexedDB 保存临时文件引用，主要用于界面
开发。完整的本地文件路径、系统文件管理器和安装资源功能需要在 Tauri
桌面环境中测试。

## 构建

构建前端：

```powershell
npm run build
```

构建 Windows Release 安装包：

```powershell
npm run tauri:build
```

默认 NSIS 安装包输出目录：

```text
src-tauri/target/release/bundle/nsis/
```

## 项目结构

```text
inkbox/
├─ example_song/             内置示例歌曲与歌词
├─ src/
│  ├─ components/           通用界面组件
│  ├─ pages/                音乐库、播放、喜欢、设置和关于页面
│  ├─ services/             metadata、音频、歌词和文件服务
│  ├─ stores/               Zustand 状态管理
│  ├─ types/                TypeScript 类型
│  └─ utils/                LRC、时间和文件路径工具
├─ src-tauri/
│  ├─ capabilities/         Tauri 权限配置
│  ├─ src/                  Rust 命令与应用入口
│  └─ tauri.conf.json       应用及安装包配置
└─ package.json
```

## 本地数据与隐私

- 用户导入的音乐不会上传到服务器
- 音乐库、喜欢状态和播放器设置保存在本地
- Tauri 版本保存音频文件的原始路径
- 应用读取音频 bytes 仅用于本地 metadata 解析
- 从音乐库移除不会删除磁盘上的原始文件
- 自定义封面和歌词路径仅在用户主动选择后使用

移动、重命名或删除原始音乐文件后，应用中的对应歌曲可能会显示为不可用，
需要重新导入文件。

## Release 1.0

- 本地音乐导入与播放
- MP3、FLAC、WAV、M4A 支持
- 音频 metadata、时长和内嵌封面读取
- LRC 歌词解析与同步
- Apple Music 风格歌词显示
- 点击歌词跳转播放时间
- 手动滚动后的“回到当前歌词”
- 单击选中与双击播放
- 三点歌曲操作菜单
- 喜欢列表与播放队列
- 顺序播放、单曲循环和随机播放
- 高级渐变封面
- 歌曲信息弹窗
- 危险操作二次确认
- 关于页面
- 内置示例歌曲与歌词

## 未来计划

- 歌单系统
- 桌面歌词
- 歌词编辑器
- 歌曲信息手动编辑
- 更完整的主题系统
- 音频频谱与可视化效果
- 全局快捷键
- 更完善的本地音乐库扫描

## 作者

**ink**

## 许可证与第三方内容

发布或分发本项目之前，请分别检查项目源码、依赖库、字体、图标以及内置
示例音频和歌词的授权条件。

第三方依赖继续适用其各自的许可证。内置示例歌曲及歌词的版权归对应
权利人所有，不因被包含在安装包中而发生转移。
