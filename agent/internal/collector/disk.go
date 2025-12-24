package collector

import (
	"runtime"

	"github.com/shirou/gopsutil/v3/disk"
)

// GetDiskUsage 获取磁盘使用情况
// Windows 下默认检查 C 盘，其他系统检查根目录 /
func GetDiskUsage() (*disk.UsageStat, error) {
	path := "/"
	if runtime.GOOS == "windows" {
		path = "C:"
	}
	return disk.Usage(path)
}
