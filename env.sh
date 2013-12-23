#!/bin/sh

if [ "$0" != "bash" -a "$0" != "-bash" ]; then
	echo "Please source me in a Bash shell!"
	return
fi

if readlink --help >/dev/null 2>&1; then
	MYDIR="$(dirname $(readlink -m $BASH_SOURCE))"
else
	MYDIR="$(dirname $(perl -MCwd -e "print Cwd::realpath(\"$BASH_SOURCE\")"))"
fi

case "$GOPATH" in
	"$MYDIR" | "$MYDIR:"*)
		echo "${MYDIR} is already first in GOPATH"
		;;
	*)
		echo "Prepending ${MYDIR} to GOPATH"
		export GOPATH="${MYDIR}${GOPATH:+:${GOPATH}}"
		;;
esac

REVEL_BIN="$(which revel 2>/dev/null)"

if [ -z "$REVEL_BIN" ]; then
	REVEL_BIN="${MYDIR}/bin/revel"
fi

if [ ! -x "$REVEL_BIN" ]; then
	echo -n "You don't seem to have the revel binary installed, install it? [y/n] "
	read X

	if [ "$X" = "y" ]; then
		go get github.com/robfig/revel/revel
	fi
fi
