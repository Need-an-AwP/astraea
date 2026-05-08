package twncore

import (
	"net"
)

type RTCRole string

const (
	OFFER  RTCRole = "offer"
	ANSWER RTCRole = "answer"
)

// Platform defines the target environment where the core is running
type Platform string

const (
	PlatformWeb     Platform = "web"
	PlatformDesktop Platform = "desktop"
)

type core struct {
	// apis
	ts     TailscaleAdapter
	events EventAdapter

	// env
	platform Platform

	nodeInfo      NodeInfo
	onlineManager *onlineManager
	rtcManager    *RTCManager
}

// Tailscale upstream adapter
type TailscaleAdapter interface {
	// create a updConn on the tailscale node
	CreateUDPConn(port int) (net.PacketConn, error)
	// get all online tailscale peers' IPs, used for UDP broadcast
	GetOnlinePeerIPs() []string
}

// js downstream
type EventAdapter interface {
	Emit(eventName EventType, data any)
	MediaDataPipeline()
}

type EventType string
type ConnectionStatePayload struct {
	PeerIP string  `json:"peerIP"`
	Role   RTCRole `json:"role"`
	State  string  `json:"state"`
}
type RTCReportPayload struct {
	PeerIP string `json:"peerIP"`
	Report string `json:"report"`
}
type DataChannelMessagePayload struct {
	PeerIP string `json:"peerIP"`
	Data   string `json:"data"`
}

const (
	EventConnectionState       EventType = "connection_state"
	EventStartDirectConnection EventType = "start_direct_connection" // WEB ONLY
	EventRTCReport             EventType = "rtc_report"
	EventDataChannelMessage    EventType = "data_channel_message"
)

func StartCore(
	platform Platform,
	ts TailscaleAdapter,
	events EventAdapter,
	nodeInfo NodeInfo,
) *core {
	c := &core{
		platform: platform,
		ts:       ts,
		events:   events,
		nodeInfo: nodeInfo,
	}
	c.onlineManager = c.initOnlineManager(nodeInfo)

	return c
}
