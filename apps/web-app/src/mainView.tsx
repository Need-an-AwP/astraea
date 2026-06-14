import { useCallback, useState } from 'react'
import TitleBar from '@/components/TitleBar'
import { usePopover } from '@/stores'
import MainResizablePanel from './components/mainResizablePanel'
import LoginPanel from './components/Login'
import { IS_DESKTOP } from './lib/env'
import Loading from './components/loading'


export default function MainView() {
    const { activePopover, closeAll } = usePopover()
    const [mainContentEl, setMainContentEl] = useState<HTMLDivElement | null>(null)
    const mainContentRef = useCallback((node: HTMLDivElement | null) => {
        setMainContentEl(node)
    }, [])

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            {/* title bar */}
            {IS_DESKTOP && <TitleBar />}

            {/* main content */}
            <div className="flex-1 overflow-hidden relative" ref={mainContentRef}>
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

                {/* login panel */}
                <LoginPanel portalContainer={mainContentEl} />

                {/* loading */}
                <Loading />
            </div>
        </div>
    )
}