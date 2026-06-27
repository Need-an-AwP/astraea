import { useEffect, useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useLocalUserStateStore } from "@/stores"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoaderCircle, RefreshCcw } from "lucide-react"
import { FaGithub, FaGoogle, FaTelegram, FaTwitch, FaYoutube, } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";


export default function UserProfile() {
    const { userState, updateSelfState, initialized } = useLocalUserStateStore()
    const [localUserName, setLocalUserName] = useState(userState.userName)
    const [localAvatar, setLocalAvatar] = useState(userState.userAvatar)
    const [unavatarPlatform, setUnavatarPlatform] = useState("")
    const [unavatarUserName, setUnavatarUserName] = useState("")

    useEffect(() => {
        if (!initialized) return
        setLocalUserName(userState.userName)
        setLocalAvatar(userState.userAvatar)
    }, [initialized, userState.userName, userState.userAvatar])

    useEffect(() => {
        if (!unavatarPlatform || !unavatarUserName) return
        setLocalAvatar(`https://unavatar.io/${unavatarPlatform}/${unavatarUserName}`)
    }, [unavatarPlatform, unavatarUserName])

    const unavatarPlatforms = [
        { name: "GitHub", value: "github", icon: <FaGithub className="w-4 h-4" /> },
        { name: "Google", value: "google", icon: <FaGoogle className="w-4 h-4" /> },
        { name: "Telegram", value: "telegram", icon: <FaTelegram className="w-4 h-4" /> },
        { name: "Twitch", value: "twitch", icon: <FaTwitch className="w-4 h-4" /> },
        { name: "X/Twitter", value: "x", icon: <FaXTwitter className="w-4 h-4" /> },
        { name: "YouTube", value: "youtube", icon: <FaYoutube className="w-4 h-4" /> },
    ]

    const selectedPlatform = useMemo(() => {
        return unavatarPlatforms.find((platform) => platform.value === unavatarPlatform)
    }, [unavatarPlatform])

    const hasChanges = useMemo(() => {
        return localUserName.trim() !== userState.userName || localAvatar.trim() !== userState.userAvatar
    }, [localUserName, localAvatar, userState.userName, userState.userAvatar])

    const generateRandomAvatarFromDiceBear = () => {
        const seedList = [
            "Jameson", "Easton", "Katherine",
            "Ethan", "John", "Michael",
            "David", "Eliza", "Olivia",
            "Emma", "Ava", "Isabella",
            "Oliver", "Charlotte", "Elijah",
            "Aria", "Liam", "Mia",
        ]
        const randomSeed = seedList[Math.floor(Math.random() * seedList.length)] + Math.random().toString(36).substring(2, 15)
        const diceBearUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${randomSeed}`
        setLocalAvatar(diceBearUrl)
    }

    const resetDraft = () => {
        setLocalUserName(userState.userName)
        setLocalAvatar(userState.userAvatar)
        setUnavatarPlatform("")
        setUnavatarUserName("")
    }

    const saveDraft = () => {
        const finalUserName = localUserName.trim()
        const finalAvatar = localAvatar.trim()
        updateSelfState({
            userName: finalUserName,
            userAvatar: finalAvatar,
        })
    }

    return (
        <div className="w-full h-full flex justify-center">
            <div className="relative flex max-w-xl flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label>User Name</Label>
                    <Input
                        value={localUserName}
                        onChange={(e) => setLocalUserName(e.target.value)}
                        placeholder="Enter your user name"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Avatar</Label>
                    <div className="flex items-center gap-3">
                        <Avatar className="size-32 shrink-0">
                            <AvatarImage src={localAvatar} draggable={false} />
                            <AvatarFallback>
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            </AvatarFallback>
                        </Avatar>
                        <Button type="button" variant="outline" onClick={generateRandomAvatarFromDiceBear}>
                            <RefreshCcw />
                            Random Avatar
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="avatar-url">Avatar URL</Label>
                    <Input
                        id="avatar-url"
                        value={localAvatar}
                        onChange={(e) => setLocalAvatar(e.target.value)}
                        placeholder="https://example.com/avatar.png"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Use avatar from platform</Label>
                    <div className="flex gap-2">
                        <Select value={unavatarPlatform} onValueChange={(value) => setUnavatarPlatform(value ?? "")}>
                            <SelectTrigger className="w-52">
                                {selectedPlatform ? (
                                    <div className="flex items-center gap-2">
                                        {selectedPlatform.icon}
                                        {selectedPlatform.name}
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Select platform" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                {unavatarPlatforms.map((platform) => (
                                    <SelectItem value={platform.value} key={platform.value}>
                                        <div className="flex items-center gap-2">
                                            {platform.icon}
                                            {platform.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            value={unavatarUserName}
                            onChange={(e) => setUnavatarUserName(e.target.value)}
                            placeholder="Platform username"
                        />
                    </div>
                </div>

                <div className="absolute bottom-0 flex flex-col gap-4 w-full">
                    <Separator />

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={saveDraft}
                            disabled={!hasChanges || !localUserName.trim() || !localAvatar.trim()}
                        >
                            Save Changes
                        </Button>
                        <Button
                            variant="outline"
                            onClick={resetDraft}
                            disabled={!hasChanges}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
                
            </div>
        </div>
    )
}