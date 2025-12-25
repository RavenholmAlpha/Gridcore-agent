package collector

import (
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/shirou/gopsutil/v3/net"
)

// GetNetwork 获取网络接口统计信息
func GetNetwork() ([]net.IOCountersStat, error) {
	allStats, err := net.IOCounters(true)
	if err != nil {
		return nil, err
	}

	var filteredStats []net.IOCountersStat
	for _, stat := range allStats {
		// 简单过滤掉常见的 Loopback 接口名称
		// Windows 上通常是 "Loopback Pseudo-Interface 1"
		// Linux/macOS 上通常是 "lo" 或 "lo0"
		if stat.Name == "lo" || stat.Name == "lo0" || len(stat.Name) > 8 && stat.Name[:8] == "Loopback" {
			continue
		}
		filteredStats = append(filteredStats, stat)
	}
	return filteredStats, nil
}

// GetPublicIP 获取公网 IP 地址
func GetPublicIP() string {
	client := resty.New()
	client.SetTimeout(5 * time.Second)
	resp, err := client.R().Get("https://api.ipify.org")
	if err != nil {
		return ""
	}
	return resp.String()
}
