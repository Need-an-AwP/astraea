import { create } from 'zustand'
import type { PanelImperativeHandle } from 'react-resizable-panels'

type PopoverId =
    | 'network'
    | 'setting'
    | 'appSetting'
    | 'audioCapture'
    | 'user'
    | 'tsLoading'
    | null;

interface PopoverState {
    activePopover: PopoverId;

    closeAll: () => void
    togglePopover: (popoverId: NonNullable<PopoverId>) => void;
    setActivatePopover: (popoverId: PopoverId) => void;
}

export const usePopover = create<PopoverState>((set, get) => ({
    activePopover: null,

    closeAll: () => set({ activePopover: null }),
    togglePopover: (popoverId) => set((state) =>
        state.activePopover === popoverId
            ? { activePopover: null }
            : { activePopover: popoverId }
    ),
    setActivatePopover: (popoverId) => set({ activePopover: popoverId }),
}))

interface panelState {
    showWelcome: boolean;
    leftPanelHandle: PanelImperativeHandle | null;
    rightPanelHandle: PanelImperativeHandle | null;
    setLeftPanelHandle: (ref: PanelImperativeHandle) => void;
    setRightPanelHandle: (ref: PanelImperativeHandle) => void;
    setShowWelcome: (show: boolean) => void;
}

export const usePanelStore = create<panelState>((set, get) => ({
    showWelcome: false,
    leftPanelHandle: null,
    rightPanelHandle: null,
    setLeftPanelHandle: ref => set({ leftPanelHandle: ref }),
    setRightPanelHandle: ref => set({ rightPanelHandle: ref }),
    setShowWelcome: show => set({ showWelcome: show }),
}))

import { type SettingsTabId , settingsTabs} from '@/components/Settings/registry'

interface SettingsDialogState {
    open: boolean
    activeTab: SettingsTabId

    openSettings: (tab?: SettingsTabId) => void
    closeSettings: () => void
    setActiveTab: (tab: SettingsTabId) => void
    onOpenChange: (open: boolean) => void
}

export const useSettingsDialog = create<SettingsDialogState>((set) => ({
    open: false,
    activeTab: settingsTabs[0],

    openSettings: (tab) => set((state) => ({
        open: true,
        activeTab: tab ?? state.activeTab,
    })),
    closeSettings: () => set({ open: false }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    onOpenChange: (open) => set({ open }),
}))