#!/bin/sh

set -e

cd $(dirname $0)

host_commands() {
	docker build -t gollery-build-container .
	mkdir -p out
	docker run -v $(pwd)/..:/workspace:Read-Only -v $(pwd)/out:/out --rm=true --env=GOLLERY_CONTAINER=1 gollery-build-container
}

container_commands() {
	git clone /workspace gollery
	cd gollery
	cp /workspace/src/gollery/conf/app.conf src/gollery/conf/
	npm install
	scl enable ruby200 "grunt package"
	cp gollery-*.tar.bz2 /out/
}

if [ -z "$GOLLERY_CONTAINER" ]; then
	host_commands
else
	container_commands
fi
