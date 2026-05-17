package twncore

import (
	"encoding/json"
	"log"
	"net"
	"sync"
	"sync/atomic"
	"time"

	"github.com/pion/interceptor"
	"github.com/pion/interceptor/pkg/cc"
	"github.com/pion/interceptor/pkg/gcc"
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

type RTCConnection struct {
	// references
	rtcManager *RTCManager
	core       *core

	// properties
	pc                *webrtc.PeerConnection
	peerIP            string
	role              RTCRole
	dc                *webrtc.DataChannel
	candidatesMu      sync.RWMutex
	pendingCandidates []*webrtc.ICECandidate
	tracks            sync.Map    // map[uint8]*webrtc.TrackLocalStaticSample
	senders           sync.Map    // map[uint8]*webrtc.RTPSender
	enableMedia       atomic.Bool // default true, used to control whether actual media data is transmitted.
	maxTargetTid      atomic.Int32
}

type RTCManager struct {
	connections       sync.Map // map[string]*RTCConnection
	estimators        sync.Map // map[string]cc.BandwidthEstimator
	api               *webrtc.API
	rtcReportInterval int
	core              *core
}

func createWebRTCAPI(conn net.PacketConn, rm *RTCManager) *webrtc.API {
	// setup mediaengine
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		panic(err)
	}

	// setup BandwidthEstimator
	var initBitrate int = 100_000 // 100kbps
	// 最大比特率应由可用带宽均分得到，以避免多个gcc互相竞争带宽出现震荡混乱
	var maxBitrate int = 5_000_000 // 5mbps
	var minBitrate int = 30_000    // 30kbps
	interceptorRegistry := &interceptor.Registry{}
	congestionController, err := cc.NewInterceptor(func() (cc.BandwidthEstimator, error) {
		return gcc.NewSendSideBWE(
			gcc.SendSideBWEInitialBitrate(initBitrate),
			gcc.SendSideBWEMaxBitrate(maxBitrate),
			gcc.SendSideBWEMinBitrate(minBitrate),
		)
	})
	if err != nil {
		panic(err)
	}
	congestionController.OnNewPeerConnection(func(id string, estimator cc.BandwidthEstimator) {
		if rm != nil {
			rm.estimators.Store(id, estimator)
			// log.Printf("[RTC] Stored bandwidth estimator for PC ID: %s", id)
		}
	})
	interceptorRegistry.Add(congestionController)
	if err := webrtc.ConfigureTWCCHeaderExtensionSender(mediaEngine, interceptorRegistry); err != nil {
		panic(err)
	}
	if err := webrtc.RegisterDefaultInterceptors(mediaEngine, interceptorRegistry); err != nil {
		panic(err)
	}

	// setup settingengine
	settingEngine := webrtc.SettingEngine{}
	settingEngine.SetNetworkTypes([]webrtc.NetworkType{webrtc.NetworkTypeUDP4}) // only collect udp4 ice
	settingEngine.SetICEUDPMux(webrtc.NewICEUDPMux(nil, conn))                  // only use tailscale's conn

	api := webrtc.NewAPI(
		webrtc.WithSettingEngine(settingEngine),
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithInterceptorRegistry(interceptorRegistry),
	)

	return api
}

func (c *core) initWebRTC() {
	if c.nodeInfo == (NodeInfo{}) {
		return
	}

	c.rtcManager = &RTCManager{
		core:              c,
		rtcReportInterval: 2000, // default 2s
	}

	webrtcAPI := createWebRTCAPI(c.onlineManager.rtcConn, c.rtcManager)
	c.rtcManager.api = webrtcAPI
}

func (rm *RTCManager) createConnection(role RTCRole, peerIP string, sdpWithIce *SDPWithICE) {
	log.Printf("[RTC] Creating %s connection to peer %s", role, peerIP)

	pc, err := rm.api.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		log.Printf("[RTC] Failed to create peer connection for %s: %v", peerIP, err)
		return
	}
	log.Printf("[RTC] Created PeerConnection with ID: %s", pc.ID())

	var dc *webrtc.DataChannel
	if role == OFFER {
		dc, err = pc.CreateDataChannel("data", nil)
		if err != nil {
			log.Printf("[RTC] Failed to create data channel for %s: %v", peerIP, err)
			pc.Close()
			return
		}
		rm.setupDcHandlers(dc, peerIP, role)
	}

	connection := &RTCConnection{
		rtcManager: rm,
		core:       rm.core,

		pc:                pc,
		peerIP:            peerIP,
		role:              role,
		dc:                dc, // nil at answer side
		pendingCandidates: make([]*webrtc.ICECandidate, 0),
		tracks:            sync.Map{},
		senders:           sync.Map{},
	}

	connection.enableMedia.Store(true) // enable relay media transmission by default
	connection.maxTargetTid.Store(2)   // Default to highest target

	connection.addTracks()

	connection.setupPcHandlers()

	var sdp webrtc.SessionDescription
	switch role {
	case OFFER:
		sdp, err = pc.CreateOffer(nil)
		if err != nil {
			log.Printf("[RTC] Failed to create offer for %s: %v", peerIP, err)
			rm.closeConnection(peerIP)
			return
		}

	case ANSWER:
		if sdpWithIce == nil {
			log.Printf("[RTC] Error: remoteOffer is nil for answer role")
			rm.closeConnection(peerIP)
			return
		}

		if err := pc.SetRemoteDescription(sdpWithIce.SDP); err != nil {
			log.Printf("[RTC] Error setting remote description for %s: %v", peerIP, err)
			rm.closeConnection(peerIP)
			return
		}

		sdp, err = pc.CreateAnswer(nil)
		if err != nil {
			log.Printf("[RTC] Failed to create answer for %s: %v", peerIP, err)
			rm.closeConnection(peerIP)
			return
		}

		if err := addICE(connection.pc, sdpWithIce.ICEList); err != nil {
			log.Printf("[RTC] Error adding ICE candidates for %s: %v", peerIP, err)
			rm.closeConnection(peerIP)
			return
		}
	}

	// Store the connection
	rm.connections.Store(peerIP, connection)

	// WEB ONLY: notify JS side to start connection
	if role == OFFER && rm.core.platform == PlatformWeb {
		rm.core.events.Emit(EventStartDirectConnection, peerIP)
	}

	// wait for ICE gathering to complete
	// there will be only one ice, so the process is quick
	gatherComplete := webrtc.GatheringCompletePromise(pc)
	if err = pc.SetLocalDescription(sdp); err != nil {
		log.Panicf("[RTC] Failed to set local description for %s: %v", peerIP, err)
	}
	<-gatherComplete

	// log.Printf("[RTC] ready to send %s SDP with ICE to %s\nsdp:%v", role, peerIP, sdp)
	rm.sendSDPWithICE(role, peerIP, sdp, connection.pendingCandidates)
}

func (rm *RTCManager) closeConnection(peerIP string) {
	if conn, ok := rm.connections.Load(peerIP); ok {
		rtcConn := conn.(*RTCConnection)
		rm.estimators.Delete(rtcConn.pc.ID())

		if err := rtcConn.pc.Close(); err != nil {
			log.Printf("[RTC] Error closing connection to %s: %v", peerIP, err)
		}
		rm.connections.Delete(peerIP)
	}
}

func (rm *RTCManager) handleAnswer(peerIP string, sdpWithIce *SDPWithICE) {
	v, ok := rm.connections.Load(peerIP)
	if !ok {
		log.Printf("[RTC] No existing connection found for %s to handle answer", peerIP)
		return
	}

	connection := v.(*RTCConnection)
	if connection.role != OFFER {
		log.Printf("[RTC] receiving answer from %s but self role is not offer", peerIP)
		return
	}

	if err := connection.pc.SetRemoteDescription(sdpWithIce.SDP); err != nil {
		rm.closeConnection(peerIP)
		log.Printf("[RTC] Error setting remote description for %s: %v", peerIP, err)
	}

	if err := addICE(connection.pc, sdpWithIce.ICEList); err != nil {
		rm.closeConnection(peerIP)
		log.Printf("[RTC] Error adding ICE candidates for %s: %v", peerIP, err)
	}
}

func (rc *RTCConnection) setupPcHandlers() {
	pc := rc.pc

	pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("[RTC onTrack] received track: streamID:%s, ID:%s", track.StreamID(), track.ID())
		rc.handleTrack(track)
	})

	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}

		log.Printf("[RTC] Candidate collected: %v", candidate)

		rc.candidatesMu.Lock()
		defer rc.candidatesMu.Unlock()
		rc.pendingCandidates = append(rc.pendingCandidates, candidate)
	})

	// for answer side only
	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		if rc.role == OFFER {
			return
		}

		rc.dc = dc
		rc.rtcManager.setupDcHandlers(dc, rc.peerIP, rc.role)
	})

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("[RTC] Connection state with %s changed to %s", rc.peerIP, state.String())

		platform := rc.core.GetPeerPlatform(rc.peerIP)

		rc.core.events.Emit(EventConnectionState, ConnectionStatePayload{
			PeerIP:   rc.peerIP,
			Role:     rc.role,
			State:    state.String(),
			Platform: platform,
		})
		if pc.ConnectionState() == webrtc.PeerConnectionStateConnected {
			go func() {
				interval := time.Duration(rc.rtcManager.rtcReportInterval) * time.Millisecond
				ticker := time.NewTicker(interval)
				defer ticker.Stop()

				for range ticker.C {
					// live check
					if pc.ConnectionState() != webrtc.PeerConnectionStateConnected {
						return
					}

					stats := pc.GetStats()
					for _, report := range stats {
						// for debugging
						// jsonData, err := json.Marshal(report)
						// if err != nil {
						// 	log.Printf("[RTC] Failed to marshal ICE stats for %s: %v", rc.peerIP, err)
						// 	continue
						// }
						// rc.rtcManager.invokeConnectionReportCallback(rc.peerIP, string(jsonData))

						// 我们只关心活跃的 ICE 连接对的统计信息
						if pairStats, ok := report.(webrtc.ICECandidatePairStats); ok {
							if pairStats.State == webrtc.StatsICECandidatePairStateSucceeded && pairStats.Nominated {
								// 将整个pairStats转换为JSON
								jsonData, err := json.Marshal(pairStats)
								if err != nil {
									log.Printf("[RTC] Failed to marshal ICE stats for %s: %v", rc.peerIP, err)
									continue
								}
								// log.Printf(string(jsonData))
								rc.core.events.Emit(EventRTCReport, RTCReportPayload{rc.peerIP, string(jsonData)})
							}
						}
					}
				}
			}()
		}
	})
}

func addICE(pc *webrtc.PeerConnection, candidates []*webrtc.ICECandidate) error {
	for _, candidate := range candidates {
		candidateInit := webrtc.ICECandidateInit{
			Candidate:     candidate.ToJSON().Candidate,
			SDPMid:        candidate.ToJSON().SDPMid,
			SDPMLineIndex: candidate.ToJSON().SDPMLineIndex,
		}
		if err := pc.AddICECandidate(candidateInit); err != nil {
			return err
		}
	}
	return nil
}

func (rm *RTCManager) sendSDPWithICE(
	role RTCRole,
	peerIP string,
	sdp webrtc.SessionDescription,
	iceList []*webrtc.ICECandidate,
) {
	var payloadType string
	if role == OFFER {
		payloadType = "offer_ice"
	} else {
		payloadType = "answer_ice"
	}

	sdpWithICE := SDPWithICE{
		SDP:     sdp,
		ICEList: iceList,
	}

	payload := sdpIceMessage{
		Type:       payloadType,
		Role:       role,
		SDPWithICE: sdpWithICE,
	}
	rm.core.onlineManager.sendKcpMessage(peerIP, payload)
}
