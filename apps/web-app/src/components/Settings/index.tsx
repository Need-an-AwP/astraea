import { useMemo, useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Settings as SettingsIcon, UserIcon, Mic, XIcon } from "lucide-react"

import UserProfile from "./userProfile"
import { Button } from "@/components/ui/button"
import { usePortalContainer } from "@/components/portalContainer"
import { cn } from "@/lib/utils"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex items-center justify-between border-b px-4 py-3", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-title" className={cn("text-base font-medium", className)} {...props} />
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPortal container={usePortalContainer()}>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-[min(95vw,900px)] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-background text-sm text-foreground shadow-lg outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "max-sm:left-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:w-[100vw] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button variant="ghost" className="absolute right-2 top-2 h-8 w-8" size="icon-sm" />
            }
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
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
