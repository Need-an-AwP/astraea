package twn

import (
	"tailscale.com/client/local"
	"tailscale.com/tsnet"
)

type tsNode struct {
	// parameters
	HostName    string
	AuthKey     string
	ControlURL  string // TODO
	Dir         string
	IsEphemeral bool

	// state
	srv      *tsnet.Server
	lc       *local.Client

	// methods
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
