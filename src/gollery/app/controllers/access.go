package controllers

import (
	"github.com/robfig/revel"
	"gollery/metadata"
	"strings"
)

func GetCookieTokens(r *revel.Request) []string {
	cookie, err := r.Cookie("gollery_tokens")

	if err != nil {
		return []string{}
	}

	return strings.Split(cookie.Value, "%2C")
}

func CheckAlbumAccess(m metadata.MetadataManager, dir string, r *revel.Request) bool {
	for _, token := range GetCookieTokens(r) {
		if metadata.CheckAlbumAccess(m, dir, token) {
			return true
		}
	}

	return metadata.CheckAlbumAccess(m, dir, "")
}
