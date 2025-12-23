package collector

import (
	"github.com/shirou/gopsutil/v3/host"
)

type HostInfo struct {
	OS              string `json:"os"`
	Platform        string `json:"platform"`
	PlatformVersion string `json:"platform_version"`
	Hostname        string `json:"hostname"`
	Kernel          string `json:"kernel"`
	Uptime          uint64 `json:"uptime"`
}

func GetHostInfo() (*HostInfo, error) {
	info, err := host.Info()
	if err != nil {
		return nil, err
	}
	return &HostInfo{
		OS:              info.OS,
		Platform:        info.Platform,
		PlatformVersion: info.PlatformVersion,
		Hostname:        info.Hostname,
		Kernel:          info.KernelVersion,
		Uptime:          info.Uptime,
	}, nil
}
