# Astraea Monorepo 架构设计与开发原则

本文档凝练了以 `astraea-core` 为基础，面向“Web (WASM) + Desktop (Wails)”双端统一架构的 Monorepo 工程决策和设计规范。

## 1. 核心定位与划分标准

在 Monorepo 中，物理目录的划分只遵循唯一标准：**它是用来“组装运行”的，还是被“依赖复用”的？**

* **`apps/`（入口容器层）**：只负责应用的最终打包和启动操作。
  * `apps/web-app`: 唯一的统一前端 UI 代码库（Vite + React/Vue 等），生产普通网页。
  * `apps/desktop-app`: 专属的 Wails 桌面外壳与厚重的原生 Go 核心逻辑（打包构建目标为 `.exe`/`.app`）。
* **`packages/`（领域能力复用层）**：抽象的接口规则和具体的功能实现块，不可独立运行。
  * `packages/interfaces`: 纯纯的 TypeScript 接口与类型定义（如 `IAstraeaEngine`、`IPlatformAdapter`）。
  * `packages/core-web`: Web 端专属核心，封装复杂的 WASM 交互与 WebCodecs API。
  * `packages/core-desktop`: 桌面端极薄的 TypeScript 桥接库，将调用转发给 Wails IPC。

## 2. 接口隔离与依赖注入 (Adapter Pattern)

**坚决拒绝在 UI 组件中写死针对底层引擎的判断！** 

* **统一契约：** 前端（`apps/web-client`）永远只面向 `packages/interfaces` 编程，绝对不要直接 import `core-web` 的实现逻辑。
* **依赖注入：** 针对流媒体核心、Native系统级行为（关闭窗口、置顶等），通过入口文件在初始化（或依赖容器）时，注入符合契约的具体平台实例。无论平台怎么变，UI 层的业务代码保持完全干净。

## 3. 正确处理平台专属 UI（构建时变量策略）

对于桌面端专有组件（如 `TitleBar`），**绝对避免在运行时利用全局变量（如 `if (window.wails)`）进行海量判断。**

* **构建命令分离：** 在 `web-client` 中维护两套构建环境，例如 `Vite --mode web` 和 `Vite --mode desktop`。
* **高层级处理差异：** 将环境差异判断卡在代码组件树的最顶层（如全局 Layout 层）：
  ```tsx
  const IS_DESKTOP = import.meta.env.MODE === 'desktop';
  ...
  {IS_DESKTOP && <TitleBar />}
  ```
* **Tree-Shaking（死代码消除）：** 利用打包工具的特性，当打包 Web 版时，让专有组件及其关联的原生依赖代码自然消失，保持 Web 产物百分百极简纯粹。

## 4. 拥抱“运行时不对称”

虽然顶层概念是对称的（都是 `UI -> Interface -> Impl`），但必须认清双端在执行深度的绝对不对称，不要强求代码量的对等。

* **Web 侧的重担在 TS/WASM：** `core-web` 非常厚重，需要处理大量浏览器特有坑点。
* **Desktop 侧的重担在 Go：** 桌面端绝大部分处理 Tailscale 组网和 Pion 媒体交换的核心全部落在 `apps/desktop` 的 Go 进程中。对应的 `core-desktop` (TypeScript) 应当保持极度轻薄，仅仅作为一个“IPC 传声筒”。

## 5. 开发协同

* **原子化提交 (Atomic Commits)：** 当跨层修改特性时（例如改变 `IAstraeaEngine` 参数），通过 pnpm workspace 使接口、多端实现以及 UI 调用能在一次提交中严密对齐。
* **无缝的热更新：** 充分利用子模块软链接的结构，无论在开发网页端还是在调试桌面版的 UI，只修改 `web-client` 里的代码即可享受一致的快速反馈闭环。
