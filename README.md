# DemoCue

[中文](#中文) | [English](#english)

## 中文

DemoCue 是一个面向自媒体视频制作者的桌面工具，用 AI 生成视频讲解提纲，并在录制时通过置顶悬浮窗展示章节和讲解重点。

### 下载

最新版本：

<https://github.com/my19940202/record-float-bar/releases/latest>

### 功能

- DeepSeek 官方 API 生成讲解提纲
- 本地保存、查看和编辑提纲
- 透明置顶悬浮窗展示录制提示
- 快捷键切换上一章 / 下一章
- 悬浮窗主题、布局、字号、透明度、模糊度和背景色配置
- 中文 / English 界面切换

### macOS 安装说明

当前 DMG 未做 Apple 签名和公证。安装后首次打开前，需要执行：

```bash
xattr -dr com.apple.quarantine /Applications/DemoCue.app
```

### 开发

```bash
pnpm install
pnpm tauri dev
```

首次使用前，在应用「设置」页配置 DeepSeek API Endpoint 和 API Key。

### 构建

```bash
pnpm tauri build
```

### 技术栈

- Tauri 2 / Rust
- React / TypeScript / Vite
- Tailwind CSS
- SQLite

## English

DemoCue is a desktop tool for video creators. It generates AI-powered recording outlines and shows chapters plus talking points in an always-on-top floating window while recording.

### Download

Latest release:

<https://github.com/my19940202/record-float-bar/releases/latest>

### Features

- Generate recording outlines with the official DeepSeek API
- Save, browse, and edit outlines locally
- Show recording prompts in a transparent always-on-top floating window
- Switch to the previous / next chapter with shortcuts
- Customize floating window theme, layout, font size, opacity, blur, and background color
- Switch between Chinese and English UI

### macOS Install Note

The current DMG is not Apple signed or notarized. Before opening the app for the first time after installation, run:

```bash
xattr -dr com.apple.quarantine /Applications/DemoCue.app
```

### Development

```bash
pnpm install
pnpm tauri dev
```

Before first use, configure the DeepSeek API Endpoint and API Key in Settings.

### Build

```bash
pnpm tauri build
```

### Tech Stack

- Tauri 2 / Rust
- React / TypeScript / Vite
- Tailwind CSS
- SQLite
