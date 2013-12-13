#!/bin/sh

set -e

if [ ! -f "/vagrant/vagrant_provision.sh" ]; then
	echo "This script is only supposed to be run inside Vagrant"
	exit 1
fi

echo "*** Installing the system dependencies"
yum -y install \
	exiv2-devel \
	gcc-c++ \
	git \
	ImageMagick-devel \
	mercurial \
	pkgconfig

# Install go
VMARCH=$(uname -m)
GOARCH=
GOVERSION=1.2

case "$VMARCH" in
	x86_64)
		GOARCH=amd64
		;;
	i386 | i486 | i586 | i686)
		GOARCH=386
		;;
	*)
		echo "Unsupported architecture $VMARCH"
		exit 1
		;;
esac

GOFILENAME="go${GOVERSION}.linux-${GOARCH}.tar.gz"
GOURL="https://go.googlecode.com/files/$GOFILENAME"

echo "*** Setting up Go"
if [ ! -f "/opt/$GOFILENAME" ]; then
	echo "*** Downloading Go from $GOURL"
	(cd /opt && wget $GOURL && tar xf $GOFILENAME)
fi

cat >/etc/profile.d/go.sh <<EOF
export GOROOT=/opt/go
export PATH=\$GOROOT/bin\${PATH:+:\${PATH}}
EOF

echo
echo "Your VM is ready!"

