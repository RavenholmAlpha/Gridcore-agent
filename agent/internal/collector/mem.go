package collector

import "github.com/shirou/gopsutil/v3/mem"

func GetMemory() (*mem.VirtualMemoryStat, error) {
	return mem.VirtualMemory()
}
