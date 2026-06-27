import { UserIcon, Mic, AudioLines } from "lucide-react"
import UserProfile from "./userProfile"
import AudioSettings from "./audioSettings"

export const settingsRegistry = {
    userProfile: {
        label: "User Profile",
        icon: UserIcon,
        component: UserProfile,
    },
    audioSettings: {
        label: "Audio Settings",
        icon: AudioLines,
        component: AudioSettings,
    },
    audioSettings2: {
        label: "Output Settings",
        icon: Mic,
        component: null,
    },
} as const

export type SettingsTabId = keyof typeof settingsRegistry

export const settingsTabs = Object.keys(settingsRegistry) as SettingsTabId[]