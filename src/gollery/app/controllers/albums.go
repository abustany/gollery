package controllers

import (
	"github.com/abustany/goexiv"
	"github.com/robfig/revel"
	"gollery/app"
	"gollery/app/common"
	"gollery/thumbnailer"
	"gollery/utils"
	"math/rand"
	"net/http"
	"os"
	"path"
	"strings"
)

type Albums struct {
	*revel.Controller
}

type AlbumInfo struct {
	Name  string `json:"name"`
	Cover string `json:"cover"`
}

type AlbumData struct {
	Name     string         `json:"name"`
	Pictures []*PictureInfo `json:"pictures"`
}

type PictureInfo struct {
	Path     string            `json:"path"`
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
	"Exif.GPSInfo.GPSAltitudeRef",
	"Exif.GPSInfo.GPSAltitude",
	"Exif.GPSInfo.GPSLatitudeRef",
	"Exif.GPSInfo.GPSLatitude",
	"Exif.GPSInfo.GPSLongitudeRef",
	"Exif.GPSInfo.GPSLongitude",
}

func (c *Albums) Index() revel.Result {
	watchedPaths := app.Monitor.WatchedDirectories()
	dirs := make([]*AlbumInfo, 0, len(watchedPaths))
	user := common.GetUser(c.Controller)

	for _, dir := range watchedPaths {
		if dir == common.RootDir || !strings.HasPrefix(dir, common.RootDir) {
			continue
		}

		dir = dir[1+len(common.RootDir):]

		cover, err := c.getAlbumCover(dir)

		if err != nil {
			revel.ERROR.Printf("Cannot lookup cover for album '%s': %s", dir, err)
		}

		if !app.Metadata.CanUserSee(user, dir) {
			continue
		}

		dirs = append(dirs, &AlbumInfo{
			Name:  dir,
			Cover: cover,
		})
	}

	c.Response.Status = http.StatusOK
	c.Response.ContentType = "application/json"
	return c.RenderJson(dirs)
}

func (c *Albums) getAlbumCover(name string) (string, error) {
	fis, err := c.listPictures(name)

	if (len(fis) == 0) {
		return "", nil
	}

	if err != nil {
		return "", utils.WrapError(err, "Cannot list album '%s'", name)
	}

	for i := 0; i < 10; i++ {
		fi := fis[rand.Int31n(int32(len(fis)))]
		filePath := path.Join(name, fi.Name())

		hasThumbnail, err := app.Thumbnailer.HasThumbnail(filePath, thumbnailer.THUMB_SMALL)

		if err != nil {
			return "", utils.WrapError(err, "Cannot check if thumbnail exists for '%s'", filePath)
		}

		if !hasThumbnail {
			continue
		}

		return filePath, nil
	}

	return "", nil
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

func (c *Albums) listPictures(name string) ([]os.FileInfo, error) {
	dirPath := path.Join(common.RootDir, name)
	dirFd, err := os.Open(dirPath)

	if os.IsNotExist(err) {
		return nil, nil
	}

	if err != nil {
		return nil, utils.WrapError(err, "Cannot open folder")
	}

	defer dirFd.Close()

	fis, err := dirFd.Readdir(-1)

	if err != nil {
		return nil, utils.WrapError(err, "Cannot list folder")
	}

	return fis, nil
}

func (c *Albums) Show(name string) revel.Result {
	revel.INFO.Printf("Loading album %s", name)

	if !app.Metadata.CheckAlbumAccess(name, common.GetUser(c.Controller), c.Params.Query.Get("token")) {
		c.Response.Status = http.StatusForbidden
		c.Response.ContentType = "application/json"
		return c.RenderJson(struct{}{})
	}

	fis, err := c.listPictures(name)

	if err != nil {
		c.Response.Status = http.StatusInternalServerError
		return c.RenderError(utils.WrapError(err, "Cannot read album"))
	}

	albumData := &AlbumData{
		Name:     name,
		Pictures: make([]*PictureInfo, 0, len(fis)),
	}

	dirPath := path.Join(common.RootDir, name)

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
			Path:     info.Name(),
			Metadata: metadata,
		}

		albumData.Pictures = append(albumData.Pictures, picInfo)
	}

	return c.RenderJson(albumData)
}
