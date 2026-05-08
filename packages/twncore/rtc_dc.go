package twncore

import (
	"log"
	"sync/atomic"
	"time"

	"github.com/pion/webrtc/v4"
)

func (rm *RTCManager) setupDcHandlers(dc *webrtc.DataChannel, peerIP string, role RTCRole) {
	var bytesReceived uint64
	startStressTest := func() {
		// 速率统计 goroutine
		go func() {
			ticker := time.NewTicker(1 * time.Second)
			defer ticker.Stop()

			for range ticker.C {
				if dc.ReadyState() != webrtc.DataChannelStateOpen {
					break
				}
				// 获取1秒内的总接收量，并将计数器清零
				currentBytes := atomic.SwapUint64(&bytesReceived, 0)
				if currentBytes > 0 {
					// 转换为 Mbps (兆比特每秒)
					mbps := (float64(currentBytes) * 8.0) / 1000000.0
					log.Printf("[RTC datachannel] Received from %s: %.2f Mbps", peerIP, mbps)
				}
			}
		}()

		// 开启极限速率的随机数据压测
		go func() {
			log.Printf("[RTC datachannel] Starting bandwidth stress test to %s", peerIP)
			buf := make([]byte, 65535) // 64KB 随机数据
			for i := range buf {
				buf[i] = byte(i)
			}
			for {
				if dc.ReadyState() != webrtc.DataChannelStateOpen {
					log.Printf("[RTC datachannel] Stress test stopped for %s", peerIP)
					break
				}

				// 核心防护：如果已缓冲超过 1MB 未发送数据，则暂停塞入，防止撑爆 WASM 的 4GB 内存上限
				if dc.BufferedAmount() > 1024*1024 {
					time.Sleep(5 * time.Millisecond)
					continue
				}

				// 发包（无需错误处理中的过度 Sleep，因为上面限制了缓冲）
				if err := dc.Send(buf); err != nil {
					time.Sleep(1 * time.Millisecond)
				}
			}
		}()
	}

	dc.OnOpen(func() {
		log.Printf("[RTC datachannel] Data channel %v to %s opened", dc.Label(), peerIP)

		// FOR TEST
		// stress test
		startStressTest()

		// only assume connection astablished when data channel is open
		rm.core.events.Emit(EventConnectionState, ConnectionStatePayload{
			PeerIP: peerIP,
			Role:   role,
			State:  "connected",
		})
	})

	dc.OnMessage(func(msg webrtc.DataChannelMessage) {
		// 忽略二进制包，防止前端每秒几千次 JSON.parse 解析失败把主线程卡死
		if !msg.IsString {
			// 累加测试接收到的字节
			atomic.AddUint64(&bytesReceived, uint64(len(msg.Data)))
			return
		}
		// log.Printf("[RTC datachannel] Message from %s", peerIP)
		// return message to JS callback
		rm.core.events.Emit(EventDataChannelMessage, DataChannelMessagePayload{peerIP, string(msg.Data)})
	})

	dc.OnClose(func() {
		log.Printf("[RTC datachannel] Data channel %v closed", dc.Label())
	})
}

func (rm *RTCManager) SendByDataChannel(peerIP string, content string) {
	rm.connections.Range(func(key any, value any) bool {
		connection := value.(*RTCConnection)
		if connection.peerIP == peerIP &&
			connection.dc != nil {
			if connection.dc.ReadyState() != webrtc.DataChannelStateOpen {
				log.Printf("[RTC datachannel] Failed to send message to %s due to data channel not open", peerIP)
				return false
			}
			if err := connection.dc.SendText(content); err != nil {
				log.Printf("[RTC datachannel] Failed to send message to %s: %v", peerIP, err)
			}
			return false
		}
		return true
	})
}
