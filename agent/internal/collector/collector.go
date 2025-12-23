package collector

import (
	"time"

	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

type Data struct {
	UUID      string                 `json:"uuid"`
	CPU       float64                `json:"cpu_percent"`
	Memory    *mem.VirtualMemoryStat `json:"memory"`
	Disk      *disk.UsageStat        `json:"disk"`
	Network   []net.IOCountersStat   `json:"network"`
	Timestamp int64                  `json:"timestamp"`
}

func Collect() (*Data, error) {
	cpuVal, _ := GetCPUPercent() // Ignore error for now, default 0

	memVal, err := GetMemory()
	if err != nil {
		return nil, err
	}

	diskVal, _ := GetDiskUsage() // Ignore error

	netVal, err := GetNetwork()
	if err != nil {
		return nil, err
	}

	return &Data{
		CPU:       cpuVal,
		Memory:    memVal,
		Disk:      diskVal,
		Network:   netVal,
		Timestamp: time.Now().Unix(),
	}, nil
}
