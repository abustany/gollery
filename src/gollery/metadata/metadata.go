package metadata

type AlbumMetadata struct {
	Public      bool   `json:"public"`
	SecretToken string `json:"secretToken"`
}

type MetadataManager interface {
	GetAlbumSecretToken(album string) string
	IsAlbumPublic(album string) bool
}

func CheckAlbumAccess(m MetadataManager, album string, token string) bool {
	if m.IsAlbumPublic(album) {
		return true
	}

	if token != "" && m.GetAlbumSecretToken(album) == token {
		return true
	}

	return false
}
