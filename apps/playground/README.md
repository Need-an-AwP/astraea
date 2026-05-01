# must build before run
> [!WARNING]
> dependencies include wasm, must run build before run playground

# 在运行前执行完整构建
> [!WARNING]
> 依赖包含wasm，运行playground前务必运行构建

---

## 开发备忘（Track 切换与混音策略）

在后续开发中，若需要在播放端进行不同 WebRTC 路径（如 Relay 和 Direct）下源音频的切换，请注意以下几种策略由于跨节点时间戳不同带来的隐患和解决思路：

1. **过零点硬切 (Zero-crossing Cut)**: 持续检测两条流/波形的采样数据，在当前波形和目标波形都位于或接近 0 振幅线时完成毫秒级的瞬间硬切。它可以实现无损的无缝过渡并100%消除由波形连续性断裂带来的 Click/Pop 爆音问题，是最推荐的做法。
2. **静音掩蔽 (Silence Masking)**: 使用类似于 VAD (Voice Activity Detection) 的逻辑，观察是否有语音正在发声。如果有，则延后切换意图直至下一个语留空白期（音频能量值接近本底噪声）进行切换。此策略对主观听感干扰最小，但实时性受到语言频次的制约。
3. ~~**使用 WebRTC RTP Timestamp 重新对齐**~~: 虽然理论最优（让接收方 NetEq 直接负责无缝合并），但若发送端两路使用的是不同的 `RTCPeerConnection` 或 SSRC，纯前端 JS 的 API 非常难以介入底层替换 RTP 头部。如果必须如此，需要依赖 Pion 等 Go 级别底层发力去保持中继流和直连流的一致性。

*(附：单纯的定周期交叉淡入淡出 Crossfade，在两轨存在相对网络抖动差值或相位不一对齐时，会导致声音重叠和梳状滤波，不建议将其直接作为 Relay/Direct 的切换策略。)*

prefer: 用人声提示切换