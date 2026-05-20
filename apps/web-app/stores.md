领域边界划分store职责

# core
## useCoreState
- 本地配置 configs
- 基础节点状态 nodestate // 来自`core.onNodeStateChange`
- 本地tailscale节点自身状态 TsStatus.Self // 来自`core.onTSStatusUpdate`
- 其余tailscale节点信息 // 来自`core.onTSStatusUpdate`
  - health
  - version
  - authurl


## usePeerState
- 所有节点 peers `Record<str, PeerStatus>`// 来自`core.onTSStatusUpdate`
  - 名称 hostname
  - 设备 device
  - 版本 ver
  - 中继 relay
- 远端用户信息 remoteUserData
- 远端轨道 remoteTracks
  - 音频 video
  - 视频 audio
- 连接信息 connectionInfo
  - 连接状态 connectState
  - 延迟 latency
  - 带宽 bandwidth


# media

# app 