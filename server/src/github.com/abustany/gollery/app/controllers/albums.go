package controllers

import (
	"github.com/abustany/goexiv"
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
	Metadata map[string]string `json:"metadata"`
}

var ExifKeys = []string{
	"Exif.Photo.ExifVersion",
	"Exif.Image.Make",
	"Exif.Image.Model",
	"Exif.Photo.DateTimeOriginal",
	"Exif.Photo.ExposureTime",
	"Exif.Photo.ShutterSpeedValue",
	"Exif.Photo.FNumber",
	"Exif.Photo.ApertureValue",
	"Exif.Photo.ExposureBiasValue",
	"Exif.Photo.Flash",
	"Exif.Photo.FocalLength",
	"Exif.Photo.FocalLengthIn35mmFilm",
	"Exif.Photo.SubjectDistance",
	"Exif.Photo.ISOSpeedRatings",
	"Exif.Photo.ExposureProgram",
	"Exif.Photo.MeteringMode",
	"Exif.Image.ImageWidth",
	"Exif.Photo.PixelXDimension",
	"Exif.Image.ImageLength",
	"Exif.Photo.PixelYDimension",
	"Exif.Image.Copyright",
	"Exif.Photo.UserComment",
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

func getMetadata(filePath string) (map[string]string, error) {
	fd, err := goexiv.Open(filePath)

	if err != nil {
		return nil, utils.WrapError(err, "Cannot open file to read metadata")
	}

	err = fd.ReadMetadata()

	if err != nil {
		return nil, utils.WrapError(err, "Cannot read metadata")
	}

	data := fd.GetExifData()

	metadata := make(map[string]string, len(ExifKeys))

	for _, key := range ExifKeys {
		val, err := data.FindKey(key)

		if err != nil {
			return nil, utils.WrapError(err, "Invalid EXIF key requested")
		}

		if val == nil {
			continue
		}

		metadata[key] = val.String()
	}

	return metadata, nil
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

		metadata, err := getMetadata(filePath)

		if err != nil {
			revel.ERROR.Printf("Cannot read metadata for file '%s': %s", filePath, err)
			metadata = map[string]string{}
		}

		picInfo := &PictureInfo{
			Path: info.Name(),
			Metadata: metadata,
		}

		albumData.Pictures = append(albumData.Pictures, picInfo)
	}

	return c.RenderJson(albumData)
}
