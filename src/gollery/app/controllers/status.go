package controllers

import (
	"github.com/robfig/revel"
	"gollery/app"
	"runtime"
)

type Status struct {
	*revel.Controller
}

type ServerStatus struct {
	ThumbnailingQueueSize int    `json:"thumbnailing_queue_size"`
	GoMaxProcs            int    `json:"go_max_procs"`
	NGoroutines           int    `json:"n_goroutines"`
	MemoryAllocated       uint64 `json:"memory_allocated"`
	GoVersion             string `json:"go_version"`
	Version               string `json:"version"`
}

func (c *Status) Status() revel.Result {
	memStats := &runtime.MemStats{}
	runtime.ReadMemStats(memStats)

	return c.RenderJson(&ServerStatus{
		ThumbnailingQueueSize: app.Thumbnailer.ThumbnailQueueSize(),
		GoMaxProcs:            runtime.GOMAXPROCS(-1),
		NGoroutines:           runtime.NumGoroutine(),
		MemoryAllocated:       memStats.Alloc,
		GoVersion:             runtime.Version(),
		Version:               app.Version,
	})
}
