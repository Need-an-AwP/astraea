package twncore

import (
	"log"

	// "github.com/pion/rtp/codecs"
	"github.com/pion/webrtc/v4"
	// "github.com/pion/webrtc/v4/pkg/media/samplebuilder"
)

const (
	MAIN_AUDIO uint8 = 0
	MAIN_VIDEO uint8 = 1
)

func (rc *RTCConnection) addTracks() {
	mainAudioTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus},
		"audio",      // id
		"main_audio", // stream id
	)
	if err != nil {
		log.Printf("[RTC] Failed to create track: %v", err)
		return
	}
	mainAudioSender, err := rc.pc.AddTrack(mainAudioTrack)
	if err != nil {
		log.Printf("[RTC] Failed to add track %s: %v", mainAudioTrack.ID(), err)
		return
	}
	rc.readRTCP(mainAudioSender)
	rc.tracks.Store(MAIN_AUDIO, mainAudioTrack)
	rc.senders.Store(MAIN_AUDIO, mainAudioSender)

	mainVideoTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeAV1},
		"video",      // id
		"main_video", // stream id
	)
	if err != nil {
		log.Printf("[RTC] Failed to create video track: %v", err)
		return
	}
	mainVideoSender, err := rc.pc.AddTrack(mainVideoTrack)
	if err != nil {
		log.Printf("[RTC] Failed to add video track %s: %v", mainVideoTrack.ID(), err)
		return
	}
	rc.readRTCP(mainVideoSender)
	rc.tracks.Store(MAIN_VIDEO, mainVideoTrack)
	rc.senders.Store(MAIN_VIDEO, mainVideoSender)
}

// Read incoming RTCP packets
// for interceptors processing
func (rc *RTCConnection) readRTCP(sender *webrtc.RTPSender) {
	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			if _, _, rtcpErr := sender.Read(rtcpBuf); rtcpErr != nil {
				return
			}
		}
	}()
}

func (rc *RTCConnection) handleTrack(track *webrtc.TrackRemote) {
	if track.Kind() == webrtc.RTPCodecTypeAudio &&
		track.Codec().MimeType == webrtc.MimeTypeOpus &&
		track.ID() == "audio" {
		go rc.depackAudioRTP(track)
	}

	if track.Kind() == webrtc.RTPCodecTypeVideo &&
		track.Codec().MimeType == webrtc.MimeTypeAV1 &&
		track.ID() == "video" {
		go rc.depackVideoRTP(track)
		log.Printf("[RTC] recevied av1 video track")
	}
}

func (rc *RTCConnection) depackAudioRTP(track *webrtc.TrackRemote) {
	// depacketizer := &codecs.OpusPacket{}

	// defer func() {
	// 	// 通知 JS 这个音频流已结束
	// 	if rc.rtcManager != nil {
	// 		rc.rtcManager.invokeAudioTrackEndCallback(rc.peerIP)
	// 		return
	// 	}
	// 	// (extremely defensive) fallback if rtcManager is nil
	// 	endCallback := js.Global().Get("onAudioTrackEnd")
	// 	if endCallback.Type() == js.TypeFunction {
	// 		endCallback.Invoke(rc.peerIP)
	// 	}
	// }()

	// for {
	// 	rtpPacket, _, readErr := track.ReadRTP()
	// 	if readErr != nil {
	// 		log.Printf("[RTC] Audio RTP read error: %v", readErr)
	// 		return
	// 	}

	// 	// depack
	// 	opusFrame, err := depacketizer.Unmarshal(rtpPacket.Payload)
	// 	if err != nil {
	// 		log.Printf("[RTC] Failed to unmarshal Opus packet: %v", err)
	// 		continue
	// 	}

	// 	// 将数据拷贝到 JS 侧
	// 	uint8Array := js.Global().Get("Uint8Array").New(len(opusFrame))
	// 	js.CopyBytesToJS(uint8Array, opusFrame)

	// 	// call JS callback
	// 	rc.rtcManager.invokeOpusFrameCallback(
	// 		rc.peerIP,
	// 		uint8Array,
	// 		rtpPacket.Timestamp,
	// 		rtpPacket.SequenceNumber,
	// 	)
	// }
}

func (rc *RTCConnection) depackVideoRTP(track *webrtc.TrackRemote) {
	// depacketizer := &codecs.AV1Depacketizer{}
	// codecClockRate := track.Codec().ClockRate
	// sb := samplebuilder.New(
	// 	200, // maxLate
	// 	depacketizer,
	// 	codecClockRate,
	// 	// samplebuilder.WithPacketReleaseHandler(func(p *rtp.Packet) {
	// 	// 	// 可选：包被释放时的回调
	// 	// }),
	// )

	// defer func() {
	// 	// 通知 JS 这个视频流已结束
	// 	if rc.rtcManager != nil {
	// 		rc.rtcManager.invokeVideoTrackEndCallback(rc.peerIP)
	// 		return
	// 	}
	// 	// fallback
	// 	endCallback := js.Global().Get("onVideoTrackEnd")
	// 	if endCallback.Type() == js.TypeFunction {
	// 		endCallback.Invoke(rc.peerIP)
	// 	}
	// }()

	// // 由于RTP规范要求媒体流的初始RTP时间戳起始于一个随机值，
	// // 所以为了给js侧提供一个相对时间戳，我们需要记录第一个RTP包的时间戳作为起点
	// // cause RTP timestamp starts with a random value, 
	// // we need to record the first RTP packet's timestamp as the start point 
	// // to provide relative timestamps to JS side
	// var startRtpTimestamp uint32
	// var hasStartRtpTimestamp bool
	
	// for rtp, _, readErr := track.ReadRTP(); readErr == nil; rtp, _, readErr = track.ReadRTP() {
	// 	sb.Push(rtp)
	// 	for sample := sb.Pop(); sample != nil; sample = sb.Pop() {
	// 		if !hasStartRtpTimestamp {
	// 			startRtpTimestamp = sample.PacketTimestamp
	// 			hasStartRtpTimestamp = true
	// 		}

	// 		// copy data to JS
	// 		uint8Array := js.Global().Get("Uint8Array").New(len(sample.Data))

	// 		// calcu relative timestamp in microseconds
	// 		timestampDiff := sample.PacketTimestamp - startRtpTimestamp
	// 		microSecondTimestamp := (uint64(timestampDiff) * 1_000_000) / uint64(codecClockRate)

	// 		js.CopyBytesToJS(uint8Array, sample.Data)
	// 		rc.rtcManager.invokeAV1FrameCallback(
	// 			rc.peerIP,
	// 			uint8Array,
	// 			rc.isAV1Keyframe(sample.Data),
	// 			microSecondTimestamp,
	// 		)
	// 	}
	// }
}

func (rc *RTCConnection) isAV1Keyframe(data []byte) bool {
	isKeyframe := false
	idx := 0

	// 按照 AV1 OBU (Open Bitstream Unit) 格式规范准确解析
	for idx < len(data) {
		header := data[idx]
		obuType := (header >> 3) & 0x0F
		hasExtension := (header & 0x04) != 0
		hasSize := (header & 0x02) != 0

		if obuType == 1 { // OBU_SEQUENCE_HEADER 意味着这是 Keyframe
			isKeyframe = true
			break
		}

		idx++
		if hasExtension {
			idx++
		}

		if hasSize {
			size := 0
			shift := 0
			for idx < len(data) {
				b := data[idx]
				idx++
				size |= int(b&0x7f) << shift
				if b&0x80 == 0 {
					break
				}
				shift += 7
			}
			idx += size
		} else {
			break // 没有 size 字段，意味着该 OBU 延伸到包尾
		}
	}
	// log.Printf("[AV1 track] Sample size: %d, isKeyframe: %v", len(data), isKeyframe)
	return isKeyframe
}
