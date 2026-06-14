import { useAuthStore } from "@/stores"
import { Loader } from "lucide-react"

export default function Loading() {
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    if (hasHydrated) {
        return null;
    } else {
        return (
            <div
                className="absolute top-0 left-0 h-full w-full flex items-center justify-center
                bg-white/10 backdrop-blur-sm z-999"
            >
                <div className="flex flex-col items-center justify-center gap-4">
                    <Loader className="animate-spin" />
                    <span>waiting for auth credentials...</span>
                </div>
            </div>
        )
    }
}