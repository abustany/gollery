package controllers

import (
	"github.com/abustany/gollery/app"
	"github.com/abustany/gollery/thumbnailer"
	"github.com/abustany/gollery/utils"
	"github.com/robfig/revel"
	"net/http"
)

type Thumbnails struct {
	*revel.Controller
}

var SizeMap = map[string]thumbnailer.ThumbnailSize{
	"small": thumbnailer.THUMB_SMALL,
	"large": thumbnailer.THUMB_LARGE,
}

func (t *Thumbnails) Thumbnail(size string, name string) revel.Result {
	var tSize thumbnailer.ThumbnailSize
	var ok bool

	if tSize, ok = SizeMap[size]; !ok {
		t.Response.Status = http.StatusBadRequest
		t.Response.ContentType = "text/plain"
		return t.RenderText("Invalid thumbnail size")
	}

	fd, err := app.Thumbnailer.GetThumbnail(name, tSize)

	if err != nil {
		t.Response.Status = http.StatusInternalServerError
		return t.RenderError(utils.WrapError(err, "Cannot get thumbnail"))
	}

	if fd == nil {
		t.Response.Status = http.StatusNotFound
		t.Response.ContentType = "text/plain"
		return t.RenderText("Not found")
	}

	return t.RenderFile(fd, revel.Inline)
}
