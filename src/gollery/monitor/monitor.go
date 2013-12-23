package monitor

import (
	"github.com/howeyc/fsnotify"
	"github.com/robfig/revel"
	"gollery/utils"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
)

type Event interface {
	Path() string
}

type CreateEvent struct {
	path string
	Info os.FileInfo
}

type DeleteEvent struct {
	path        string
	IsDirectory bool
}

type Monitor struct {
	monitor          *fsnotify.Watcher
	watchedDirs      map[string]uint64 // maps path to inode to detect renames
	watchedDirsMutex sync.Mutex
	listeners        map[chan<- Event]bool
}

func (e *CreateEvent) Path() string {
	return e.path
}

func (e *DeleteEvent) Path() string {
	return e.path
}

func (m *Monitor) IsDirectoryWatched(filePath string) bool {
	m.watchedDirsMutex.Lock()
	defer m.watchedDirsMutex.Unlock()

	_, watched := m.watchedDirs[filePath]

	return watched
}

func (m *Monitor) dispatchEvent(ev Event) {
	for c, _ := range m.listeners {
		select {
		case c <- ev:
			continue
		default:
			continue
		}
	}
}

func (m *Monitor) monitorRoutine() {
	for {
		select {
		case ev := <-m.monitor.Event:
			revel.TRACE.Printf("Thumbnailer: file event: %s", ev)

			if ev.IsAttrib() {
				revel.TRACE.Printf("Skipping attribute change event for file %s", ev.Name)
				continue
			}

			basename := path.Base(ev.Name)

			if len(basename) > 0 && basename[0] == '.' {
				revel.TRACE.Printf("Skipping event for hidden file %s", ev.Name)
				continue
			}

			if ev.IsDelete() || ev.IsRename() {
				isDir := m.IsDirectoryWatched(ev.Name)

				if isDir {
					m.watchedDirsMutex.Lock()
					delete(m.watchedDirs, ev.Name)
					m.watchedDirsMutex.Unlock()
				}

				m.dispatchEvent(&DeleteEvent{
					ev.Name,
					isDir,
				})
				continue
			}

			info, err := os.Stat(ev.Name)

			if err != nil {
				revel.ERROR.Printf("Cannot get file information for %s: %s", ev.Name, err)
				continue
			}

			if info.IsDir() {
				err = m.setupDirMonitor(ev.Name, info, nil)

				if err != nil {
					revel.ERROR.Printf("Cannot setup monitoring for new directory %s: %s", ev.Name, err)
				}
			}

			m.dispatchEvent(&CreateEvent{
				ev.Name,
				info,
			})
		case err := <-m.monitor.Error:
			revel.ERROR.Printf("Thumbnailer: file monitoring error: %s", err)
		}
	}
}

func NewMonitor() (*Monitor, error) {
	m := &Monitor{
		watchedDirs: map[string]uint64{},
		listeners:   map[chan<- Event]bool{},
	}

	var err error

	m.monitor, err = fsnotify.NewWatcher()

	if err != nil {
		return nil, err
	}

	go m.monitorRoutine()

	return m, nil
}

func (m *Monitor) setupDirMonitor(path string, info os.FileInfo, err error) error {
	if err != nil {
		return err
	}

	if strings.HasPrefix(path, ".") {
		return filepath.SkipDir
	}

	if !info.IsDir() {
		return nil
	}

	err = m.monitor.Watch(path)

	inode := uint64(0)

	if x, ok := info.Sys().(*syscall.Stat_t); ok {
		inode = x.Ino
	}

	m.watchedDirsMutex.Lock()
	m.watchedDirs[path] = inode
	m.watchedDirsMutex.Unlock()

	if err == nil {
		revel.INFO.Printf("Setup a directory monitor on '%s'", path)
	}

	return err
}

func (m *Monitor) Watch(dir string) error {
	return utils.WrapError(filepath.Walk(dir, m.setupDirMonitor), "Cannot setup monitoring")
}

func (m *Monitor) Listen(eventChannel chan<- Event) {
	m.listeners[eventChannel] = true
}

func (m *Monitor) Unlisten(eventChannel chan<- Event) {
	delete(m.listeners, eventChannel)
}

func (m *Monitor) WatchedDirectories() []string {
	m.watchedDirsMutex.Lock()
	defer m.watchedDirsMutex.Unlock()

	dirs := make([]string, len(m.watchedDirs))
	i := 0

	for dir, _ := range m.watchedDirs {
		dirs[i] = dir
		i++
	}

	return dirs
}
