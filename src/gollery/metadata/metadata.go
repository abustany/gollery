package metadata

type User struct {
	Name string `json:"name"`
}

type Group struct {
	Members []string `json:"members"`
}

type UserOrGroup struct {
	User  string `json:"user"`
	Group string `json:"group"`
}

type AlbumMetadata struct {
	Public      bool           `json:"public"`
	Allowed     []*UserOrGroup `json:"allowed"`
	SecretToken string         `json:"secretToken"`
}

type MetadataManager interface {
	CanUserSee(user string, album string) bool
	GetAlbumSecretToken(album string) string
}

func CheckAlbumAccess(m MetadataManager, album string, user string, token string) bool {
	if m.CanUserSee(user, album) {
		return true
	}

	if token != "" && m.GetAlbumSecretToken(album) == token {
		return true
	}

	return false
}
