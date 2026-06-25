import { useSyncExternalStore } from "react"

// 这里维护一个全局的 portal 容器引用，用于让所有 dialog / popover / modal
// 都能共享同一个挂载目标，而不必在每次调用时通过 props 逐层传递。
//
// 这样做的好处是：
// 1. 业务组件完全不关心容器来源，只需要正常渲染 portal 内容。
// 2. 容器只在主视图挂载时注册一次，避免频繁查询 DOM。
// 3. 当容器发生变化时，可以通知所有订阅者，保证视图保持一致。
let portalContainer: HTMLElement | null = null

// 订阅者集合：任何使用 `usePortalContainer` 的组件都会注册一个回调到这里。
// 当容器更新时，我们会逐个通知这些回调，让 React 重新读取最新的容器。
const listeners = new Set<() => void>()

export const setPortalContainer = (container: HTMLElement | null) => {
    portalContainer = container

    // 主动通知所有订阅者容器已经变化。
    // 这样依赖这个容器的组件可以立即刷新，不需要手动重载或重新传参。
    listeners.forEach((listener) => listener())
}

export const getPortalContainer = () => {
    return portalContainer
}

// 注册一个订阅者。
//
// React 会在组件订阅这个 store 时调用它；当组件卸载时，返回的清理函数会被执行，
// 从集合中移除对应 listener，避免内存泄漏。
export const subscribePortalContainer = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

// 提供给组件使用的 React hook。
//
// `useSyncExternalStore` 的作用是把“React 组件”与“外部状态（这里是 module 级别的容器引用）”
// 安全地连接起来。它适合这种场景：
// - 状态不在 React state 里，而是由外部模块统一维护；
// - 需要在并发渲染下仍然保持一致性；
// - 只有真正依赖容器的组件才会在容器变化时更新。
export const usePortalContainer = () => {
    return useSyncExternalStore(
        subscribePortalContainer,
        getPortalContainer,
        () => null
    )
}