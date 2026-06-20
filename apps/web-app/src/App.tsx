import './App.css'
import { useRef, useEffect } from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import MainView from './mainView'
import { sessionManager } from './services/session'
import { useAuthStore } from '@/stores'
import { IS_DESKTOP } from './lib/env'
import TitleBar from '@/components/TitleBar'
import Loading from '@/components/loading'


function App() {
    ////////////////// BOOTSTRAP //////////////////  
    const isLoading = !useAuthStore((state) => state.hasHydrated);

    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current || isLoading) return;
        sessionManager.initSession();
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
