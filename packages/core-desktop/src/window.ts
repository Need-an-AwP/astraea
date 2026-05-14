import { IWailsWindow } from '@astraea/interface';
import { WindowActions } from '../bindings/astraea-desktop';

export const windowController: IWailsWindow = {

    closeWindow(): void {
        WindowActions.Close();
    },

    minimizeWindow(): void {
        WindowActions.Minimize();
    },

    maximizeWindow(): void {
        WindowActions.Maximize();
    },

    unmaximizeWindow(): void {
        WindowActions.Unmaximize();
    },

    resizeWindow(width: number, height: number): void {
        WindowActions.Resize(width, height);
    },

    setAlwaysOnTop(alwaysOnTop: boolean): void {
        WindowActions.SetAlwaysOnTop(alwaysOnTop);
    },

}