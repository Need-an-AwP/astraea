export interface IWailsWindow {
    closeWindow: () => void;
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    unmaximizeWindow: () => void;
    resizeWindow: (width: number, height: number) => void;
    setAlwaysOnTop: (alwaysOnTop: boolean) => void;
}