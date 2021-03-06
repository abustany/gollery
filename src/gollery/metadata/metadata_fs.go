package metadata

import (
	"encoding/json"
	"github.com/robfig/revel"
	"gollery/app/common"
	"gollery/monitor"
	"gollery/utils"
	"os"
	"path"
	"path/filepath"
	"sync"
)

const (
	METADATA_FILENAME = ".gollery.metadata"
)

type FSMetadataManager struct {
	RootDir       string
	monitor       *monitor.Monitor
	monitorEvents chan monitor.Event
	data          map[string]*AlbumMetadata
	dataMutex     sync.Mutex
}

func (m *FSMetadataManager) indexAlbumMetadataFile(filePath string) error {
	fd, err := os.Open(filePath)

	if err != nil {
		return utils.WrapError(err, "Cannot open metadata file for reading")
	}

	defer fd.Close()

	data := &AlbumMetadata{}

	err = json.NewDecoder(fd).Decode(data)

	if err != nil {
		return utils.WrapError(err, "Cannot decode album metadata")
	}

	m.dataMutex.Lock()
	defer m.dataMutex.Unlock()
	m.data[common.AlbumNameFromFile(filePath)] = data

	return nil
}

func (m *FSMetadataManager) getMetadata(album string) *AlbumMetadata {
	m.dataMutex.Lock()
	defer m.dataMutex.Unlock()
	return m.data[album]
}

func (m *FSMetadataManager) deleteMetadata(album string) {
	m.dataMutex.Lock()
	defer m.dataMutex.Unlock()
	delete(m.data, album)
}

func (m *FSMetadataManager) monitorEventsRoutine() {
	for x := range m.monitorEvents {
		if basename := path.Base(x.Path()); basename != METADATA_FILENAME {
			continue
		}

		if ev, ok := x.(*monitor.DeleteEvent); ok {
			var albumName string

			if ev.IsDirectory {
				// An album was deleted, drop the metadata
				albumName = common.AlbumNameFromDir(ev.Path())
			} else if fileName := path.Base(ev.Path()); fileName == METADATA_FILENAME {
				albumName = common.AlbumNameFromFile(ev.Path())
			}

			revel.INFO.Printf("Deleted album metadata for %s", albumName)
			m.deleteMetadata(albumName)
		}

		if ev, ok := x.(*monitor.CreateEvent); ok {
			var metadataFilePath string

			if ev.Info.Mode().IsRegular() {
				metadataFilePath = ev.Path()
			} else if ev.Info.IsDir() {
				metadataFilePath = path.Join(ev.Path(), METADATA_FILENAME)

				_, err := os.Stat(metadataFilePath)

				if os.IsNotExist(err) {
					continue
				}

				if err != nil {
					revel.ERROR.Printf("Cannot check for metadata file presence in dir %s: %s", ev.Path(), err)
					continue
				}
			}

			if metadataFilePath == "" {
				continue
			}

			revel.INFO.Printf("(re)Indexing metadata file %s", metadataFilePath)

			err := m.indexAlbumMetadataFile(metadataFilePath)

			if err != nil {
				revel.ERROR.Printf("Cannot parse album metadata for file %s: %s", metadataFilePath, err)
			}

			revel.INFO.Printf("Indexed album metadata %s", metadataFilePath)
		}
	}
}

func (m *FSMetadataManager) walkAlbumMetadata(filePath string, info os.FileInfo, err error) error {
	if err != nil {
		return filepath.SkipDir
	}

	if !info.Mode().IsRegular() {
		return nil
	}

	if info.Name() != METADATA_FILENAME {
		return nil
	}

	// Metadata is only for albums
	if info.Name() == path.Join(m.RootDir, METADATA_FILENAME) {
		return nil
	}

	err = m.indexAlbumMetadataFile(filePath)

	if err != nil {
		revel.ERROR.Printf("Error while reading album metadata %s: %s (skipping)", filePath, err)
	}

	return nil
}

func NewFSMetadataManager(rootDir string, mon *monitor.Monitor) (*FSMetadataManager, error) {
	m := &FSMetadataManager{
		RootDir:       rootDir,
		monitor:       mon,
		monitorEvents: make(chan monitor.Event, 100),
		data:          map[string]*AlbumMetadata{},
	}

	mon.Listen(m.monitorEvents)

	go m.monitorEventsRoutine()

	go func() {
		err := filepath.Walk(rootDir, m.walkAlbumMetadata)

		if err != nil {
			revel.ERROR.Printf("Error while walking the albums for metadata: %s", err)
		}
	}()

	return m, nil
}

func (m *FSMetadataManager) GetAlbumSecretToken(album string) string {
	metadata := m.getMetadata(album)

	if metadata == nil {
		return ""
	}

	return metadata.SecretToken
}

func (m *FSMetadataManager) IsAlbumPublic(album string) bool {
	metadata := m.getMetadata(album)

	return metadata == nil || metadata.Public
}
