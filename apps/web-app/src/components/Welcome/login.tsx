import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { KeyRound, User, LoaderCircle, ArrowLeft } from "lucide-react";


export default function Login() {
    const cardClassName = `
    flex flex-col w-full h-full items-center justify-center text-center p-4
    cursor-pointer hover:bg-muted/50 hover:ring-1 transition-all duration-300 
    `

    return (
        <div className="p-1 h-full">
            <div className="flex flex-col h-full items-center justify-center rounded-xl outline select-none">
                <button
                    className={cardClassName + "rounded-t-xl"}
                >
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <CardTitle className="text-base">Account Login</CardTitle>
                    <CardDescription className="text-sm">
                        Sign in with your Tailscale account
                    </CardDescription>
                </button>

                <Separator />

                <button
                    className={cardClassName + "rounded-b-xl"}
                >
                    <KeyRound className="w-8 h-8 mx-auto mb-2" />
                    <CardTitle className="text-base">Auth Key Login</CardTitle>
                    <CardDescription className="text-sm">
                        Use authentication key directly
                    </CardDescription>
                </button>
            </div>
        </div>
    )
}