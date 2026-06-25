import { useLayoutEffect, useRef } from 'react'
import { usePopover } from '@/stores'
import MainResizablePanel from './components/mainResizablePanel'
import LoginPanel from '@/components/Login'
import { setPortalContainer } from '@/components/portalContainer'


export default function MainView() {
    const { activePopover, closeAll } = usePopover()
    const mainContentRef = useRef<HTMLDivElement | null>(null)

    useLayoutEffect(()=>{
        setPortalContainer(mainContentRef.current)
        return () => setPortalContainer(null)
    },[])

    return (
        <div
            className="relative flex-1 overflow-hidden"
            id="main-content"
            ref={mainContentRef}
        >
            {/* blur layer */}
            <div
                className={`absolute left-0 right-0 bottom-0 bg-black/10 backdrop-blur-sm z-40 
                                transition-opacity duration-300
                                ${activePopover ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => {
                    if (activePopover === 'tsLoading') return
                    closeAll()
                }}
            />

            {/* main panel */}
            <MainResizablePanel />

            {/* login panel */}
            <LoginPanel />


        </div>
    )
}