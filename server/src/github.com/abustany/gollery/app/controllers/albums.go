package controllers

import (
	"github.com/abustany/gollery/app"
	"github.com/abustany/gollery/thumbnailer"
	"github.com/abustany/gollery/utils"
	"github.com/robfig/revel"
	"net/http"
	"os"
	"path"
	"strings"
)

type Albums struct {
	*revel.Controller
}

type AlbumInfo struct {
	Name string `json:"name"`
}

type AlbumData struct {
	Name     string         `json:"name"`
	Pictures []*PictureInfo `json:"pictures"`
}

type PictureInfo struct {
	Path string `json:"path"`
}

func (c *Albums) Index() revel.Result {
	watchedPaths := app.Monitor.WatchedDirectories()
	dirs := make([]*AlbumInfo, 0, len(watchedPaths))

	for _, dir := range watchedPaths {
		if dir == app.RootDir || !strings.HasPrefix(dir, app.RootDir) {
			continue
		}

		dir = dir[1+len(app.RootDir):]
		dirs = append(dirs, &AlbumInfo{
			Name: dir,
		})
	}

	c.Response.Status = http.StatusOK
	c.Response.ContentType = "application/json"
	return c.RenderJson(dirs)
}

func (c *Albums) Show(name string) revel.Result {
	revel.INFO.Printf("Loading album %s", name)

	dirPath := path.Join(app.RootDir, name)
	dirFd, err := os.Open(dirPath)

	if os.IsNotExist(err) {
		c.Response.Status = http.StatusNotFound
		c.Response.ContentType = "application/json"
		return c.RenderJson(struct{}{})
	}

	if err != nil {
		c.Response.Status = http.StatusInternalServerError
		return c.RenderError(utils.WrapError(err, "Cannot open album"))
	}

	fis, err := dirFd.Readdir(-1)

	if err != nil {
		c.Response.Status = http.StatusInternalServerError
		return c.RenderError(utils.WrapError(err, "Cannot read album"))
	}

	albumData := &AlbumData{
		Name:     name,
		Pictures: make([]*PictureInfo, 0, len(fis)),
	}

	for _, info := range fis {
		filePath := path.Join(dirPath, info.Name())

		hasThumbnail, err := app.Thumbnailer.HasThumbnail(filePath, thumbnailer.THUMB_SMALL)

		if err != nil {
			c.Response.Status = http.StatusInternalServerError
			c.RenderError(utils.WrapError(err, "Cannot check for thumbnail"))
		}

		if !hasThumbnail {
			continue
		}

		picInfo := &PictureInfo{
			Path: info.Name(),
		}

		albumData.Pictures = append(albumData.Pictures, picInfo)
	}

	return c.RenderJson(albumData)
}
