import './App.css'
import { useRef, useEffect } from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import MainView from './mainView'
import { sessionManager } from './services/session'

function App() {

    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current) return;
        sessionManager.initSession()
        initializedRef.current = true
    }, [])

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <MainView />
        </ThemeProvider>
    )
}

export default App
