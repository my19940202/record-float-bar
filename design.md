# ScreenGuide AI 官网设计总结

本文总结 `video-guide-bar-site` 当前官网的设计方向、页面结构和组件规范，作为后续继续开发首页、SEO 落地页、安装页和 FAQ 页的设计依据。

## 1. 产品定位

`ScreenGuide AI` 是一个用于录制屏幕视频、产品演示、教程讲解和技术分享的桌面端 AI 悬浮引导条。

网站第一版的目标不是完整展示复杂软件能力，而是先建立一个利于 SEO 的产品官网骨架，让用户快速理解：

- 这是一个什么工具；
- 解决什么录屏痛点；
- 怎么使用；
- 怎么安装；
- 支持哪些设置；
- 当前是否可获取内测。

核心定位语：

- 英文：`AI guide bar for screen recording`
- 中文：`录屏视频的 AI 悬浮引导条`

当前默认产品名：

- `ScreenGuide AI`

备选命名：

- `GuideBar AI`
- `ScreenCue AI`
- `Presenter Guide Bar`
- `RecordGuide AI`
- `Floating Outline AI`

命名策略偏 SEO 直白：名称里保留 `Screen` / `Guide` / `AI` 这类搜索和理解成本都比较低的词。

## 2. 设计气质

整体风格参考用户提供的截图：奶油浅底、柔和紫色、圆角导航、大 Hero 区、轻拟物卡片、温和阴影、带一点可爱但不过度幼稚。

关键词：

- Soft
- Friendly
- Clear
- Lightweight
- Desktop companion
- AI-assisted
- Recording-friendly

不走传统企业 SaaS 风，也不走深色科技 AI 风。这个产品更像一个录屏时陪在旁边的轻量桌面助手，因此视觉上应该保持：

- 低压力；
- 有亲和力；
- 信息清楚；
- 页面不要显得像后台系统；
- 不要用过强的“未来科技感”抢走产品本身的表达。

## 3. 视觉系统

当前样式主要沉淀在 `src/styles.css`。

### 色彩

基础色：

- 页面背景：`#fff9ee`
- 主文字：`#241f33`
- 次级文字：`#746b86`
- 卡片白：`rgba(255, 255, 255, 0.82)`
- 强卡片白：`#ffffff`
- 边框：`rgba(36, 31, 51, 0.1)`

品牌色：

- 主紫色：`#7c4dff`
- 深紫色：`#5933d6`
- 淡紫色：`#eadcff`
- 奶油色：`#fff4e6`
- 柔蓝色：`#9ed8ff`
- 荧光黄点缀：`#f4ff3f`
- 柔粉色：`#ff9fba`

使用原则：

- 大面积使用奶油浅底，不使用纯白空背景。
- CTA 使用紫色渐变，建立主品牌识别。
- 黄色只作为少量强调和装饰，不大面积铺开。
- 蓝色用于 Hero 视觉区，表达屏幕、桌面、录制环境。
- 所有颜色都保持柔和，不使用高压霓虹和强对比黑白。

### 背景

页面背景不是纯色，而是浅奶油底叠加 radial gradient：

- 左上有轻微黄色柔光；
- 右上有紫色柔光；
- 右侧有蓝色柔光；
- 页面上有非常轻的点阵纹理。

这个背景语言延续了参考图里的“柔软、有空气感”的视觉方向。后续新增页面也应该继续使用浅底 + 柔光，而不是换成单调白底或深色背景。

### 字体

当前字体：

- 英文：`Inter`
- 中文 fallback：`Noto Sans SC`
- 系统 fallback：`ui-sans-serif, system-ui, sans-serif`

标题使用超大字号和紧字距，形成明确的 SEO 官网首屏冲击力。

当前标题特征：

- Hero 标题非常大；
- 行高偏紧；
- 字距为负；
- 字重较高；
- 正文保持较高可读性。

后续如果要进一步贴近参考图，可以考虑引入更有品牌感的展示字体，但当前阶段使用 `Inter + Noto Sans SC` 更稳，适合中英双语和 SEO 内容扩展。

## 4. 页面结构

当前首页是单页 SEO landing page，支持 `/en` 和 `/zh` 双语。

结构如下：

1. Header
   - 品牌名 `ScreenGuide AI`
   - 锚点导航：Intro / Features / How it works / FAQ
   - 语言切换
   - Early access CTA

2. Hero
   - SEO 导向 eyebrow
   - 大标题
   - 一句话说明产品
   - 主 CTA：加入内测 / Join waitlist
   - 次 CTA：查看结构 / See structure
   - 右侧视觉：桌面窗口 + 悬浮引导条

3. Intro card
   - 类似参考图中的 “Hi, I’m …” 介绍卡
   - 用一句话解释产品本质

4. Features
   - AI 生成提纲
   - 悬浮引导条
   - 讲解控制
   - 录屏友好设置

5. How it works
   - 输入主题
   - AI 生成提纲
   - 打开悬浮条
   - 按提示录制

6. Install placeholder
   - 当前先占位
   - 明确 macOS first
   - 后续补下载、权限、安装说明

7. FAQ
   - 怎么使用
   - 如何安装
   - 支持哪些设置
   - 优先支持哪些平台

## 5. 组件语言

### Header

Header 采用胶囊形悬浮导航：

- sticky 顶部；
- 白色半透明背景；
- 大圆角；
- 柔和阴影；
- 中间导航轻量；
- 右侧保留语言切换和 CTA。

这个结构参考了截图中的顶部导航。后续不要改成传统横向大导航栏，也不要加入太多入口。

### Button

按钮统一使用胶囊形态：

- 默认按钮为白底浅边框；
- 主按钮为紫色渐变；
- 按钮有轻微下压阴影；
- hover 时轻微上浮；
- active 时产生按压感。

这套按钮语言强调“轻实体”和“可点击”，比扁平按钮更贴合参考图风格。

### Card

卡片统一特征：

- 大圆角；
- 白色半透明或白色实体背景；
- 浅边框；
- 柔和阴影；
- 不使用硬阴影和强边框。

适用组件：

- intro card；
- feature card；
- how-it-works step；
- FAQ item；
- install section。

### Hero visual

Hero 右侧不是产品截图，而是抽象产品隐喻：

- 桌面窗口代表正在录屏的屏幕；
- 浮层 guide bar 代表软件核心能力；
- 星形装饰呼应参考图里的轻松氛围。

当前阶段不使用真实 App 截图，因为桌面软件界面还未最终稳定。等 App UI 稳定后，可以替换为真实截图或截图 + 浮层组合。

## 6. 内容语气

文案应该直接、清楚，不要过度营销。

英文语气：

- Clear
- Product-led
- SEO-friendly
- Not hype-heavy

中文语气：

- 直接说明场景和痛点；
- 少用空泛词；
- 重点解释“录屏时为什么需要悬浮提纲”。

推荐表达：

- `Stay on track while recording demos, tutorials, and presentations.`
- `AI guide bar for screen recording`
- `录屏、演示、教程讲解时，让表达始终有结构。`
- `录屏视频的 AI 悬浮引导条`

避免表达：

- “颠覆式 AI 录屏革命”
- “全自动生成爆款视频”
- “下一代超级智能工作台”

这类表达会降低信任感，也不符合当前产品 MVP 定位。

## 7. SEO 结构

当前 SEO 重点是首页双语：

- `/en`
- `/zh`
- `/` 301 跳转到 `/en`

当前已预留：

- `public/robots.txt`
- `public/sitemap.xml`
- `src/lib/seo.ts`
- `src/lib/i18n.ts`

后续可扩展的 SEO 页面：

- `/en/screen-recording-guide-bar`
- `/en/ai-presentation-companion`
- `/en/teleprompter-for-screen-recording`
- `/zh/录屏提词器`
- `/zh/AI演示提纲工具`

但第一阶段不要急着铺太多页面。先把首页信息质量、安装说明和 FAQ 做扎实。

## 8. 响应式原则

桌面端：

- Hero 使用左右双栏；
- 左侧讲价值，右侧放视觉隐喻；
- Feature 使用四列卡片；
- How it works 使用左右分栏。

移动端：

- Header 收起中间导航；
- Hero 改为单列；
- Feature 卡片从四列变两列再变一列；
- 所有 CTA 保持可点击区域足够大。

移动端不追求复杂动效，优先保证信息可读和加载稳定。

## 9. 后续设计迭代方向

优先级建议：

1. 补真实安装说明
   - macOS 下载
   - 权限说明
   - 首次打开流程

2. 补真实 App 截图或半真实 mock
   - 主窗口
   - AI 生成提纲
   - 悬浮引导条
   - 设置面板

3. 增强 FAQ
   - 是否遮挡录屏
   - 是否支持快捷键
   - 是否支持鼠标穿透
   - 是否支持透明度
   - 是否支持 Windows

4. 拓展 SEO landing pages
   - 围绕 `screen recording teleprompter`
   - 围绕 `AI presentation companion`
   - 围绕 `floating outline for demos`

5. 再考虑 OG 图
   - 当前不急；
   - 页面文案稳定后再生成社交分享图。

## 10. 当前实现文件

主要相关文件：

- `src/styles.css`：视觉 token、布局和组件样式
- `src/lib/i18n.ts`：中英文内容和站点配置
- `src/lib/seo.ts`：SEO head helper
- `src/routes/$locale/index.tsx`：双语首页结构
- `src/components/Header.tsx`：顶部导航
- `src/components/Footer.tsx`：底部信息
- `public/robots.txt`：搜索引擎爬取配置
- `public/sitemap.xml`：双语首页 sitemap

这份 `design.md` 是后续继续开发时的设计准则。新增页面应优先复用当前 token、卡片、按钮、圆角、阴影和浅色柔光背景，不要另起一套视觉系统。
