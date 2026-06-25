import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useLocalUserStateStore } from "@/stores"

export default function UserProfile() {
    const { userState, updateSelfState, initialized } = useLocalUserStateStore()
    const [localUserName, setLocalUserName] = useState(userState.userName)
    const [localAvatar, setLocalAvatar] = useState(userState.userAvatar)

    return (
        <div className="flex flex-row gap-2">
            <Label htmlFor="username" className="whitespace-nowrap">
                User name
            </Label>
            <Input
                id="username"
                value={localUserName}
                onChange={(e) => {
                    setLocalUserName(e.target.value)
                }}
            />
        </div>
    )
}