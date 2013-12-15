package controllers

import (
	"fmt"
	"github.com/robfig/revel"
	"gollery/app"
	"gollery/thumbnailer"
	"gollery/utils"
	"net/http"
	"time"
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

	expireDuration := 5 * time.Minute
	cacheControl := fmt.Sprintf("max-age=%d", int(expireDuration.Seconds()))
	expires := time.Now().Add(expireDuration).Format(time.RFC1123)

	t.Response.Out.Header().Add("Cache-Control", cacheControl)
	t.Response.Out.Header().Add("Expires", expires)

	return t.RenderFile(fd, revel.Inline)
}
