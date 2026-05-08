package twn

import (
	"context"
	"fmt"
	"net"
	"strconv"

	"twncore"
)

type DesktopAdapter struct {
	node        *tsNode
	tailscaleIP string
}

// 确保 DesktopAdapter 实现了 TailscaleAdapter 接口
var _ twncore.TailscaleAdapter = (*DesktopAdapter)(nil)

// createUDPConn 在当前的 tailscale 节点网络栈上创建 UDP 监听 (tsnet API)
func (da *DesktopAdapter) CreateUDPConn(port int) (net.PacketConn, error) {
	if da.node.srv == nil {
		return nil, fmt.Errorf("DesktopAdapter: tailscale srv is not initialized")
	}

	ipPort := net.JoinHostPort(da.tailscaleIP, strconv.Itoa(port))
	conn, err := da.node.srv.ListenPacket("udp4", ipPort)
	if err != nil {
		return nil, fmt.Errorf("failed to listen on UDP port %d via tsnet: %w", port, err)
	}
	return conn, nil
}

// GetOnlinePeerIPs 获取当前在线的对等节点 IP，用于广播 (ipn API)
func (da *DesktopAdapter) GetOnlinePeerIPs() []string {
	if da.node.lc == nil {
		return nil
	}

	status, err := da.node.lc.Status(context.Background())
	if err != nil || status == nil {
		return nil
	}

	var ips []string
	for _, peer := range status.Peer {
		if peer.Online {
			if len(peer.TailscaleIPs) > 0 {
				ips = append(ips, peer.TailscaleIPs[0].String())
			}
		}
	}
	return ips
}

// 确保 DesktopAdapter 也作为 EventAdapter
var _ twncore.EventAdapter = (*DesktopAdapter)(nil)

func (da *DesktopAdapter) Emit(eventName twncore.EventType, data any) {
	da.node.emit(string(eventName), data)
}

func (da *DesktopAdapter) MediaDataPipeline() {}
