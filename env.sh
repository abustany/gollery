#!/bin/sh

if [[ "$0" == "$BASH_SOURCE" ]]; then
	echo "Please source me in a Bash shell!"
	exit 1
fi

case "$(uname -s)" in
	Darwin)
		MYDIR="$(dirname $(perl -MCwd -e "print Cwd::realpath(\"$BASH_SOURCE\")"))"
		;;
	*)
		MYDIR="$(dirname $(readlink -m $BASH_SOURCE))"
		;;
esac

case "$GOPATH" in
	"$MYDIR" | "$MYDIR:"*)
		echo "${MYDIR} is already first in GOPATH"
		;;
	*)
		echo "Prepending ${MYDIR} to GOPATH"
		export GOPATH="${MYDIR}${GOPATH:+:${GOPATH}}"
		;;
esac

REVEL_BIN="$(which revel 2>/dev/null || : )"

if [ -z "$REVEL_BIN" ]; then
	REVEL_BIN="${MYDIR}/bin/revel"
fi

if [ ! -x "$REVEL_BIN" ]; then
	if [ -z "$GOLLERY_INSTALL_REVEL" ]; then
		echo -n "You don't seem to have the revel binary installed, install it? [y/n] "
		read X
	else
		X=y
	fi

	if [ "$X" = "y" ]; then
		go get github.com/robfig/revel/revel
	fi
fi
