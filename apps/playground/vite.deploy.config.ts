/**
 * 此playground构建配置用于生成单一html文件，包含所有依赖
 * 仅用于多设备测试
 */

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import fs from 'fs';

// 自定义插件：拦截 astraea-core 源码硬编码的 js 路径，用 Base64 直接内联 wasm 二进制
function inlineWasmPlugin() {
    return {
        name: 'inline-wasm',
        enforce: 'pre' as const, // 在其他转换前执行
        transform(code: string, id: string) {
            // 匹配 astraea-core 的 ipn 入口文件
            if (id.replace(/\\/g, '/').includes('src/ipn/index.ts') && code.includes('core.wasm')) {
                const wasmPath = resolve(__dirname, '../public/core.wasm');
                if (fs.existsSync(wasmPath)) {
                    const wasmBuffer = fs.readFileSync(wasmPath);
                    const wasmBase64 = wasmBuffer.toString('base64');
                    const dataURI = `data:application/wasm;base64,${wasmBase64}`;
                    
                    // 将硬编码路径替换为完整的 Data URI
                    return {
                        // 使用正则确保准确匹配
                        code: code.replace(
                            '"./node_modules/astraea-core/dist/core.wasm"',
                            `"${dataURI}"`
                        )
                    };
                }
            }
        }
    };
}

export default defineConfig({
    plugins: [
        inlineWasmPlugin(),
        viteSingleFile()
    ],
    resolve: {
        alias: {
            'astraea-core': resolve(__dirname, '../src/main.ts')
        }
    },
    build: {
        target: 'esnext',
        outDir: 'dist',
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 100000000,
        cssCodeSplit: false,
        reportCompressedSize: false,
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            }
        },
    },
});
