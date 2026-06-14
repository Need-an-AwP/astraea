import { useEffect, useMemo, useState } from "react";
import validateTsAuthKey from "@/utils/validateTsAuthKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { RiDiceFill } from "react-icons/ri";
import { useAuthStore } from "@/stores";


export default function AuthkeyLogin() {
    const { hostname, setHostname, authKey, setAuthKey, clearAuthKey } = useAuthStore();
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
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="node-hostname" className="text-base font-medium">
                    identify device name
                </Label>
                <div className="flex items-center space-x-2">
                    <Input
                        id="node-hostname"
                        value={hostname}
                        onChange={(e) => setHostname(e.target.value)}
                        placeholder="Example: my-powerful-desktop"
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
                <p className="text-sm text-muted-foreground">
                    This is the name your device will use on the Tailscale network.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="tailscale-auth-key" className="text-base font-medium">
                    Tailscale authentication key
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
                <p className="text-sm text-muted-foreground">
                    authentication key for joining Tailscale network
                </p>
            </div>

            <div className="w-full flex justify-center">
                <Button
                    className="p-4"
                    disabled={!isValidKey || authKeyInput.length === 0}
                    onClick={() => {
                        setAuthKey(authKeyInput, 'idb');
                    }}
                >
                    Login with Auth Key
                </Button>
            </div>
        </div>
    )
}