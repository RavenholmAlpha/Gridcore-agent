package collector

import (
	"github.com/shirou/gopsutil/v3/host"
)

type HostInfo struct {
	OS       string `json:"os"`
	Platform string `json:"platform"`
	Hostname string `json:"hostname"`
	Kernel   string `json:"kernel"`
}

func GetHostInfo() (*HostInfo, error) {
	info, err := host.Info()
	if err != nil {
		return nil, err
	}
	return &HostInfo{
		OS:       info.OS,
		Platform: info.Platform,
		Hostname: info.Hostname,
		Kernel:   info.KernelVersion,
	}, nil
}
