package collector

import (
	"github.com/shirou/gopsutil/v3/cpu"
)

// GetCPUPercent 获取 CPU 使用率
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

// InitCPU 初始化 CPU 统计（第一次调用通常返回 0，需要先初始化）
func InitCPU() {
	cpu.Percent(0, false)
}
