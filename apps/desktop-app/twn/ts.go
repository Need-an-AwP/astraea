package twn

import (
	"context"
	// "crypto/rand"

	"fmt"
	"log"

	// "math/big"

	"os"
	// "os/exec"
	// "runtime"
	// "strings"
	// "time"

	"tailscale.com/ipn"
	"tailscale.com/ipn/ipnstate"
	"tailscale.com/tsnet"
)

func (n *tsNode) StartNode() {
	dir := fmt.Sprintf("%s/%s", n.Dir, n.HostName) // dirPath is tsNodeDir by default, specify the directory for the node storage
	if n.AuthKey != "" {
		// use authkey login
		os.Setenv("TSNET_FORCE_LOGIN", "1")
		// this can force the node to re-login every time,
		// ephemeral mode will remove the node in a short time after the node goes offline
		n.Srv = &tsnet.Server{
			// Ephemeral: true, // only effect when using account login, authkey's behavior depends on its properties
			Hostname: n.HostName,
			AuthKey:  n.AuthKey,
			Dir:      dir,
			// ControlURL: controlURL,// using Tailscale's official control server
			// Logf:       log.Printf,
		}
	} else {
		// use account login
		n.Srv = &tsnet.Server{
			Ephemeral: n.IsEphemeral, // save the node in tsnet by default when using account login
			Hostname:  n.HostName,
			// AuthKey:   authKey,
			Dir: dir,
			// ControlURL: controlURL,// using Tailscale's official control server
			// Logf:       log.Printf,
		}
	}

	lc, err := n.Srv.LocalClient()
	if err != nil {
		log.Fatal("Error getting local client, quitting with error: ", err)
	}
	n.Lc = lc

	// Wait for initialization to complete if necessary
	initComplete := make(chan struct{})

	// using native watching method instead of ticker polling
	go n.startBackendStateMonitor(initComplete)

	<-initComplete
}

type Ts_notify struct {
	Notify ipn.Notify
	Status *ipnstate.Status
}

func (n *tsNode) startBackendStateMonitor(initComplete chan struct{}) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	// initialized := false
	// var hasAuthKey bool = srv.AuthKey != ""

	watcher, err := n.Lc.WatchIPNBus(ctx, ipn.NotifyWatchOpt(0))
	if err != nil {
		log.Printf("Failed to watch IPN bus: %v", err)
		return
	}
	defer watcher.Close()

	for {
		notify, err := watcher.Next()
		if err != nil {
			log.Printf("IPN bus watcher error: %v", err)
			continue
		}

		if notify.State != nil {
			
		}

		// pass the notify to fe directly
		// n.emit("ts_notify", notify)
		s, err := n.Lc.Status(ctx)
		if err != nil {
			log.Printf("Failed to get status: %v", err)
			continue
		}
		n.emit("ts_notify", Ts_notify{notify, s})
	}
}
