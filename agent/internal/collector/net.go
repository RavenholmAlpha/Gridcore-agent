package collector

import (
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/shirou/gopsutil/v3/net"
)

// GetNetwork 获取网络接口统计信息
func GetNetwork() ([]net.IOCountersStat, error) {
	return net.IOCounters(true)
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
