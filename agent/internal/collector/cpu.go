package collector

import (
	"github.com/shirou/gopsutil/v3/cpu"
)

func GetCPUPercent() (float64, error) {
	c, err := cpu.Percent(0, false)
	if err != nil {
		return 0, err
	}
	if len(c) > 0 {
		return c[0], nil
	}
	return 0, nil
}
