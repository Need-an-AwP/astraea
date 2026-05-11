import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import wails from "@wailsio/runtime/plugins/vite";
import devtoolsJson from 'vite-plugin-devtools-json';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    wails(path.resolve(__dirname, "../../packages/core-desktop/bindings")),
    devtoolsJson() // auto connect workspace to devtools
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 9245 // corresponds to wails dev server port
  }
})
