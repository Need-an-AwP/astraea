package twncore

import (
	// "encoding/json"
	// "log"
	// "net"
	// "sync"
	// "sync/atomic"
	// "syscall/js"
	// "time"

	// "github.com/pion/interceptor"
	// "github.com/pion/interceptor/pkg/cc"
	// "github.com/pion/interceptor/pkg/gcc"
	"github.com/pion/webrtc/v4"
)

type SDPWithICE struct {
	SDP     webrtc.SessionDescription `json:"sdp"`
	ICEList []*webrtc.ICECandidate    `json:"iceList"`
}

type sdpIceMessage struct {
	Type       string     `json:"type"`
	Role       RTCRole    `json:"role"`
	SDPWithICE SDPWithICE `json:"sdpWithICE"`
}

type RTCManager struct {
}

func (c *core) initWebRTC() {
	if c.nodeInfo == (NodeInfo{}) {
		return
	}

	c.rtcManager = &RTCManager{}

	// webrtcAPI := createWebRTCAPI(i.onlineManager.dataConn, i.rtcManager)
	// i.rtcManager.api = webrtcAPI

	// i.setupJsAPI()
}

func (rm *RTCManager) createConnection(role RTCRole, peerIP string, sdpWithIce *SDPWithICE) {
}

func (rm *RTCManager) invokeDirectRTCMessageCallback(peerIP string, content string) {
}

func (rm *RTCManager) handleAnswer(peerIP string, sdpWithIce *SDPWithICE) {
}
