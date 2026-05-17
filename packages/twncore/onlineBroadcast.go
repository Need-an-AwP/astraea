package twncore

import (
	"encoding/json"
	"log"
	"net"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	kcpPort           = 8850
	msgPort           = 8849
	rtcPort           = 8848
	broadcastInterval = 2 * time.Second
	cleanupInterval   = 10 * time.Second
	peerTimeout       = 4 * time.Second
)

type onlineManager struct {
	core         *core
	messageBytes []byte
	onlinePeers  sync.Map // map[string]*PeerInfo
	msgConn      net.PacketConn
	rtcConn      net.PacketConn
	kcpConnS     net.PacketConn
	kcpConnC     net.PacketConn
	kcpSessions  sync.Map // map[string]*kcp.UDPSession
	peerInfoCh   chan *PeerInfo
}

type NodeInfo struct {
	Hostname    string `json:"hostname"`
	StartTime   int64  `json:"start_time"`
	RandomID    uint64 `json:"random_id"`
	TailscaleIP string `json:"tailscale_ip"`
	Platform	string `json:"platform"`
}

type PeerInfo struct {
	ReceivedAt time.Time `json:"received_at"`
	NodeInfo   NodeInfo  `json:"node_info"`
}

func (c *core) initOnlineManager(nodeInfo NodeInfo) *onlineManager {
	if nodeInfo == (NodeInfo{}) {
		log.Println("[TWN-onlineManager] initOnlineManager failed: nodeInfo is empty")
		return nil
	}

	// prepare self identification message
	message := map[string]interface{}{
		"type":      "node_info",
		"node_info": nodeInfo,
	}
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("[TWN-onlineManager] Failed to marshal broadcast data: %v", err)
		return nil
	}

	om := &onlineManager{
		core:         c,
		messageBytes: messageBytes,
		peerInfoCh:   make(chan *PeerInfo, 100),
	}

	go om.startUDPListener()
	return om
}

func (om *onlineManager) startUDPListener() {
	// Define connection configurations
	type connConfig struct {
		port    int
		name    string
		connPtr *net.PacketConn
	}

	configs := []connConfig{
		{rtcPort, "data", &om.rtcConn}, // for pion webrtc
		{msgPort, "message", &om.msgConn},
		{kcpPort, "kcpConnS", &om.kcpConnS},     // for kcp server side
		{kcpPort + 1, "kcpConnC", &om.kcpConnC}, // for kcp client side
	}

	// Initialize all connections
	var createdConns []net.PacketConn
	for _, cfg := range configs {
		conn, err := om.core.ts.CreateUDPConn(cfg.port)
		if err != nil {
			log.Printf("[TWN-onlineManager] Failed to create %s UDP conn: %v", cfg.name, err)
			// Close all previously created connections
			for _, c := range createdConns {
				c.Close()
			}
			return
		}

		// log udp info
		// conn = &DebugPacketConn{PacketConn: conn, Name: strings.ToUpper(cfg.name)}
		// 浏览器下测试得到的mtu为1200字节

		*cfg.connPtr = conn
		createdConns = append(createdConns, conn)
		log.Printf("[TWN-onlineManager] %s UDP listener starts on %d", cfg.name, cfg.port)
	}

	// Clean up on exit
	defer func() {
		for _, cfg := range configs {
			if *cfg.connPtr != nil {
				(*cfg.connPtr).Close()
				*cfg.connPtr = nil
			}
		}
	}()

	////////////////////// start ///////////////////////
	go om.initKcp()
	go om.core.initWebRTC()
	go om.startOnlineBroadcast()
	///////////////////////////////////////////////////

	buf := make([]byte, 2048)
	for {
		content, remoteAddr, err := om.msgConn.ReadFrom(buf)
		if err != nil {
			if !strings.Contains(err.Error(), "closed") {
				log.Printf("[TWN-onlineManager] UDP read error: %v", err)
			}
			return
		}

		var message map[string]interface{}
		if err := json.Unmarshal(buf[:content], &message); err != nil {
			log.Printf("[TWN-onlineManager] Failed to unmarshal message from %s: %v", remoteAddr, err)
			continue
		}

		// log.Printf("received message: %v", message)
		if messageType, ok := message["type"].(string); ok {
			switch messageType {
			case "node_info":
				if nodeInfoRaw, ok := message["node_info"].(map[string]interface{}); ok {

					tailscaleIP, hasIP := nodeInfoRaw["tailscale_ip"].(string)
					hostname, hasHostname := nodeInfoRaw["hostname"].(string)

					if !hasIP || !hasHostname || tailscaleIP == "" || hostname == "" {
						log.Printf("[TWN-onlineManager] Invalid node_info from %s: missing required fields", remoteAddr)
						continue
					}

					// 从map重建NodeInfo结构体
					nodeInfo := NodeInfo{
						Hostname:    hostname,
						TailscaleIP: tailscaleIP,
					}

					// 处理可选的数值字段
					if startTime, ok := nodeInfoRaw["start_time"].(float64); ok {
						nodeInfo.StartTime = int64(startTime)
					}
					if randomID, ok := nodeInfoRaw["random_id"].(float64); ok {
						nodeInfo.RandomID = uint64(randomID)
					}

					peerInfo := &PeerInfo{
						ReceivedAt: time.Now(),
						NodeInfo:   nodeInfo,
					}

					// update online peers list
					om.onlinePeers.Store(nodeInfo.TailscaleIP, peerInfo)
					// log.Print("Updated online peer:", nodeInfo.TailscaleIP)

					// info kcp coordinator by non-blocking send
					select {
					case om.peerInfoCh <- peerInfo:
					default:
						// drop if the channel is full to avoid blocking the UDP listener
						// 缓冲区满时丢弃，防止UDP协程卡死
					}

					// notify JS about UDP packet received
					// if i.callbacks.Type() == js.TypeObject {
					// 	notifyUdpReceived := i.callbacks.Get("notifyUdpReceived")
					// 	if notifyUdpReceived.Type() == js.TypeFunction {
					// 		notifyUdpReceived.Invoke(tailscaleIP)
					// 	}
					// }
				}
			default:
				log.Printf("[TWN-onlineManager] Unknown message type from %s: %s", remoteAddr, messageType)
			}
		}

	}
}

func (om *onlineManager) startOnlineBroadcast() {
	go func() {
		ticker := time.NewTicker(broadcastInterval)
		defer ticker.Stop()

		for range ticker.C {
			for _, peerIP := range om.core.ts.GetOnlinePeerIPs() {
				go om.sendUDPMessage(peerIP, om.messageBytes)
			}
		}
	}()
}

func (om *onlineManager) sendUDPMessage(ip string, content []byte) {
	if om == nil || om.msgConn == nil {
		return
	}

	targetAddr, err := net.ResolveUDPAddr("udp", net.JoinHostPort(ip, strconv.Itoa(msgPort)))
	if err != nil {
		log.Printf("[TWN-onlineManager] Failed to resolve UDP address for %s: %v", ip, err)
		return
	}

	_, err = om.msgConn.WriteTo(content, targetAddr)
	if err != nil {
		log.Printf("[TWN-onlineManager] Failed to send UDP message to %s: %v", targetAddr.String(), err)
	}
}
