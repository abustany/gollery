#!/bin/sh

set -e

cd $(dirname $0)

host_commands() {
	docker build -t gollery-build-container .
	rm -fr src out
	git clone file://$(pwd)/.. src
	cp ../src/gollery/conf/app.conf src/src/gollery/conf/
	mkdir out
	chcon -Rt svirt_sandbox_file_t src out
	docker run -v $(pwd)/src:/workspace:Read-Only -v $(pwd)/out:/out --rm=true --env=GOLLERY_CONTAINER=1 gollery-build-container
}

container_commands() {
	cp -a /workspace gollery
	cd gollery
	unset GOPATH
	export GOLLERY_INSTALL_REVEL=1
	export GOLLERY_VERSION=$(git describe --always --dirty)
	source ./env.sh
	echo "Running go get..."
	go get gollery/...
	echo "Packaging gollery..."
	./bin/revel package gollery
	mv gollery.tar.gz /out/

}

if [ -z "$GOLLERY_CONTAINER" ]; then
	host_commands
else
	container_commands
fi
