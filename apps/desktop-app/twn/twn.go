package twn

import (
	"github.com/wailsapp/wails/v3/pkg/application"
	"tailscale.com/client/local"
	"tailscale.com/tsnet"
)

// function type from wails `app.Event.Emit`
type emitMethod func(name string, data ...any) bool

// function type from wails `app.Event.On`
type onMethod func(name string, callback func(event *application.CustomEvent)) func()

type tsNode struct {
	// parameters
	HostName    string
	AuthKey     string
	ControlURL  string // TODO
	Dir         string
	IsEphemeral bool

	// state
	srv          *tsnet.Server
	lc           *local.Client
	tsNotifySnap *Ts_notify

	// methods
	emit emitMethod
	on   onMethod
}

const (
	EventRequestTsNotify = "r_ts_notify"
	EventTsNotify        = "ts_notify"
)

func initTWN(
	hostName string,
	authKey string,
	dir string,
	isEphemeral bool,
	emit emitMethod, // should be func `app.Event.Emit` from wails
	on onMethod, // should be func `app.Event.On` from wails
) *tsNode {
	node := &tsNode{
		HostName:    hostName,
		AuthKey:     authKey,
		Dir:         dir,
		IsEphemeral: isEphemeral,
		emit:        emit,
		on:          on,
	}
	node.StartNode()
	return node
}
