package collector

import "github.com/shirou/gopsutil/v3/net"

func GetNetwork() ([]net.IOCountersStat, error) {
	return net.IOCounters(true)
}
