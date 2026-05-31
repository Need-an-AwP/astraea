import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { usePanelStore } from "@/stores";

type WelcomePanelProps = {
    portalContainer?: HTMLElement | null
}

export default function WelcomePanel({ portalContainer }: WelcomePanelProps) {
    return (
        <AlertDialog open={usePanelStore(state => state.showWelcome)}>
            <AlertDialogContent
                portalContainer={portalContainer}
                className="w-auto max-w-none"
                size="auto"
            >
                <AlertDialogTitle className="text-xl font-bold">
                    Welcome
                </AlertDialogTitle>

                <Carousel className="w-[400px]">
                    <CarouselContent>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                    <Card>
                                        <CardContent className="flex aspect-square items-center justify-center p-6">
                                            <span className="text-4xl font-semibold">{index + 1}</span>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>

                <AlertDialogFooter>
                    <Button
                        className="cursor-pointer"
                        onClick={() => usePanelStore.getState().setShowWelcome(false)}
                    >
                        Confirm
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

