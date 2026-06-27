import { useAudioDeviceStore, useAudioProcessing } from '@/stores'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '../ui/label'


export default function AudioSettings() {
    const {
        inputDevices, selectedInput, setSelectedInput,
        outputDevices, selectedOutput, setSelectedOutput,
    } = useAudioDeviceStore()


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
            </div>
        </div>
    )
}
