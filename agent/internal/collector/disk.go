package collector

import (
	"runtime"

	"github.com/shirou/gopsutil/v3/disk"
)

func GetDiskUsage() (*disk.UsageStat, error) {
	path := "/"
	if runtime.GOOS == "windows" {
		path = "C:"
	}
	return disk.Usage(path)
}
