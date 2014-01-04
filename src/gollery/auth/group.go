package auth

type GroupBackend interface {
	UserBelongsToGroup(user string, group string) (bool, error)
}
