package thumbnailer

import (
	"crypto/sha1"
	"fmt"
	"github.com/abustany/gollery/monitor"
	"github.com/abustany/gollery/utils"
	"github.com/gographics/imagick/imagick"
	"github.com/robfig/revel"
	"io"
	"os"
	"path"
	"runtime"
	"strings"
	"sync"
	"time"
)

const (
	THUMBNAILER_SIZE_PX             = 200
	THUMBNAILER_COMPRESSION_QUALITY = 75
	THUMBNAILER_CLEANUP_JOB_ID      = "@cleanup"
)

type Thumbnailer struct {
	RootDir           string
	CacheDir          string
	thumbnailingQueue chan string
	queuedItems       map[string]bool
	queuedItemsMutex  sync.Mutex
	monitor           *monitor.Monitor
	monitorEvents     chan monitor.Event
}

func init() {
	imagick.Initialize()
}

func makeCacheKey(path string) string {
	h := sha1.New()
	io.WriteString(h, path)
	key := fmt.Sprintf("%.0x", h.Sum(nil))
	return key
}

// returns the list of thumb keys from this directory
func (t *Thumbnailer) checkCacheDir(dirPath string) ([]string, error) {
	dirFd, err := os.Open(dirPath)

	revel.INFO.Printf("Cleaning cache for directory '%s'", dirPath)

	if err != nil {
		return nil, utils.WrapError(err, "Cannot open directory '%s'", dirPath)
	}

	defer dirFd.Close()

	fis, err := dirFd.Readdir(-1)

	if err == io.EOF {
		return nil, nil
	}

	if err != nil {
		return nil, utils.WrapError(err, "Cannot read directory '%s'", dirPath)
	}

	thumbsToCreate := []string{}
	allThumbKeys := []string{}

	for _, f := range fis {
		fPath := path.Join(dirPath, f.Name())

		if f.IsDir() {
			childThumbKeys, err := t.checkCacheDir(fPath)

			if err != nil {
				revel.WARN.Printf("Cannot clean cache directory '%s': %s (skipping)", fPath, err)
			}

			allThumbKeys = append(allThumbKeys, childThumbKeys...)

			continue
		}

		fId := fPath[1+len(t.RootDir):]

		revel.TRACE.Printf("Checking thumbnail for %s", fId)

		cacheKey := makeCacheKey(fId)

		allThumbKeys = append(allThumbKeys, cacheKey)

		cacheFilePath := path.Join(t.CacheDir, cacheKey)

		_, err := os.Stat(cacheFilePath)

		if os.IsNotExist(err) {
			thumbsToCreate = append(thumbsToCreate, fPath)
			continue
		}

		if err != nil {
			revel.WARN.Printf("Error while checking thumbnail for '%s': %s (skipping)", fPath, err)
			continue
		}
	}

	for _, x := range thumbsToCreate {
		t.ScheduleThumbnail(x)
	}

	return allThumbKeys, nil
}

func (t *Thumbnailer) monitorEventsRoutine() {
	for x := range t.monitorEvents {
		if ev, ok := x.(*monitor.DeleteEvent); ok {
			if ev.IsDirectory {
				t.ScheduleThumbnail(THUMBNAILER_CLEANUP_JOB_ID)
				continue
			}

			t.DeleteThumbnail(ev.Path())
			continue
		}

		if ev, ok := x.(*monitor.CreateEvent); ok {
			if ev.Info.Mode().IsRegular() {
				t.ScheduleThumbnail(ev.Path())
			} else if ev.Info.IsDir() {
				err := t.monitor.Watch(ev.Path())

				if err != nil {
					revel.ERROR.Printf("Cannot setup a file monitor on %s: %s", ev.Path(), err)
					continue
				}

				_, err = t.checkCacheDir(ev.Path())

				if err != nil {
					revel.ERROR.Printf("Cannot create thumbnails for directory '%s': %s", ev.Path(), err)
				}
			}
			continue
		}
	}
}

func (t *Thumbnailer) thumbnailQueueRoutine() {
	for filePath := range t.thumbnailingQueue {
		t.queuedItemsMutex.Lock()
		delete(t.queuedItems, filePath)
		t.queuedItemsMutex.Unlock()

		if filePath == THUMBNAILER_CLEANUP_JOB_ID {
			t.CheckCache()
			continue
		}

		err := t.CreateThumbnail(filePath)

		if err != nil {
			revel.ERROR.Printf("Couldn't create thumbnail for file '%s': %s", filePath, err)
		}

		revel.INFO.Printf("The thumbnailing queue now has %d items", len(t.thumbnailingQueue))
	}
}

func NewThumbnailer(rootDir string, cacheDir string, mon *monitor.Monitor) (*Thumbnailer, error) {
	t := &Thumbnailer{
		RootDir:           rootDir,
		CacheDir:          cacheDir,
		thumbnailingQueue: make(chan string, 256),
		queuedItems:       make(map[string]bool, 256),
		monitor:           mon,
		monitorEvents:     make(chan monitor.Event, 256),
	}

	revel.INFO.Printf("Starting %d thumbnailer routines", runtime.NumCPU())

	for i := 0; i < runtime.NumCPU(); i++ {
		go t.thumbnailQueueRoutine()
	}

	mon.Listen(t.monitorEvents)

	go t.monitorEventsRoutine()

	return t, nil
}

// Creates missing thumbnails
func (t *Thumbnailer) CheckCache() error {
	revel.INFO.Printf("Starting cache cleanup")

	allThumbKeys, err := t.checkCacheDir(t.RootDir)

	if err != nil {
		return utils.WrapError(err, "Cannot check thumbnail cache")
	}

	keyHash := make(map[string]bool, len(allThumbKeys))

	for _, key := range allThumbKeys {
		keyHash[key] = true
	}

	fd, err := os.Open(t.CacheDir)

	if err != nil {
		return utils.WrapError(err, "Cannot check thumbnail cache for stall thumbnails")
	}

	defer fd.Close()

	for {
		// Don't read all files at all, it might be a lot
		fis, err := fd.Readdir(1024)

		if err == io.EOF {
			break
		}

		if err != nil {
			return utils.WrapError(err, "Cannot list thumbnails while cleaning cache")
		}

		for _, fi := range fis {
			// Thumbnail corresponds to a known picture, leave it alone
			if _, exists := keyHash[fi.Name()]; exists {
				continue
			}

			thumbPath := path.Join(t.CacheDir, fi.Name())

			revel.INFO.Printf("Removing stale thumbnail with key %s", fi.Name())
			err = os.Remove(thumbPath)

			if err != nil && !os.IsNotExist(err) {
				return utils.WrapError(err, "Cannot delete thumbnail '%s' while cleaning up cache", thumbPath)
			}
		}
	}

	return nil
}

func (t *Thumbnailer) ScheduleThumbnail(filePath string) {
	revel.INFO.Printf("Scheduling thumbnailing of file %s", filePath)

	t.queuedItemsMutex.Lock()
	defer t.queuedItemsMutex.Unlock()

	if _, alreadyQueued := t.queuedItems[filePath]; alreadyQueued {
		revel.INFO.Printf("Thumbnailing already scheduled for file %s", filePath)
		return
	}

	t.thumbnailingQueue <- filePath
	t.queuedItems[filePath] = true
}

// For absolute paths, check that they are in the root dir
// For relative paths, prepend the root dir path
func (t *Thumbnailer) normalizePath(filePath string) (string, error) {
	if len(filePath) > 0 && filePath[0] == '/' {
		if !strings.HasPrefix(filePath, t.RootDir) {
			return "", fmt.Errorf("Not creating a thumbnail for a file outside the root directory: %s", filePath)
		}

		return filePath, nil
	}

	return path.Join(t.RootDir, filePath), nil
}

func (t *Thumbnailer) CreateThumbnail(filePath string) error {
	normalizedPath, err := t.normalizePath(filePath)

	if err != nil {
		return utils.WrapError(err, "Invalid path '%s'", filePath)
	}

	fileId := normalizedPath[1+len(t.RootDir):]

	startTime := time.Now()

	mw := imagick.NewMagickWand()
	defer mw.Destroy()

	err = mw.ReadImage(normalizedPath)

	if err != nil {
		return utils.WrapError(err, "Cannot read file '%s'", normalizedPath)
	}

	thumbKey := makeCacheKey(fileId)
	thumbPath := path.Join(t.CacheDir, thumbKey)

	width := mw.GetImageWidth()
	height := mw.GetImageHeight()
	var scale float32

	if width > height {
		scale = float32(THUMBNAILER_SIZE_PX) / float32(width)
		width = THUMBNAILER_SIZE_PX
		height = uint(float32(height) * scale)
	} else {
		scale = float32(THUMBNAILER_SIZE_PX) / float32(height)
		height = THUMBNAILER_SIZE_PX
		width = uint(float32(width) * scale)
	}

	// TRIANGLE is a simple linear interpolation, should be fast enough
	err = mw.ResizeImage(width, height, imagick.FILTER_TRIANGLE, 1)

	if err != nil {
		return utils.WrapError(err, "Cannot generate thumbnail for file '%s'", normalizedPath)
	}

	err = mw.SetCompressionQuality(THUMBNAILER_COMPRESSION_QUALITY)

	if err != nil {
		return utils.WrapError(err, "Cannot set compression quality for file '%s'", normalizedPath)
	}

	err = mw.WriteImage(thumbPath)

	if err != nil {
		return utils.WrapError(err, "Cannot write thumbnail '%s' for file '%s'", thumbPath, normalizedPath)
	}

	revel.INFO.Printf("Thumbnailed image '%s' as '%s' in %.2f seconds", normalizedPath, thumbPath, time.Now().Sub(startTime).Seconds())

	return nil
}

func (t *Thumbnailer) DeleteThumbnail(filePath string) error {
	normalizedPath, err := t.normalizePath(filePath)

	if err != nil {
		return utils.WrapError(err, "Invalid path '%s'", normalizedPath)
	}

	fileId := normalizedPath[1+len(t.RootDir):]
	thumbKey := makeCacheKey(fileId)
	thumbPath := path.Join(t.CacheDir, thumbKey)

	err = os.Remove(thumbPath)

	if os.IsNotExist(err) {
		return nil
	}

	if err != nil {
		return utils.WrapError(err, "Cannot remove thumbnail")
	}

	revel.INFO.Printf("Deleted thumbnail for image '%s'", normalizedPath)

	return nil
}

func (t *Thumbnailer) ThumbnailQueueSize() int {
	return len(t.queuedItems)
}
