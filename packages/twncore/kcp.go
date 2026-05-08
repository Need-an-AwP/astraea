package twncore

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"strconv"

	"github.com/xtaci/kcp-go/v5"
)

func (om *onlineManager) initKcp() {
	om.createKcpListener()
}

func setKcpConnParam(conn *kcp.UDPSession) {
	// 设置KCP参数
	conn.SetMtu(1000) // 设置最大传输单元
	// conn.SetStreamMode(true)
	conn.SetNoDelay(1, 10, 2, 1)
	// nodelay: 1（启用无延迟模式）
	// interval: 10ms（内部刷新间隔）
	// resend: 2（快速重传模式）
	// nc: 1（关闭拥塞控制）
	conn.SetWindowSize(128, 128) // 设置发送和接收窗口大小
}

func (om *onlineManager) readKcpLoop(conn *kcp.UDPSession, peerIP string, side string) {
	for {
		// 读取4字节长度前缀
		lengthBuf := make([]byte, 4)
		if _, err := io.ReadFull(conn, lengthBuf); err != nil {
			log.Printf("[KCP %s] Read length error from %s: %v", side, peerIP, err)
			return
		}

		msgLength := uint32(lengthBuf[0])<<24 | uint32(lengthBuf[1])<<16 |
			uint32(lengthBuf[2])<<8 | uint32(lengthBuf[3])

		// use io.ReadFull to ensure read full message
		msgBuf := make([]byte, msgLength)
		if _, err := io.ReadFull(conn, msgBuf); err != nil {
			log.Printf("[KCP %s] Read message error from %s: %v", side, peerIP, err)
			return
		}

		om.handleKcpMessage(peerIP, msgBuf)
	}
}

// server
func (om *onlineManager) createKcpListener() {
	if om.kcpConnS == nil {
		log.Printf("[KCP] ERROR: kcpConn is nil, cannot initialize KCP")
		return
	}

	listener, err := kcp.ServeConn(nil, 0, 0, om.kcpConnS)
	if err != nil {
		log.Printf("[KCP] Failed to start KCP listener: %v", err)
		return
	}

	go func() {
		for {
			conn, err := listener.AcceptKCP()
			if err != nil {
				log.Printf("[KCP] Failed to accept KCP connection: %v", err)
				return
			}

			peerIP, _, err := net.SplitHostPort(conn.RemoteAddr().String())
			if err != nil {
				log.Printf("[KCP] Failed to parse peer IP: %v", err)
				continue
			}

			if _, exists := om.kcpSessions.Load(peerIP); exists {
				// log.Printf("[KCP] Connection from %s already exists, skipping", peerIP)
				conn.Close()
				continue
			}

			// log.Printf("[KCP] Accepted connection from %s", peerIP)
			om.kcpSessions.Store(peerIP, conn)

			go func() {
				defer func() {
					log.Printf("[KCP] Closing connection from %s", peerIP)
					conn.Close()
					om.kcpSessions.Delete(peerIP)
				}()
				setKcpConnParam(conn)
				om.readKcpLoop(conn, peerIP, "Server")
			}()
		}
	}()
}

// client
func (om *onlineManager) createKcpConnection(peerIP string) error {
	if om.kcpConnC == nil {
		return fmt.Errorf("[KCP] kcpConn is nil, cannot create KCP connection")
	}

	// no need check again maybe
	if _, exists := om.kcpSessions.Load(peerIP); exists {
		log.Printf("[KCP] Connection to %s already exists, skipping", peerIP)
		return nil
	}

	peerAddr, err := net.ResolveUDPAddr("udp", net.JoinHostPort(peerIP, strconv.Itoa(kcpPort)))
	if err != nil {
		log.Printf("[KCP] Failed to resolve UDP address for %s: %v", peerIP, err)
		return err
	}

	conn, err := kcp.NewConn2(peerAddr, nil, 0, 0, om.kcpConnC)
	if err != nil {
		log.Printf("[KCP] Failed to dial KCP connection to %s: %v", peerIP, err)
		return err
	}

	// TODO: comfirm the kcp connection is really established, maybe add a handshake message

	// log.Printf("[KCP] Successfully dialed %s, connection established", peerIP)
	om.kcpSessions.Store(peerIP, conn)

	// activately create rtc connection only on offer side
	go om.core.rtcManager.createConnection(OFFER, peerIP, nil)

	go func() {
		defer func() {
			conn.Close()
			om.kcpSessions.Delete(peerIP)
		}()
		setKcpConnParam(conn)
		om.readKcpLoop(conn, peerIP, "Client")
	}()

	return nil
}

func (om *onlineManager) handleKcpMessage(peerIP string, content []byte) {
	// log.Printf("[KCP] Received message from %s: %s", peerIP, string(content))

	var baseMessage struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(content, &baseMessage); err != nil {
		log.Printf("[KCP] Failed to unmarshal base message from %s: %v", peerIP, err)
		return
	}

	switch baseMessage.Type {
	case "offer_ice", "answer_ice":
		om.handleSdpIceMessage(peerIP, content, baseMessage.Type)
	case "direct_rtc_signal":
		log.Printf("[KCP] received direct RTC message (%s) from %s", baseMessage.Type, peerIP)
		// om.core.rtcManager.invokeDirectRTCMessageCallback(peerIP, string(content))
	default:
		log.Printf("[KCP] Unknown message type from %s: %s", peerIP, baseMessage.Type)
	}
}

func (om *onlineManager) handleSdpIceMessage(peerIP string, content []byte, messageType string) {
	var message sdpIceMessage
	if err := json.Unmarshal(content, &message); err != nil {
		log.Printf("[KCP] Failed to unmarshal sdpIceMessage from %s: %v", peerIP, err)
		return
	}

	role := OFFER
	if messageType == "answer_ice" {
		role = ANSWER
	}

	log.Printf("[KCP] Processing %s from %s, role: %s", messageType, peerIP, role)

	if role == OFFER {
		go om.core.rtcManager.createConnection(ANSWER, peerIP, &message.SDPWithICE)
	} else {
		om.core.rtcManager.handleAnswer(peerIP, &message.SDPWithICE)
	}
}

func (om *onlineManager) sendKcpMessage(peerIP string, payload interface{}) {
	// log.Printf("[KCP] Sending message to %s: %s", peerIP, payload)

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[RTC] Failed to marshal JSON: %v", err)
		return
	}

	if c, exists := om.kcpSessions.Load(peerIP); exists {
		conn := c.(*kcp.UDPSession)

		length := uint32(len(jsonData))
		lengthBuf := []byte{
			byte(length >> 24),
			byte(length >> 16),
			byte(length >> 8),
			byte(length),
		}

		// send length info
		if _, err := conn.Write(lengthBuf); err != nil {
			log.Printf("[KCP] Failed to send length prefix to %s: %v", peerIP, err)
			return
		}

		// send actual data
		if _, err := conn.Write(jsonData); err != nil {
			log.Printf("[KCP] Failed to send message to %s: %v", peerIP, err)
		}
	} else {
		log.Printf("[KCP] No KCP session found for %s", peerIP)
	}
}
