package utils

import (
	"fmt"
)

type WrappedError struct {
	Prefix     string
	InnerError error
}

func (w *WrappedError) Error() string {
	return w.Prefix + ": " + w.InnerError.Error()
}

func WrapError(err error, format string, args ...interface{}) error {
	if err == nil {
		return nil
	}

	return &WrappedError{
		fmt.Sprintf(format, args...),
		err,
	}
}
