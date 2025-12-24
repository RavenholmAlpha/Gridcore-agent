package collector

import (
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/shirou/gopsutil/v3/net"
)

func GetNetwork() ([]net.IOCountersStat, error) {
	return net.IOCounters(true)
}

func GetPublicIP() string {
	client := resty.New()
	client.SetTimeout(5 * time.Second)
	resp, err := client.R().Get("https://api.ipify.org")
	if err != nil {
		return ""
	}
	return resp.String()
}
