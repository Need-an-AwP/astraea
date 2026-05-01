import { useState } from 'react'
import './App.css'
import { ThemeProvider } from "@/components/theme-provider"
import TitleBar from '@/components/TitleBar'
import { usePopover } from '@/stores'
import MainResizablePanel from './components/mainResizablePanel'
import { IS_DESKTOP } from './lib/env'

function App() {
    const { activePopover, closeAll } = usePopover()


    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen overflow-hidden">
                {/* title bar */}
                {IS_DESKTOP && <TitleBar />}

                {/* main content */}
                <div className="flex-1 overflow-hidden relative">
                    {/* blur layer */}
                    <div
                        className={`absolute left-0 right-0 bottom-0 bg-black/10 backdrop-blur-sm z-40 
                                transition-opacity duration-300
                                ${activePopover ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                        onClick={() => {
                            if (activePopover === 'tsLoading') return;
                            closeAll()
                        }}
                    />
                    {/* main panel */}
                    <MainResizablePanel />
                </div>
            </div>
        </ThemeProvider>
    )
}

export default App
