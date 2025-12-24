package collector

import (
	"github.com/shirou/gopsutil/v3/host"
)

// HostInfo 定义了主机信息结构
type HostInfo struct {
	OS              string `json:"os"`               // 操作系统
	Platform        string `json:"platform"`         // 平台
	PlatformVersion string `json:"platform_version"` // 平台版本
	Hostname        string `json:"hostname"`         // 主机名
	Kernel          string `json:"kernel"`           // 内核版本
	Uptime          uint64 `json:"uptime"`           // 运行时间
}

// GetHostInfo 获取主机详细信息
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
