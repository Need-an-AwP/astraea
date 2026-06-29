import { useEffect, useState } from 'react';
import { useAudioDeviceStore } from '@/stores'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Ear, Square, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { AudioEngine } from '@/AudioEngine'
import Spectrum from '@/components/Spectrum'


export default function AudioSettings() {
    const {
        inputDevices, selectedInput, setSelectedInput,
        outputDevices, selectedOutput, setSelectedOutput,
    } = useAudioDeviceStore()

    const [isPlayback, setIsPlayback] = useState(false);

    useEffect(() => {
        if (isPlayback) {
            AudioEngine.instance.startPlayback()
        } else {
            AudioEngine.instance.stopPlayback()
        }
    }, [isPlayback])

    return (
        <div className="w-full h-full flex justify-center">
            <div className="relative flex max-w-xl flex-col gap-4 w-full">
                <Label>Input Device</Label>
                <Select value={selectedInput} onValueChange={(value) => setSelectedInput(value ?? '')}>
                    <SelectTrigger className="w-full">
                        {selectedInput ? (
                            <div className="flex items-center gap-2">
                                {inputDevices.find((device) => device.deviceId === selectedInput)?.label}
                            </div>
                        ) : (
                            <SelectValue placeholder="Select input device" />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {inputDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Spectrum />

                <Label>Output Device</Label>
                <Select value={selectedOutput} onValueChange={(value) => setSelectedOutput(value ?? '')}>
                    <SelectTrigger className="w-full">
                        {selectedOutput ? (
                            <div className="flex items-center gap-2">
                                {outputDevices.find((device) => device.deviceId === selectedOutput)?.label}
                            </div>
                        ) : (
                            <SelectValue placeholder="Select input device" />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {outputDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 cursor-pointer w-fit"
                        onClick={() => setIsPlayback(!isPlayback)}
                    >
                        {isPlayback ? (
                            <>
                                <Square className="w-4 h-4" />
                                Stop Sidetone
                            </>
                        ) : (
                            <>
                                <Ear className="w-4 h-4" />
                                Enable Sidetone
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        <Info className="w-4 h-4 inline-block mr-1" />
                        It is highly recommended to use headphones when testing audio sidetone
                    </p>
                </div>
            </div>
        </div>
    )
}
