import type { TSStatus, ActivePath } from "astraea-core";
import type { Store } from "./services/store";

declare global {
	function log(content: string): void;
	
	var __APP_STORE__: Store; // 用于 Playwright E2E 测试共享整个系统状态
}

export {};
