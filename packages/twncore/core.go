package twncore

import (
	"net"
)

type RTCRole string

const (
	OFFER  RTCRole = "offer"
	ANSWER RTCRole = "answer"
)

type core struct {
	// apis
	ts     TailscaleAdapter
	events EventAdapter

	nodeInfo      NodeInfo
	onlineManager *onlineManager
	rtcManager    *RTCManager
}

type TailscaleAdapter interface {
	// create a updConn on the tailscale node
	CreateUDPConn(port int) (net.PacketConn, error)
	// get all online tailscale peers' IPs, used for UDP broadcast
	GetOnlinePeerIPs() []string
}
type EventAdapter interface{}

func StartCore(
	ts TailscaleAdapter,
	events EventAdapter,
	nodeInfo NodeInfo,
) *core {
	c := &core{
		ts:       ts,
		events:   events,
		nodeInfo: nodeInfo,
	}
	c.onlineManager = c.initOnlineManager(nodeInfo)

	return c
}
