package monitor

import (
	"io/ioutil"
	"os"
	"path"
	"testing"
	"time"
)

const (
	TEST_NOTIFY_TIMEOUT = 500 * time.Millisecond
)

func getTmpDir(t *testing.T) string {
	dir, err := ioutil.TempDir("", "")

	if err != nil {
		t.Fatalf("Cannot create a temporary directory for testing: " + err.Error())
	}

	return dir
}

func getWatchedTmpDir(t *testing.T) (string, *Monitor, chan Event) {
	dir := getTmpDir(t)

	m, err := NewMonitor()

	if err != nil {
		t.Fatalf("Cannot create monitor: %s", err)
	}

	err = m.Watch(dir)

	if err != nil {
		t.Fatalf("Cannot watch directory %s: %s", dir, err)
	}

	c := make(chan Event, 10)

	m.Listen(c)

	return dir, m, c
}

type verifyEventFunc func(ev Event)

func verifyEvent(t *testing.T, c <-chan Event, verify verifyEventFunc) {
	select {
	case ev := <-c:
		verify(ev)
	case <-time.After(TEST_NOTIFY_TIMEOUT):
		t.Fatalf("Didn't receive any event")
	}
}

func checkNoEventArrives(t *testing.T, c <-chan Event) {
	select {
	case <-c:
		t.Fatalf("Received an unexpected event")
	case <-time.After(TEST_NOTIFY_TIMEOUT):
		break
	}
}

func TestCreateFile(t *testing.T) {
	dir, _, c := getWatchedTmpDir(t)

	defer func() {
		os.RemoveAll(dir)
	}()

	testPath := path.Join(dir, "testfile1")
	fd, err := os.Create(testPath)

	if err != nil {
		t.Fatalf("Cannot create test file %s: %s", testPath, err)
	}

	fd.Close()

	verifyEvent(t, c, func(ev Event) {
		if ev.Path() != testPath {
			t.Fatalf("Unexpected file path - expected %s, got %s", testPath, ev.Path())
		}

		if _, ok := ev.(*CreateEvent); !ok {
			t.Fatalf("Did get an event of the wrong type when creating a file")
		}

		cev := ev.(*CreateEvent)

		if cev.Info == nil {
			t.Fatalf("Missing FileInfo for event after creating a file")
		}
	})

	checkNoEventArrives(t, c)

	testPath = path.Join(dir, ".testfile2")
	fd, err = os.Create(testPath)

	if err != nil {
		t.Fatalf("Cannot create test file %s: %s", testPath, err)
	}

	fd.Close()

	// It's a hidden file, no event should arrive
	checkNoEventArrives(t, c)

	visibleTestPath := path.Join(dir, "testfile2")

	err = os.Rename(testPath, visibleTestPath)

	if err != nil {
		t.Fatalf("Cannot rename test file %s: %s", testPath, err)
	}

	verifyEvent(t, c, func(ev Event) {
		if ev.Path() != visibleTestPath {
			t.Fatalf("Unexpected file path - expected %s, got %s", visibleTestPath, ev.Path())
		}

		if _, ok := ev.(*CreateEvent); !ok {
			t.Fatalf("Did get an event of the wrong type when creating a file")
		}
	})

	checkNoEventArrives(t, c)
}

func TestRemoveFile(t *testing.T) {
	dir, m, c := getWatchedTmpDir(t)

	defer func() {
		os.RemoveAll(dir)
	}()

	m.Unlisten(c)

	testPath := path.Join(dir, "testfile1")
	fd, err := os.Create(testPath)

	if err != nil {
		t.Fatalf("Cannot create test file %s: %s", testPath, err)
	}

	fd.Close()

	testPathDir := path.Join(dir, "testdir1")

	err = os.Mkdir(testPathDir, 0755)

	if err != nil {
		t.Fatalf("Cannot create test dir %s: %s", testPathDir, err)
	}

	<-time.After(TEST_NOTIFY_TIMEOUT)

	m.Listen(c)

	err = os.Remove(testPath)

	if err != nil {
		t.Fatalf("Cannot delete test file %s: %s", testPath, err)
	}

	verifyEvent(t, c, func(ev Event) {
		if ev.Path() != testPath {
			t.Fatalf("Unexpected file path - expected %s, got %s", testPath, ev.Path())
		}

		if _, ok := ev.(*DeleteEvent); !ok {
			t.Fatalf("Did get an event of the wrong type when deleting a file")
		}

		dev := ev.(*DeleteEvent)

		if dev.IsDirectory {
			t.Fatalf("IsDirectory set on a file delete event")
		}
	})

	checkNoEventArrives(t, c)

	err = os.RemoveAll(testPathDir)

	if err != nil {
		t.Fatalf("Cannot delete test dir %s: %s", testPath, err)
	}

	verifyEvent(t, c, func(ev Event) {
		if ev.Path() != testPathDir {
			t.Fatalf("Unexpected dir path - expected %s, got %s", testPathDir, ev.Path())
		}

		if _, ok := ev.(*DeleteEvent); !ok {
			t.Fatalf("Did get an event of the wrong type when deleting a directory")
		}

		dev := ev.(*DeleteEvent)

		if !dev.IsDirectory {
			t.Fatalf("IsDirectory not set on a directory delete event")
		}
	})

	checkNoEventArrives(t, c)
}

func TestWatchNewDirs(t *testing.T) {
	dir, m, c := getWatchedTmpDir(t)

	defer func() {
		os.RemoveAll(dir)
	}()

	m.Unlisten(c)

	testDirPath := path.Join(dir, "nested")

	err := os.Mkdir(testDirPath, 0755)

	if err != nil {
		t.Fatalf("Cannot create test directory %s: %s", testDirPath, err)
	}

	<-time.After(TEST_NOTIFY_TIMEOUT)

	m.Listen(c)

	testPath := path.Join(testDirPath, "testfile")

	fd, err := os.Create(testPath)

	if err != nil {
		t.Fatalf("Cannot create test file %s: %s", testPath, err)
	}

	fd.Close()

	verifyEvent(t, c, func(ev Event) {
		if ev.Path() != testPath {
			t.Fatalf("Unexpected file path - expected %s, got %s", testPath, ev.Path())
		}

		if _, ok := ev.(*CreateEvent); !ok {
			t.Fatalf("Did get an event of the wrong type when creating a file")
		}
	})

	checkNoEventArrives(t, c)
}
