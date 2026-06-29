import './App.css'
import { useRef, useEffect } from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import MainView from './mainView'
import { sessionManager } from './services/session'
import { useAuthStore, usePreferenceStore, useLocalUserStateStore, initMediaDevices } from '@/stores'
import { initAudioEngine } from '@/AudioEngine'
import { IS_DESKTOP } from './lib/env'
import TitleBar from '@/components/TitleBar'
import Loading from '@/components/loading'


function App() {
    ////////////////// BOOTSTRAP //////////////////  
    const authHydrated = useAuthStore((state) => state.hasHydrated)
    const userHydrated = useLocalUserStateStore((state) => state.initialized)
    const preferenceHydrated = usePreferenceStore((state) => state.hasHydrated)
    const isLoading = !authHydrated || !userHydrated || !preferenceHydrated

    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current || isLoading) return;
        sessionManager.initSession();
        initMediaDevices();// deprecated
        initAudioEngine()
        initializedRef.current = true;
    }, [isLoading])
    ////////////////// BOOTSTRAP //////////////////  

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex flex-col h-screen w-screen overflow-hidden">
                {/* title bar */}
                {IS_DESKTOP && <TitleBar />}


                {isLoading ? <Loading /> : <MainView />}
            </div>
        </ThemeProvider>
    )
}

export default App
