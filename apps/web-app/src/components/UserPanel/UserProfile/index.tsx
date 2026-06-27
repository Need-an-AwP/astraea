import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocalUserStateStore, usePopover, useSettingsDialog, useTsStatus } from '@/stores'
import { useEffect, useState } from "react"
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
import { LoaderCircle, X, ChevronRight, CircleQuestionMark, LogOut, SquarePen } from "lucide-react";
import { Label } from "@/components/ui/label"



const UserProfile = () => {
    const { userState, updateSelfState, initialized } = useLocalUserStateStore()
    const { activePopover, togglePopover } = usePopover();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const { openSettings } = useSettingsDialog();
    const currentTailnet = useTsStatus()?.CurrentTailnet
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
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger>
                <div className="flex">
                    <div className={`flex items-center gap-4 cursor-pointer select-none hover:bg-secondary/60 rounded-md p-2`}>
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
            <PopoverContent align="start" className="p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <Avatar className="size-32 shrink-0">
                            <AvatarImage src={initialized ? userState.userAvatar : ''} draggable={false} />
                            <AvatarFallback>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            </AvatarFallback>
                        </Avatar>

                        <Label className="font-bold text-xl">
                            {userState.userName}
                        </Label>
                        <Popover>
                            <PopoverTrigger >
                                <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help hover:text-foreground transition-colors">
                                    <span>@</span>
                                    <span className="underline decoration-dashed underline-offset-4">{currentTailnet?.Name || 'tailnet'}</span>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="flex flex-col gap-3 w-auto">
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-muted-foreground">Tailnet Name</Label>
                                    <span className="text-sm font-medium">{currentTailnet?.Name || 'Unknown'}</span>
                                </div>
                                {currentTailnet?.MagicDNSSuffix && (
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-xs text-muted-foreground">MagicDNS Suffix</Label>
                                        <span className="text-sm font-medium">{currentTailnet?.MagicDNSSuffix}</span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-muted-foreground">MagicDNS Status</Label>
                                    <span className="text-sm font-medium">{currentTailnet?.MagicDNSEnabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </PopoverContent>
                        </Popover>

                    </div>

                    <Button
                        variant="outline"
                        className="w-full cursor-pointer flex items-center justify-center gap-2"
                        onClick={() => {
                            openSettings('userProfile')
                            setIsPopoverOpen(false)
                        }}
                    >
                        <SquarePen />
                        Edit Profile
                    </Button>
                    <Button
                        variant="destructive"
                        className="w-full cursor-pointer flex items-center justify-center gap-2"
                    >
                        <LogOut />
                        Log Out
                    </Button>
                </div>
            </PopoverContent>
        </Popover>

    )
}

export default UserProfile