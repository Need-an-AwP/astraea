package twn

import (
	"context"
	"fmt"
	"log"
	"math/rand/v2"

	// "math/big"

	"os"
	// "os/exec"
	// "runtime"
	// "strings"
	"time"
	"twncore"

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
		n.srv = &tsnet.Server{
			// Ephemeral: true, // only effect when using account login, authkey's behavior depends on its properties
			Hostname: n.HostName,
			AuthKey:  n.AuthKey,
			Dir:      dir,
			// ControlURL: controlURL,// using Tailscale's official control server
			// Logf:       log.Printf,
		}
	} else {
		// use account login
		n.srv = &tsnet.Server{
			Ephemeral: n.IsEphemeral, // save the node in tsnet by default when using account login
			Hostname:  n.HostName,
			// AuthKey:   authKey,
			Dir: dir,
			// ControlURL: controlURL,// using Tailscale's official control server
			// Logf:       log.Printf,
		}
	}

	lc, err := n.srv.LocalClient()
	if err != nil {
		log.Fatal("Error getting local client, quitting with error: ", err)
	}
	n.lc = lc

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

	watcher, err := n.lc.WatchIPNBus(ctx, ipn.NotifyWatchOpt(0))
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

		// pass the notify to fe directly
		s, err := n.lc.Status(ctx)
		if err != nil {
			log.Printf("Failed to get status: %v", err)
			continue
		}
		n.emit("ts_notify", Ts_notify{notify, s})

		if notify.State != nil {
			if *notify.State == ipn.Running {
				// ipnReadyChan <- struct{}{}
				nodeInfo := twncore.NodeInfo{
					Hostname:    n.HostName,
					StartTime:   time.Now().Unix(),
					RandomID:    rand.Uint64(),                   // using `math/rand/v2` for quick random ID generation, not for security purposes
					TailscaleIP: s.Self.TailscaleIPs[0].String(), // using the first Tailscale IP, which should be IPv4
					Platform:    string(twncore.PlatformDesktop),
				}
				da := &DesktopTsAdapter{
					node:        n,
					tailscaleIP: nodeInfo.TailscaleIP,
				}
				ea := &DesktopEventAdapter{
					node: n,
				}

				go twncore.StartCore(
					twncore.PlatformDesktop, // desktop flag
					da,                      // tailscale adapter
					ea,                      // event adapter
					nodeInfo,
				)
			}
		} else if notify.ErrMessage != nil {
			n.emit("ts_error", *notify.ErrMessage)
		}
	}
}
