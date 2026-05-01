const getEnvironment = (): boolean => {
    let IS_DESKTOP: boolean = false;

    // DEV ONLY: judge by chromium browser brands in `userAgentData`
    if (import.meta.env.DEV) {
        const brands = (navigator as any).userAgentData.brands;
        brands.find((b: { brand: string, version: string }) => {
            if (b.brand === 'Microsoft Edge WebView2') {
                IS_DESKTOP = true;
            }
        })
    }

    if (import.meta.env.MODE === 'desktop' || import.meta.env.MODE === 'web') {
        IS_DESKTOP = import.meta.env.MODE === 'desktop';
    }

    return IS_DESKTOP
}

export const IS_DESKTOP = getEnvironment();