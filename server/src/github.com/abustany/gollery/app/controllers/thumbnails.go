package controllers

import (
	"github.com/abustany/gollery/app"
	"github.com/abustany/gollery/utils"
	"github.com/robfig/revel"
	"net/http"
)

type Thumbnails struct {
	*revel.Controller
}

func (t *Thumbnails) Thumbnail(name string) revel.Result {
	fd, err := app.Thumbnailer.GetThumbnail(name)

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
