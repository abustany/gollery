package common

import (
	"fmt"
	"path"
	"strings"
)

const (
	GOLLERY_CONFIG_ROOT_DIR  = "gollery.root_dir"
	GOLLERY_CONFIG_CACHE_DIR = "gollery.cache_dir"
)

var RootDir string

// For absolute paths, check that they are in the root dir
// For relative paths, prepend the root dir path
func NormalizePath(filePath string) (string, error) {
	if len(filePath) > 0 && filePath[0] == '/' {
		if !strings.HasPrefix(filePath, RootDir) {
			return "", fmt.Errorf("Path outside the root directory: %s", filePath)
		}

		return filePath, nil
	}

	return path.Join(RootDir, filePath), nil
}

func AlbumNameFromDir(dir string) string {
	normalizedPath, _ := NormalizePath(dir)

	if normalizedPath == "" {
		return ""
	}

	if normalizedPath == RootDir {
		return ""
	}

	return normalizedPath[1+len(RootDir):]
}

func AlbumNameFromFile(file string) string {
	return AlbumNameFromDir(path.Dir(file))
}
