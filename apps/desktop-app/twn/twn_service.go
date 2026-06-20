package twn

// expose `InitTWN` method to wails, which can be called in frontend to initialize the TWN node
type TWNService struct {
	node *tsNode
	emit emitMethod
	on   onMethod
}

func NewTWNService(
	emit emitMethod,
	on onMethod,
) *TWNService {
	return &TWNService{
		emit: emit,
		on:   on,
	}
}

type TWNConfig struct {
	// Hostname is the hostname to present to the control server.
	// If empty, the binary name is used.
	HostName string `json:"hostName"`

	// AuthKey, if non-empty, is the auth key to create the node
	// and will be preferred over the TS_AUTHKEY environment
	// variable. If the node is already created (from state
	// previously stored in Store), then this field is not
	// used.
	AuthKey string `json:"authKey"`

	// Dir specifies the name of the directory to use for
	// state. If empty, a directory is selected automatically
	// under os.UserConfigDir (https://golang.org/pkg/os/#UserConfigDir).
	// based on the name of the binary.
	//
	// If you want to use multiple tsnet services in the same
	// binary, you will need to make sure that Dir is set uniquely
	// for each service. A good pattern for this is to have a
	// "base" directory (such as your mutable storage folder) and
	// then append the hostname on the end of it.
	Dir string `json:"dir"`

	// Ephemeral, if true, specifies that the instance should register
	// as an Ephemeral node (https://tailscale.com/s/ephemeral-nodes).
	IsEphemeral bool `json:"isEphemeral"`
}

func (s *TWNService) StartTWN(p TWNConfig) {
	// Already initialized
	if s.node != nil {
		return
	}
	// internal initialization
	s.node = initTWN(
		p.HostName,
		p.AuthKey,
		p.Dir,
		p.IsEphemeral,
		s.emit,
		s.on,
	)
}
