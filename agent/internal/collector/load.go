package collector

import (
	"github.com/shirou/gopsutil/v3/load"
)

func GetLoadAvg() (*load.AvgStat, error) {
	return load.Avg()
}
