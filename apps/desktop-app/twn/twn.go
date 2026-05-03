package twn

import (
	"net"
	"net/http"

	"tailscale.com/client/local"
	"tailscale.com/tsnet"
)

type tsNode struct {
	// 配置参数
	HostName    string
	AuthKey     string
	Dir         string
	IsEphemeral bool

	// 运行状态与连接实例
	Srv          *tsnet.Server
	Lc           *local.Client
	UdpConn      net.PacketConn
	RtcConn      net.PacketConn
	HttpListener net.Listener
	HttpClient   *http.Client

	// 回调与事件方法
	emit func(name string, data ...any) bool
}

func initTWN(
	hostName string,
	authKey string,
	dir string,
	isEphemeral bool,
	emitMethod func(name string, data ...any) bool, // should be func `app.Event.Emit` from wails
) *tsNode {
	node := &tsNode{
		HostName:    hostName,
		AuthKey:     authKey,
		Dir:         dir,
		IsEphemeral: isEphemeral,
		emit:        emitMethod,
	}
	node.StartNode()
	return node
}
