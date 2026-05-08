# Astraea Architecture

```mermaid
graph TD
    %% 前端层 (Shared UI)
    subgraph Frontend [Unified Frontend]
        UI[UI Components]
        Stores[State Management / Stores]
    end

    %% 桥接与接口层 (Bridge)
    subgraph Bridge [Engine Bridge & IPC]
        EngineInterface[Engine Interface: IEngine]
        WebEngine[WASM Engine Adapter]
        DesktopEngine[Wails / IPC Engine Adapter]
    end

    %% 发动机环境层 (Execution Environment)
    subgraph Environment [Execution Environment]
        subgraph WebEnv [Browser / WASM]
            JS_Syscall[syscall/js callback & events]
            WebAdapter[WASM Adapter<br>EventAdapter & TailscaleAdapter]
        end

        subgraph DesktopEnv [Desktop / Go Native]
            WailsRuntime[Wails Runtime Events]
            DesktopAdapter[Desktop Adapter<br>EventAdapter & TailscaleAdapter]
            Tsnet[tsnet / Tailscale node]
        end
    end

    %% 共享底层核心 (Shared Go Core)
    subgraph TwnCore [Shared Go Network Core: twncore]
        CoreManager[Core Manager<br>platform context]
        UDPDiscover[UDP Discovery Broadcast]
        RTCManager[Pion WebRTC Manager]
        KCPManager[KCP Relay & 信令]
    end

    %% 依赖与控制流
    UI --> Stores
    Stores -->|Calls| EngineInterface
    
    EngineInterface -. implementations .-> WebEngine
    EngineInterface -. implementations .-> DesktopEngine

    WebEngine -->|WASM bridge| JS_Syscall
    DesktopEngine -->|IPC / Wails| WailsRuntime

    JS_Syscall <--> WebAdapter
    WailsRuntime <--> DesktopAdapter
    Tsnet <--> DesktopAdapter

    WebAdapter -. implements .-> CoreManager
    DesktopAdapter -. implements .-> CoreManager

    CoreManager --> UDPDiscover
    CoreManager --> RTCManager
    CoreManager --> KCPManager
```

## 架构解释 (Architecture Explanation)

1. **统一前端 (Unified Frontend)**: UI 是严格针对 `IEngine` 接口编程的。它不知道自己是在浏览器中运行还是在桌面应用程序中运行。
2. **引擎桥接 (Engine Bridge)**: 它解析了平台执行环境。你需要提供 `WebEngine` 或 `DesktopEngine` 来满足 `IEngine` 接口的要求。
3. **执行环境 (Execution Environment)**: 
   - 使用 `syscall/js` 进行 WASM 执行，并注入平台适配器。
   - 对桌面应用使用 `Wails + tsnet`，并通过 Wails 运行时处理事件路由。
4. **共享 Go 网络核心 (`twncore`)**: 它是协议栈的绝对单一真相来源 (single source of truth)。它不了解 `Wails` 或 `WASM` 的具体实现细节。它仅通过初始化时注入的 `TailscaleAdapter`（用于网络）和 `EventAdapter`（用于下游 UI 通信）来工作。