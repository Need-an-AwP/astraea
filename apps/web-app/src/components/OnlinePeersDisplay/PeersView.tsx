import { memo, use, useMemo, useRef, useState } from 'react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronUp, Dot, Menu } from 'lucide-react';
import {
    useTsSelf, useTsPeer, useConnections,
    useRemoteUsersStore, useLocalUserStateStore
} from '@/stores';
import PeerItem from './PeerItem'

const PeersView = () => {
    const [displayOption, setDisplayOption] = useState<"all" | "online" | "users">("all");
    const [menuOpen, setMenuOpen] = useState(false);
    const tsPeers = useTsPeer();
    const tsSelf = useTsSelf();
    const { peers } = useRemoteUsersStore()
    const { userState } = useLocalUserStateStore()
    const connections = useConnections();
    const topRef = useRef<HTMLDivElement>(null);

    const sortedPeerEntries = useMemo(() => {
        if (!tsPeers) return [];

        return Object.entries(tsPeers)
            .map(([nodekey, peer]) => ({ nodekey, peer }))
            .filter(({ peer }) => peer)
            .sort((a, b) => {
                const aIP = a.peer?.TailscaleIPs?.[0];
                const bIP = b.peer?.TailscaleIPs?.[0];
                if (!aIP || !bIP) return 0;

                const aHasUser = !!peers[aIP];
                const bHasUser = !!peers[bIP];

                if (aHasUser && !bHasUser) return -1;
                if (!aHasUser && bHasUser) return 1;
                return 0;
            });
    }, [tsPeers, peers]);

    const localPeer = useMemo(() => {
        if (!tsSelf) return null;
        return tsSelf;
    }, [tsSelf]);

    return (
        <div className="group relative flex-1 overflow-auto">
            <ScrollArea className="h-full w-full" scrollBarClassName={`opacity-0 group-hover:opacity-100 transition-opacity`}>
                <div ref={topRef} />
                {/* local user and machine */}
                {localPeer && (
                    <PeerItem
                        key="local-self"
                        peerStatus={localPeer}
                        userState={userState}
                        isSelf={true}
                    />
                )}

                {/* remote peers */}
                {sortedPeerEntries.map(({ nodekey, peer }) => {
                    if (!peer) return null;
                    if (displayOption === "online" && !peer.Online) return null;

                    const peerIP = peer.TailscaleIPs[0]
                    const userState = peers[peerIP]
                    const connectionStatus = connections[peerIP]
                    if (displayOption === "users" && !userState) return null;

                    return <PeerItem
                        key={nodekey}
                        peerStatus={peer}
                        userState={userState}
                        connectionStatus={connectionStatus}
                    />
                })}

                <div className="h-10 justify-center items-center flex">
                    <Button className="" variant='ghost' size='icon' onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                        <ChevronUp />
                    </Button>
                </div>
            </ScrollArea>
            <div className='absolute bottom-0 right-0'>
                <div className={`flex gap-2 mx-2 transition-opacity ${menuOpen ? 'opacity-100' : 'group-hover:opacity-100 opacity-0'}`}>
                    <DropdownMenu onOpenChange={setMenuOpen}>
                        <DropdownMenuTrigger render={
                            <Button
                                className="cursor-pointer"
                                variant="default"
                                size="icon"
                            >
                                <Menu />
                            </Button>
                        } />
                        <DropdownMenuContent className="w-64">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Display Mode</DropdownMenuLabel>
                                <DropdownMenuLabel>Filter</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={displayOption} onValueChange={setDisplayOption}>
                                    <DropdownMenuRadioItem value="online">
                                        Only display online machines
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="users">
                                        Only display users
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="all">
                                        Display all
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </div>
    )
}

export default PeersView