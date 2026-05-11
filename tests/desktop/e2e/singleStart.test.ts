import { test, expect, ConnectOverCDPOptions, chromium } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

let wailsDevProcess: ChildProcess;

const superLongTimeout = 60 * 60 * 1000; // 1 hour

test.beforeAll(async () => {
    const desktopAppDir = path.resolve(process.cwd(), '../apps/desktop-app');

    // directly start wails CLI
    wailsDevProcess = spawn("wails3", ["dev"], {
        cwd: desktopAppDir, 
        stdio: 'pipe' // using pipe to capture output for readiness detection
    });

    await new Promise<void>((resolve, reject) => {
        let isResolved = false;

        // Wails 可能会将某些系统日志或调试日志打印到 stderr
        const checkReady = (data: Buffer | string) => {
            const output = data.toString();
            if (!isResolved && output.includes('Connected to frontend dev server!')) {
                // 等待到标志性输出后再额外预留几秒钟给 Chromium 初始化 CDP 断点
                setTimeout(() => {
                    isResolved = true;
                    resolve();
                }, 3000);
            }
        };

        wailsDevProcess.stdout?.on('data', (data) => {
            process.stdout.write(data);
            checkReady(data);
        });

        wailsDevProcess.stderr?.on('data', (data) => {
            process.stderr.write(data);
            checkReady(data);
        });

        wailsDevProcess.on('error', (err) => {
            if (!isResolved) reject(err);
        });
        
        wailsDevProcess.on('exit', (code) => {
            if (!isResolved && code !== 0 && code !== null) {
                reject(new Error(`Wails process exited unexpectedly with code ${code}`));
            }
        });
    });
});

test.afterAll(() => {
    // 测试结束（或手动终止）时清理后台进程
    if (wailsDevProcess) {
        wailsDevProcess.kill();
    }
});

test('Single Start Test', async () => {
    test.setTimeout(superLongTimeout);
    const browser = await chromium.connectOverCDP('http://localhost:9222')

    const defaultContext = browser.contexts()[0];
    // Wails 的 WebView2 页面可能存在毫秒级延迟，优先取已有 page，否则等待 page 创建事件
    const page = defaultContext.pages()[0] || await defaultContext.waitForEvent('page');

    console.log('Wails CDP connected successfully. Waiting for 1 hour for manual testing...');

    await page.waitForTimeout(superLongTimeout);

    await browser.close();
});