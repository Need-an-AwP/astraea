package twn

import (
	"context"
	"fmt"
	"net"
	"strconv"

	"twncore"
)

type DesktopTsAdapter struct {
	node        *tsNode
	tailscaleIP string
}

type DesktopEventAdapter struct {
	node *tsNode
}

// 确保实现了对应的 twncore 接口
var _ twncore.TailscaleAdapter = (*DesktopTsAdapter)(nil)
var _ twncore.EventAdapter = (*DesktopEventAdapter)(nil)

func (ea *DesktopEventAdapter) Emit(eventName twncore.EventType, data any) {
	if ea.node.emit == nil {
		return
	}

	// 映射 twncore 内部的事件名到面向前端的事件名，这里根据最新规范直接使用定义的 string
	ea.node.emit(string(eventName), data)
}

func (ea *DesktopEventAdapter) MediaDataPipeline() {
	// TODO: 在桌面端处理向前端推流或是音视频管道的逻辑
}

// createUDPConn 在当前的 tailscale 节点网络栈上创建 UDP 监听 (tsnet API)
func (da *DesktopTsAdapter) CreateUDPConn(port int) (net.PacketConn, error) {
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
func (da *DesktopTsAdapter) GetOnlinePeerIPs() []string {
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
