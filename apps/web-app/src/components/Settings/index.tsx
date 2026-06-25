import { useMemo, useState } from "react"
import { Settings as SettingsIcon, UserIcon, Mic, XIcon } from "lucide-react"
import {
    Dialog, DialogTrigger,
    DialogContent, DialogHeader,
    DialogTitle
} from "./settingDialog"
import UserProfile from "./userProfile"
import { Button } from "@/components/ui/button"


export default function Settings() {
    const settingList = useMemo(
        () => [
            {
                label: "User Profile",
                icon: <UserIcon className="h-4 w-4" />,
                component: <UserProfile />,
            },
            {
                label: "Audio Settings",
                icon: <Mic className="h-4 w-4" />,
                component: <></>,
            },
            {
                label: "Audio Settings 2",
                icon: <Mic className="h-4 w-4" />,
                component: <></>,
            },
            {
                label: "Audio Settings 3",
                icon: <Mic className="h-4 w-4" />,
                component: <></>,
            },
        ],
        [],
    )

    const [activeSetting, setActiveSetting] = useState(settingList[0].label)
    const activeContent = settingList.find((setting) => setting.label === activeSetting)?.component

    return (
        <Dialog>
            <DialogTrigger render={<Button size="icon" variant="ghost" className="cursor-pointer" />}>
                <SettingsIcon className="h-4 w-4" />
            </DialogTrigger>


            <DialogContent className="max-sm:h-full max-sm:w-full max-sm:rounded-none h-[calc(100vh-8rem)] w-[calc(100vw-8rem)] ">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-row max-sm:flex-col">
                    <div className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-2 max-sm:w-full max-sm:border-r-0 max-sm:border-b">
                        {settingList.map((setting) => (
                            <Button
                                key={setting.label}
                                variant={setting.label === activeSetting ? "secondary" : "ghost"}
                                className="cursor-pointer justify-start"
                                onClick={() => setActiveSetting(setting.label)}
                            >
                                {setting.icon}
                                {setting.label}
                            </Button>
                        ))}
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-4">{activeContent}</div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
