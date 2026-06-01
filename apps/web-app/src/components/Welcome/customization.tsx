import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LoaderCircle, X } from "lucide-react";
import { useLocalUserStateStore } from "@/stores"

type CustomizationProps = {
    userName: string | undefined
    onUserNameChange: (value: string) => void
}

export default function Customization({ userName, onUserNameChange }: CustomizationProps) {
    return (
        <div className="p-2 select-none">
            <Card className="w-full max-w-md border-foreground/10 bg-linear-to-b from-muted/40 via-background to-background">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-lg tracking-wide">Profile Customization</CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Choose an avatar and set a display name.
                    </p>
                </CardHeader>
                <Separator />
                <CardContent className="flex flex-col items-center gap-6 p-6">
                    <Popover>
                        <PopoverTrigger className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-linear-to-tr from-foreground/10 to-transparent blur-md" />
                                <Avatar className="relative h-32 w-32 cursor-pointer ring-2 ring-foreground/10 transition hover:opacity-90">
                                    <AvatarImage src={useLocalUserStateStore.getState().userState.userAvatar} draggable={false} />
                                    <AvatarFallback>
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Change avatar
                            </span>
                        </PopoverTrigger>
                        <PopoverContent
                        // onCloseAutoFocus={(e) => e.preventDefault()}
                        // onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            {/* <AvatarSelector currentAvatar={userState.userAvatar} setCurrentAvatar={setAvatar} /> */}
                        </PopoverContent>
                    </Popover>

                    <div className="flex w-full flex-col gap-2">
                        <Label htmlFor="username" className="text-sm font-semibold tracking-wide">
                            User name
                        </Label>
                        <Input
                            id="username"
                            placeholder="Enter your user name"
                            value={userName}
                            disabled={userName === undefined}
                            onChange={(e) => {
                                onUserNameChange(e.target.value)
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            This is how others will see you in rooms and invites.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}