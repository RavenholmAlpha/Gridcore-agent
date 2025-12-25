package collector

import (
	"fmt"
	"time"
)

// Data 定义了收集到的系统指标数据结构
type Data struct {
	UUID     string  `json:"uuid"`      // 代理唯一标识
	Name     string  `json:"name"`      // 主机名
	OS       string  `json:"os"`        // 操作系统信息
	Uptime   uint64  `json:"uptime"`    // 运行时间
	CPU      float64 `json:"cpu"`       // CPU 使用率
	CPUCores int     `json:"cpu_cores"` // CPU 核心数
	RAM      float64 `json:"ram"`       // 内存使用率
	RAMTotal uint64  `json:"ram_total"` // 内存总量
	Disk     float64 `json:"disk"`      // 磁盘使用率
	NetIn    uint64  `json:"net_in"`    // 网络入站速率
	NetOut   uint64  `json:"net_out"`   // 网络出站速率
	PublicIP string  `json:"public_ip"` // 公网 IP
	Load1    float64 `json:"load_1"`    // 1分钟负载
	Load5    float64 `json:"load_5"`    // 5分钟负载
	Load15   float64 `json:"load_15"`   // 15分钟负载
}

// Collector 负责收集系统指标
type Collector struct {
	prevNetIn   uint64    // 上一次采集的网络入站流量总和
	prevNetOut  uint64    // 上一次采集的网络出站流量总和
	prevNetTime time.Time // 上一次采集时间
	publicIP    string    // 缓存的公网 IP
}

// New 创建一个新的收集器实例
func New() *Collector {
	return &Collector{}
}

// Collect 执行一次系统指标采集
func (c *Collector) Collect() (*Data, error) {
	cpuVal, _ := GetCPUPercent()
	cpuCores, _ := GetCPUCores()

	memVal, err := GetMemory()
	if err != nil {
		return nil, err
	}

	diskVal, _ := GetDiskUsage()

	netVals, err := GetNetwork()
	if err != nil {
		return nil, err
	}

	// 计算网络总流量
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
			// 计算速率：(当前总量 - 上次总量) / 时间间隔
			if totalIn >= c.prevNetIn {
				netInRate = uint64(float64(totalIn-c.prevNetIn) / duration)
			}
			if totalOut >= c.prevNetOut {
				netOutRate = uint64(float64(totalOut-c.prevNetOut) / duration)
			}
		}
	}

	// 更新状态以供下次计算使用
	c.prevNetIn = totalIn
	c.prevNetOut = totalOut
	c.prevNetTime = now

	// 如果尚未获取公网 IP，则尝试获取
	if c.publicIP == "" {
		c.publicIP = GetPublicIP()
	}

	hostVal, _ := GetHostInfo()
	loadVal, _ := GetLoadAvg()

	data := &Data{
		CPU:      cpuVal,
		CPUCores: cpuCores,
		RAM:      memVal.UsedPercent,
		RAMTotal: memVal.Total,
		Disk:     diskVal.UsedPercent,
		NetIn:    netInRate,
		NetOut:   netOutRate,
		PublicIP: c.publicIP,
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
