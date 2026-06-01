import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Login from "./login";
import Customization from "./customization";
import { Button } from "@/components/ui/button";
import { useLocalUserStateStore, usePanelStore } from "@/stores";

type WelcomePanelProps = {
    portalContainer?: HTMLElement | null
}

export default function WelcomePanel({ portalContainer }: WelcomePanelProps) {
    const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [tempUserName, setTempUserName] = useState(useLocalUserStateStore.getState().initialized
        ? useLocalUserStateStore.getState().userState.userName
        : undefined
    )

    const slideList = [
        {
            key: "login",
            content: <Login />
        },
        {
            key: "customization",
            content: <Customization
                userName={tempUserName}
                onUserNameChange={setTempUserName}
            />
        },
    ]

    useEffect(() => {
        if (!carouselApi) return

        const updateIndex = () => {
            setActiveIndex(carouselApi.selectedScrollSnap())
        }

        updateIndex()
        carouselApi.on("select", updateIndex)
        carouselApi.on("reInit", updateIndex)

        return () => {
            carouselApi.off("select", updateIndex)
            carouselApi.off("reInit", updateIndex)
        }
    }, [carouselApi])

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

                {/* 
                  * IMPORTANT: About autofocus & Carousel
                  * AlertDialog will automatically focus the first focusable element when opened.
                  * Ensure the first slide component (e.g., Login) has at least one focusable element (like a <button> or tabIndex={0}),
                  * otherwise the dialog will find focusable elements in subsequent slides (e.g., Input in Customization),
                  * causing the Carousel to unexpectedly scroll to the second slide on initial render.
                  */}
                <Carousel className="w-100" setApi={setCarouselApi}>
                    <CarouselContent>
                        {slideList.map((slide, index) =>
                            <CarouselItem key={index}>
                                {slide.content}
                            </CarouselItem>
                        )}
                    </CarouselContent>
                </Carousel>
                <div className="flex flex-row gap-2 justify-center">
                    {slideList.map((slide, index) => (
                        <Tooltip key={index}>
                            <TooltipTrigger>
                                <div
                                    key={index}
                                    role="button"
                                    className={`h-2 w-10 rounded-full cursor-pointer transition-colors outline ${index === activeIndex ? "bg-foreground" : ""
                                        }`}
                                    onClick={() => carouselApi?.scrollTo(index)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault()
                                            carouselApi?.scrollTo(index)
                                        }
                                    }}
                                />
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{slide.key}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>

                <AlertDialogFooter >
                    {activeIndex !== 0 && (
                        <Button
                            className="cursor-pointer mr-auto"
                            onClick={() => carouselApi?.scrollTo(activeIndex - 1)}
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        className="cursor-pointer"
                        onClick={() => {
                            if (activeIndex === slideList.length - 1) {
                                useLocalUserStateStore
                                    .getState()
                                    .updateSelfState({ userName: tempUserName })
                                usePanelStore.getState().setShowWelcome(false)
                                return
                            }

                            carouselApi?.scrollTo(activeIndex + 1)
                        }}
                    >
                        {activeIndex === slideList.length - 1 ? "Confirm" : "Next"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

