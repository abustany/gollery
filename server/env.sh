#!/bin/sh

if [ "$0" != "bash" ]; then
	echo "Please source me in a Bash shell!"
	exit 1
fi

MYDIR="$(dirname $(readlink -m $BASH_SOURCE))"

case "$GOPATH" in
	"$MYDIR" | "$MYDIR:"*)
		echo "${MYDIR} is already first in GOPATH"
		;;
	*)
		echo "Prepending ${MYDIR} to GOPATH"
		export GOPATH="${MYDIR}${GOPATH:+:${GOPATH}}"
		;;
esac
