import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocalUserStateStore, usePopover } from '@/stores'
import { useEffect, useState } from "react"
import {
    Dialog, DialogHeader, DialogTitle,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import AvatarSelector from "./AvatarSelector"
import { LoaderCircle, X } from "lucide-react";



const UserProfile = () => {
    const { userState, updateSelfState, initialized } = useLocalUserStateStore()
    const { activePopover, togglePopover } = usePopover();
    const isUserPopoverOpen = activePopover === 'user'
    const [localUserName, setLocalUserName] = useState(userState.userName)
    const [localAvatar, setLocalAvatar] = useState(userState.userAvatar)

    useEffect(() => {
        if (isUserPopoverOpen) {
            setLocalUserName(userState.userName)
            setLocalAvatar(userState.userAvatar)
        }
    }, [isUserPopoverOpen, userState.userName, userState.userAvatar])

    const handlePopoverOpenChange = (open: boolean) => {
        if (!open) {
            // Popover is closing, update the store and config
            if (localUserName !== userState.userName || localAvatar !== userState.userAvatar) {
                const finalUserName = localUserName.trim()
                const finalAvatar = localAvatar.trim()
                updateSelfState({ userName: finalUserName, userAvatar: finalAvatar })
            }
        }
        togglePopover('user')
    }

    // 检查是否有有效的更改
    const hasChanges = () => {
        const trimmedUserName = localUserName.trim()
        const trimmedAvatar = localAvatar.trim()
        return trimmedUserName !== userState.userName || trimmedAvatar !== userState.userAvatar
    }

    // 放弃所有更改
    const discardChanges = () => {
        setLocalUserName(userState.userName)
        setLocalAvatar(userState.userAvatar)
        togglePopover('user')
    }

    // 获取用户名首字母作为头像备用显示
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U'
    }

    // every component have z-50 when activePopover is null
    // but when one popover is active, only that popover have z-50
    // this ensures the activated popover is always on top of the blur overlay
    const shouldShowAboveOverlay = `${(!activePopover || isUserPopoverOpen) && 'z-50'}`

    return (
        <Popover
            open={isUserPopoverOpen}
            onOpenChange={handlePopoverOpenChange}
        >
            <PopoverTrigger>
                <div className="flex">
                    <div className={`flex items-center gap-4 cursor-pointer select-none hover:bg-secondary/60 rounded-md p-2 
                    ${shouldShowAboveOverlay} 
                    ${isUserPopoverOpen && 'bg-secondary/80 ring ring-white/20'}`}>
                        <Avatar className="shrink-0">
                            <AvatarImage src={initialized ? userState.userAvatar : ''} draggable={false} />
                            <AvatarFallback>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            </AvatarFallback>
                        </Avatar>
                        <div className={`flex w-full `}>
                            <span className={`text-sm text-left line-clamp-2 break-all`}>
                                {initialized ? userState.userName : 'Loading...'}
                            </span>
                        </div>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-96 sm:max-w-96">
                <div className="relative flex flex-col gap-4">
                    {hasChanges() && (
                        <div className="absolute top-0 right-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger
                                        onFocus={(e) => e.preventDefault()}
                                    >
                                        <Button variant="destructive" size="icon" onClick={discardChanges}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Discard all changes<br />
                                        Click outside dialog to save changes
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>

    )
}

export default UserProfile