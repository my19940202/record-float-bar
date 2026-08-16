# DemoCue

macOS 悬浮式 AI 讲解提纲助手（Tauri 2 + React 19）。

## 功能

- 纯文字生成讲解提纲
- DeepSeek 官方 API 调用
- SQLite 本地保存与编辑
- 透明置顶悬浮窗 + 全局快捷键切章（`Cmd+Shift+↑/↓`）

## 开发

```bash
pnpm install
pnpm tauri dev
```

首次使用前在「设置」页配置：

- `DEEPSEEK_API_URL`
- `DEEPSEEK_API_KEY`

开发期也可在项目根目录创建 `.env`（参考 `.env.example`），由 Rust 侧读取 `DEEPSEEK_*` 环境变量作为默认值。旧的 `DMXAPI_*` 环境变量仍作为兼容 fallback。

## 构建

```bash
pnpm tauri build
```

## 技术栈

- Tauri 2 / Rust
- React 19 / TypeScript / Vite
- Tailwind CSS 4
- tauri-plugin-sql / store / global-shortcut
