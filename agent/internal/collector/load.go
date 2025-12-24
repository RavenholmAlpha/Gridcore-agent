package collector

import (
	"github.com/shirou/gopsutil/v3/load"
)

// GetLoadAvg 获取系统负载平均值（1分钟、5分钟、15分钟）
func GetLoadAvg() (*load.AvgStat, error) {
	return load.Avg()
}
