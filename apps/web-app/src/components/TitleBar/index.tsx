/**
 * title bar is a desktop only component
 */

import { useState } from 'react';
import {
    Minus, X, Menu, Square,
    ChevronsLeftRight, ChevronsRightLeft, SquaresSubtract
} from 'lucide-react';
import { SlidersHorizontalIcon, SlidersIcon } from "@phosphor-icons/react";
import { usePanelStore } from '@/stores';
// import TailscaleStatusDisplay from '../TailscaleStatusDisplay';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
// import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
// import AppSettingPanel from '@/components/AppSettingPanel';
import { windowController as wc } from '@astraea/core-desktop';


const TitleBar = () => {
    const { leftPanelHandle, rightPanelHandle } = usePanelStore((state) => state)
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [isWindowCollapsed, setIsWindowCollapsed] = useState(false)

    const buttonClassName = "h-8 w-10 hover:bg-muted text-white/60 hover:text-white flex items-center justify-center"
    const buttonIconClassName = "h-4 w-4 pointer-events-none font-light"
    const strokeWidth = 1.5;

    

    return (
        <div className='w-full flex shrink-0 h-8 bg-white/5 z-999' id="title-bar">

            <div
                className='flex-1 h-full select-none'
                style={{
                    WebkitAppRegion: 'drag',
                    '--wails-draggable': 'drag'
                } as React.CSSProperties}
            />

            <div className="flex">
                <div
                    className={buttonClassName}
                    onClick={() => {
                        if (rightPanelHandle?.isCollapsed()) {
                            rightPanelHandle?.expand()
                            setIsWindowCollapsed(false)
                            wc.resizeWindow(1400, 800)
                        } else {
                            rightPanelHandle?.collapse()
                            setIsWindowCollapsed(true)
                            wc.resizeWindow(420, 800)
                        }
                    }}
                >
                    {isWindowCollapsed ?
                        <ChevronsLeftRight className={buttonIconClassName} strokeWidth={strokeWidth} />
                        :
                        <ChevronsRightLeft className={buttonIconClassName} strokeWidth={strokeWidth} />
                    }
                </div>
                <div
                    className={buttonClassName}
                    onClick={() => {
                        wc.minimizeWindow();
                    }}
                >
                    <Minus className={buttonIconClassName} strokeWidth={strokeWidth} />
                </div>
                <div
                    className={buttonClassName}
                    onClick={() => {
                        isMaximized ? wc.unmaximizeWindow() : wc.maximizeWindow();
                        setIsMaximized(!isMaximized);
                    }}
                >
                    {isMaximized ?
                        <SquaresSubtract className={buttonIconClassName} strokeWidth={strokeWidth} />
                        :
                        <Square className={buttonIconClassName} strokeWidth={strokeWidth} />
                    }
                </div>
                <div
                    className={`${buttonClassName} hover:bg-red-800`}
                    onClick={() => {
                        wc.closeWindow();
                    }}
                >
                    <X className={buttonIconClassName} strokeWidth={strokeWidth} />
                </div>
            </div>
        </div>
    );
};

export default TitleBar; 