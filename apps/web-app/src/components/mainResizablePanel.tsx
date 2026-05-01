import { useCallback } from "react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { PanelImperativeHandle } from "react-resizable-panels";
import { usePanelStore } from "@/stores/uiStore";

export default function MainResizablePanel() {
    const setLeftPanelHandle = usePanelStore(state => state.setLeftPanelHandle);
    const onLeftRefChange = useCallback((h: PanelImperativeHandle | null) => {
        h && setLeftPanelHandle(h);
    }, [setLeftPanelHandle]);
    const setRightPanelHandle = usePanelStore(state => state.setRightPanelHandle);
    const onRightRefChange = useCallback((h: PanelImperativeHandle | null) => {
        h && setRightPanelHandle(h);
    }, [setRightPanelHandle]);


    return (
        <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel
                defaultSize='30%'
                minSize='20%'
                collapsible={true}
                panelRef={onLeftRefChange}
            >
                <div className="flex flex-col h-full justify-start">
                    <ResizablePanelGroup orientation="vertical">
                        <ResizablePanel defaultSize='40%' collapsible={true}>
                            {/* <OnlinePeersDisplay /> */}
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel>
                            {/* <VoiceChatPanel /> */}
                        </ResizablePanel>
                    </ResizablePanelGroup>


                    <div className="pt-0 mt-auto">
                        {/* <UserPanel /> */}
                    </div>
                </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel
                collapsible={true}
                panelRef={onRightRefChange}
                className="h-full"
            >
                {/* <RightPanel /> */}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}