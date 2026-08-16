# DemoCue 项目说明

## 项目概览

DemoCue 是一个 macOS 桌面应用，技术栈是 Tauri 2 + React 19。它用于生成视频录制提纲，把提纲保存在本地，并在录制时通过透明置顶的浮窗显示讲解提示。

当前 AI 生成能力使用 DeepSeek 官方 Chat Completions API。文件上传入口暂时隐藏，生成提纲只走文字输入。

## 目录结构

- `src/`：React 前端源码。
- `src/pages/`：主应用页面，包括首页、创建提纲、编辑提纲、设置页。
- `src/components/`：通用组件和业务组件。
- `src/components/ui/`：本地 UI 基础组件，例如按钮、卡片、输入框、标签页。
- `src/windows/`：独立窗口入口组件，目前主要是悬浮提纲窗口。
- `src/services/`：前端数据访问、Tauri command 调用封装。
- `src/stores/`：Zustand 状态管理。
- `src/lib/`：通用工具和全局能力，例如 i18n。
- `src/types/`：前端共享 TypeScript 类型和数据规范化逻辑。
- `src-tauri/`：Rust 后端、Tauri 配置、图标、权限、生成的 schema。
- `index.html`：主应用 HTML 入口。
- `floating.html`：悬浮窗 HTML 入口。

## 关键前端文件

- `src/App.tsx`：根据当前路径决定渲染主应用还是悬浮窗，并挂载全局 i18n provider。
- `src/components/AppLayout.tsx`：主应用外壳，包含 DemoCue 品牌、导航和页面背景。
- `src/lib/i18n.tsx`：全局中英文词条和语言状态，语言选择保存在 `localStorage` 的 `democue.language`。
- `src/pages/Home.tsx`：展示已保存提纲列表，并打开悬浮窗。
- `src/pages/CreateOutline.tsx`：通过文字输入创建新提纲。由于当前 DeepSeek 官方 API 流程只支持文本生成，文件上传已隐藏。
- `src/pages/EditOutline.tsx`：编辑提纲标题、章节和讲解重点。
- `src/pages/Settings.tsx`：配置 DeepSeek API endpoint/API key，并切换全局语言。
- `src/components/FloatingPanel.tsx`：悬浮提纲条 UI，包括主题、布局、字号、透明度、模糊度、背景色设置。
- `src/components/Chapter.tsx`：编辑页里的单个章节卡片。
- `src/services/api.ts`：封装 Tauri `invoke` 调用，并重新导出部分本地数据库方法。
- `src/services/db.ts`：通过 `@tauri-apps/plugin-sql` 访问本地 SQLite。
- `src/stores/outlineStore.ts`：提纲列表、草稿、保存、删除等状态管理。
- `src/index.css`：Tailwind 入口、设计变量、主应用样式和悬浮窗样式。

## 关键 Tauri/Rust 文件

- `src-tauri/tauri.conf.json`：产品名、窗口配置、bundle 图标、构建命令、插件配置。
- `src-tauri/src/lib.rs`：Tauri builder 初始化、插件注册、command 注册、全局快捷键。
- `src-tauri/src/commands/mod.rs`：Tauri commands，包括设置读写、AI 生成、悬浮窗生命周期、悬浮窗设置。
- `src-tauri/src/state.rs`：可序列化的应用设置，以及内存中的悬浮窗运行状态。
- `src-tauri/src/db.rs`：SQLite schema migration，以及 Rust 侧提纲数据规范化。
- `src-tauri/src/dmx.rs`：DeepSeek Chat Completions 请求构造、响应解析、错误处理。文件名仍叫 `dmx.rs` 是历史遗留，实际已改为 DeepSeek。
- `src-tauri/capabilities/default.json`：Tauri 权限范围，控制主窗口和悬浮窗能调用哪些能力。
- `src-tauri/icons/icon.png`：Tauri bundle 使用的 app 图标。

## 常用命令

```bash
pnpm install
pnpm tauri dev
pnpm exec tsc -b
pnpm run build
cd src-tauri && cargo check
```

## 实现注意事项

- 用户可见品牌名统一使用 `DemoCue`。
- 不要随意修改 Tauri bundle identifier。修改 identifier 会让系统把它当成另一个 app，可能影响本地数据和 macOS 权限连续性。
- 主应用通过 `useI18n()` 支持全局中英文切换。新增用户可见文案时，优先加到 `src/lib/i18n.tsx`。
- 悬浮窗是独立入口，但当前也包在全局 i18n provider 下，加载/错误提示应使用词条。
- 悬浮窗设置通过 Tauri store 的 `floatingSettings` 持久化；改设置字段时要同步 TypeScript 类型和 Rust struct。
- 本地提纲数据通过 Tauri SQL plugin 存在 SQLite。
- DeepSeek endpoint 和 API key 通过 Tauri store 保存在本地，不会进入前端 bundle。
- 当前生成模型固定为 `deepseek-v4-flash`。
- 旧的 `DMXAPI_*` 环境变量仍作为兼容 fallback，但主要配置应使用 `DEEPSEEK_API_URL` 和 `DEEPSEEK_API_KEY`。
