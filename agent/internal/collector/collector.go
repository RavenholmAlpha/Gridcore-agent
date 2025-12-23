package collector

import (
	"fmt"
	"time"
)

type Data struct {
	UUID   string  `json:"uuid"`
	Name   string  `json:"name"`
	OS     string  `json:"os"`
	Uptime uint64  `json:"uptime"`
	CPU    float64 `json:"cpu"`
	RAM    float64 `json:"ram"`
	Disk   float64 `json:"disk"`
	NetIn  uint64  `json:"net_in"`
	NetOut uint64  `json:"net_out"`
	Load1  float64 `json:"load_1"`
	Load5  float64 `json:"load_5"`
	Load15 float64 `json:"load_15"`
}

type Collector struct {
	prevNetIn   uint64
	prevNetOut  uint64
	prevNetTime time.Time
}

func New() *Collector {
	return &Collector{}
}

func (c *Collector) Collect() (*Data, error) {
	cpuVal, _ := GetCPUPercent()

	memVal, err := GetMemory()
	if err != nil {
		return nil, err
	}

	diskVal, _ := GetDiskUsage()

	netVals, err := GetNetwork()
	if err != nil {
		return nil, err
	}

	// Calculate total network counters
	var totalIn, totalOut uint64
	for _, n := range netVals {
		totalIn += n.BytesRecv
		totalOut += n.BytesSent
	}

	now := time.Now()
	var netInRate, netOutRate uint64

	if !c.prevNetTime.IsZero() {
		duration := now.Sub(c.prevNetTime).Seconds()
		if duration > 0 {
			if totalIn >= c.prevNetIn {
				netInRate = uint64(float64(totalIn-c.prevNetIn) / duration)
			}
			if totalOut >= c.prevNetOut {
				netOutRate = uint64(float64(totalOut-c.prevNetOut) / duration)
			}
		}
	}

	// Update state
	c.prevNetIn = totalIn
	c.prevNetOut = totalOut
	c.prevNetTime = now

	hostVal, _ := GetHostInfo()
	loadVal, _ := GetLoadAvg()

	data := &Data{
		CPU:    cpuVal,
		RAM:    memVal.UsedPercent,
		Disk:   diskVal.UsedPercent,
		NetIn:  netInRate,
		NetOut: netOutRate,
	}

	if hostVal != nil {
		data.Name = hostVal.Hostname
		data.Uptime = hostVal.Uptime

		if hostVal.Platform != "" {
			data.OS = fmt.Sprintf("%s %s", hostVal.Platform, hostVal.PlatformVersion)
		} else {
			data.OS = hostVal.OS
		}
	}

	if loadVal != nil {
		data.Load1 = loadVal.Load1
		data.Load5 = loadVal.Load5
		data.Load15 = loadVal.Load15
	}

	return data, nil
}
