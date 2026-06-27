import { Settings as SettingsIcon } from "lucide-react"
import {
    Dialog, DialogTrigger,
    DialogContent, DialogHeader,
    DialogTitle
} from "./settingDialog"
import { Button } from "@/components/ui/button"
import { useSettingsDialog } from "@/stores"
import { settingsRegistry, settingsTabs } from "./registry"


export default function Settings() {
    const { open, activeTab, onOpenChange, setActiveTab } = useSettingsDialog()

    const ActivePanel = settingsRegistry[activeTab].component

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger render={<Button size="icon" variant="ghost" className="cursor-pointer" />}>
                <SettingsIcon className="h-4 w-4" />
            </DialogTrigger>

            <DialogContent className="max-sm:h-full max-sm:w-full max-sm:rounded-none h-[calc(100vh-8rem)] w-[calc(100vw-8rem)] ">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-row max-sm:flex-col">
                    <div className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-2 max-sm:w-full max-sm:border-r-0 max-sm:border-b">
                        {settingsTabs.map((tabId) => {
                            const { label, icon: TabIcon } = settingsRegistry[tabId]
                            return (
                                <Button
                                    key={tabId}
                                    variant={tabId === activeTab ? "secondary" : "ghost"}
                                    className="cursor-pointer justify-start"
                                    onClick={() => setActiveTab(tabId)}
                                >
                                    <TabIcon className="h-4 w-4" />
                                    {label}
                                </Button>
                            )
                        })}
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-4">
                        {ActivePanel && <ActivePanel />}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
