package auth

import (
	"encoding/json"
	"github.com/robfig/revel"
	"gollery/monitor"
	"gollery/utils"
	"os"
	"path"
	"sync"
)

type FSGroupBackend struct {
	rootDir       string
	monitorEvents chan monitor.Event
	groups        map[string][]string
	groupsMutex   sync.RWMutex
}

const GROUPS_FILENAME = "gollery.groups"

func (b *FSGroupBackend) loadGroups() error {
	fd, err := os.Open(path.Join(b.rootDir, GROUPS_FILENAME))

	if os.IsNotExist(err) {
		return nil
	}

	if err != nil {
		return utils.WrapError(err, "Cannot open groups file")
	}

	defer fd.Close()

	b.groupsMutex.Lock()
	defer b.groupsMutex.Unlock()

	b.groups = make(map[string][]string)

	err = json.NewDecoder(fd).Decode(&b.groups)

	if err != nil {
		return utils.WrapError(err, "Cannot parse groups file")
	}

	return nil
}

func (b *FSGroupBackend) monitorEventsRoutine() {
	for x := range b.monitorEvents {
		if x.Path() != path.Join(b.rootDir, GROUPS_FILENAME) {
			continue
		}

		err := b.loadGroups()

		if err != nil {
			revel.ERROR.Printf("Cannot load groups information: %s", err)
		}
	}
}

func NewFSGroupBackend(rootDir string, mon *monitor.Monitor) (*FSGroupBackend, error) {
	b := &FSGroupBackend{
		rootDir:       rootDir,
		monitorEvents: make(chan monitor.Event, 100),
	}

	mon.Listen(b.monitorEvents)

	go b.monitorEventsRoutine()

	err := b.loadGroups()

	if err != nil {
		return nil, utils.WrapError(err, "Cannot load groups")
	}
	return b, nil
}

func (b *FSGroupBackend) UserBelongsToGroup(user string, group string) (bool, error) {
	b.groupsMutex.RLock()
	defer b.groupsMutex.RUnlock()

	if b.groups == nil {
		return false, nil
	}

	var users = b.groups[group]

	if users == nil {
		return false, nil
	}

	for _, u := range users {
		if u == user {
			return true, nil
		}
	}

	return false, nil
}
