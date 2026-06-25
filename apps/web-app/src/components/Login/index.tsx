import { useEffect, useState, useMemo } from "react";
import {
    AlertDialog, AlertDialogContent, AlertDialogHeader,
    AlertDialogTitle, AlertDialogDescription, AlertDialogFooter
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { KeyRound, User, LoaderCircle, ArrowLeft } from "lucide-react";
import { useLocalUserStateStore, usePanelStore } from "@/stores";
import AuthkeyLogin from "./authkeyLogin";
import AccountLogin from "./accountLogin";


export default function LoginPanel() {
    const [loginMethod, setLoginMethod] = useState<"account" | "authkey" | null>(null)

    const cardClassName = `
    flex flex-col w-full h-full items-center justify-center text-center p-4
    cursor-pointer hover:bg-muted/50 hover:ring-1 transition-all duration-300 
    `

    const GoBackButton = () => (
        <div className="group absolute top-4 left-4">
            <Button
                className="absolute left-0 top-0 cursor-pointer justify-start overflow-hidden 
                px-0 transition-[width] duration-300 ease-out group-hover:w-60"
                variant="outline"
                size="icon"
                onClick={() => setLoginMethod(null)}
                aria-label="choose another login method"
            >
                <span className="flex h-full w-8 shrink-0 items-center justify-center">
                    <ArrowLeft className="size-4" />
                </span>
                <span className="whitespace-nowrap pr-3 text-sm opacity-0 
                transition-all duration-200 ease-out group-hover:opacity-100 group-hover:delay-75">
                    choose another login method
                </span>
            </Button>
        </div>
    )

    return (
        <AlertDialog open={usePanelStore(state => state.showWelcome)}>
            <AlertDialogContent
                className="w-auto max-w-none"
                size="auto"
            >
                <AlertDialogTitle className="text-center font-bold">
                    Login
                </AlertDialogTitle>

                <div className="w-100 h-100 mb-4">
                    <div className="relative flex flex-col h-full items-center justify-center rounded-xl outline select-none">
                        {loginMethod === null
                            ? (
                                <>
                                    <button
                                        className={cardClassName + "rounded-t-xl"}
                                        onClick={() => setLoginMethod("account")}
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
                                        onClick={() => setLoginMethod("authkey")}
                                    >
                                        <KeyRound className="w-8 h-8 mx-auto mb-2" />
                                        <CardTitle className="text-base">Auth Key Login</CardTitle>
                                        <CardDescription className="text-sm">
                                            Use authentication key directly
                                        </CardDescription>
                                    </button>
                                </>
                            ) : (
                                <div className="flex w-full flex-col items-stretch justify-center p-4">
                                    <GoBackButton />
                                    <div className="w-full">
                                        {loginMethod === "account" ? <AccountLogin /> : <AuthkeyLogin />}
                                    </div>
                                </div>
                            )
                        }

                    </div>
                </div>

            </AlertDialogContent>
        </AlertDialog>
    )
}

