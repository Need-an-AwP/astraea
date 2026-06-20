import { useEffect, useMemo, useState } from "react";
import validateTsAuthKey from "@/utils/validateTsAuthKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Info, LoaderCircle } from "lucide-react";
import { RiDiceFill } from "react-icons/ri";
import { useAuthStore } from "@/stores";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sessionManager } from "@/services/session";


const InfoIcon = ({ description }: { description: string }) => (
    <Tooltip>
        <TooltipTrigger>
            <Info className="w-4 h-4 hover:text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
            <p>{description}</p>
        </TooltipContent>
    </Tooltip>
)

export default function AuthkeyLogin() {
    const { hostname, setHostname, authKey, setAuthKey } = useAuthStore();
    const [authKeyInput, setAuthKeyInput] = useState(authKey ?? "");
    const [authKeyVisible, setAuthKeyVisible] = useState(false);

    const isValidKey = useMemo(() => validateTsAuthKey(authKeyInput), [authKeyInput]);

    useEffect(() => {
        setAuthKeyInput(authKey ?? "");
    }, [authKey]);

    const generateRandomHostname = () => {
        const randomString = Math.random().toString(36).substring(2, 10);
        setHostname(randomString);
    };

    return (
        <div className="grid w-full gap-9">
            <div className="grid gap-2">
                <Label htmlFor="node-hostname" className="text-base font-medium">
                    identify device name
                    <InfoIcon
                        description="This is the name your device will use on the Tailscale network."
                    />
                </Label>
                <div className="flex items-center space-x-2">
                    <Input
                        id="node-hostname"
                        value={hostname}
                        onChange={(e) => setHostname(e.target.value)}
                        placeholder="Example: a-random-node-name"
                    />
                    <Button
                        size="icon"
                        variant="outline"
                        title="generate random hostname"
                        className="cursor-pointer"
                        onClick={generateRandomHostname}
                    >
                        <RiDiceFill className='h-full' />
                    </Button>
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="tailscale-auth-key" className="text-base font-medium">
                    Tailscale authentication key
                    <InfoIcon
                        description="authentication key for joining specific Tailscale network"
                    />
                </Label>
                <div className="flex items-center space-x-2">
                    <Input
                        maxLength={128}
                        id="tailscale-auth-key"
                        aria-invalid={!isValidKey && authKeyInput.length > 0}
                        type="text"
                        style={{ WebkitTextSecurity: authKeyVisible ? "none" : "disc" } as React.CSSProperties}
                        value={authKeyInput}
                        onChange={(e) => setAuthKeyInput(e.target.value)}
                        placeholder="tskey-auth-..."
                    />
                    <Button
                        size="icon"
                        variant="outline"
                        title="toggle auth key visibility"
                        className="cursor-pointer"
                        onClick={() => setAuthKeyVisible(!authKeyVisible)}
                    >
                        {authKeyVisible ? <EyeOff className='h-full' /> : <Eye className='h-full' />}
                    </Button>
                </div>
            </div>

            <Button
                className="p-4 w-full cursor-pointer"
                disabled={
                    !isValidKey
                    || authKeyInput.trim().length === 0
                    || hostname.trim().length === 0
                    || useAuthStore.getState().isLoggingIn
                }
                onClick={() => {
                    setAuthKey(authKeyInput, 'idb');
                    sessionManager.login(authKeyInput, hostname);
                }}
            >
                {useAuthStore.getState().isLoggingIn
                    ? <LoaderCircle className="w-4 h-4 animate-spin" />
                    : "Login with Auth Key"
                }
            </Button>
        </div>
    )
}