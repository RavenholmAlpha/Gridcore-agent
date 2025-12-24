package collector

import "github.com/shirou/gopsutil/v3/mem"

// GetMemory 获取内存使用情况
func GetMemory() (*mem.VirtualMemoryStat, error) {
	return mem.VirtualMemory()
}
