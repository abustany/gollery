# Gollery

No-fuss, easy to operate web-based photo viewer with a mobile friendly UI and
advanced EXIF metadata support.

**DISCLAIMER: This is still in a very rough state, but already functional. The
code base is still moving a lot, and many planned features are still missing.**

## Current features

* File system based, one folder = one album
* Monitors the filesystem, so you can rsync your files and new folders get
  immediately indexed
* Sorts albums using the date from the EXIF metadata if present
* Can display a "map of pictures" of an album, if pictures are geotagged
* Touch friendly - UI suits tablets too and is gesture enabled
* Fast thumbnailing using ImageMagick
* Image preloading in the viewer for a responsive UI
* Internationalized UI (see `src/gollery/static/i18n` for the list of supported
  languages)

## Planned features

* Access control, using Mozilla Persona/other ID providers for accounts
* Admin interface to define permissions and additional album metadata
  (description etc.)
* Less ugly UI
* Caching on server side to make things snappier
* Abstract storage backend to allow running the app on Google App Engine or
  Heroku, against storage services like S3 or Google Cloud Storage
* Initial setup assistant

## Requirements

* [Go](http://golang.org/) version 1.2
* [ImageMagick](http://imagemagick.org/)
* [exiv2](http://exiv2.org/) (required by goexiv)
* [grunt](http://gruntjs.com) (for building the UI bits)

Those dependencies should be packaged in any distribution.

Note that go and grunt are only needed for building Gollery, the resulting
binary will not need those tools.

## 1 minute startup guide

* Install the Gollery build dependencies
  * **Fedora:** `yum install gcc-c++ git mercurial exiv2-devel ImageMagick-devel
    npm nodejs-grunt-cli golang`
  * **Ubuntu:** `apt-get install g++ git mercurial libexiv2-dev
    libmagickwand-dev npm golang && npm install --global grunt-cli`
  * **Mac OS X (with Homebrew):** install git and clang by invoking them in a
    terminal (OS X provide shims that will trigger the installation of the real
    software when ran), install NodeJS, Go and Mercurial from their upsream
    websites, install the other dependencies using `brew`: `brew install
    pkg-config exiv2 imagemagick`
* Clone the source code
* Setup your environment (`GOPATH`) for running the app by sourcing the `env.sh`
  file in your shell (answer "y" when it prompts you to install the revel tool)
* Install the required go packages with `go get gollery/...`
* Generate the UI files with `npm install && grunt`
* Copy `src/gollery/conf/app.conf.dist` to `src/gollery/conf/app.conf` and edit
  the top lines to set at least the path to the folder with your pictures
* Start the application with `./bin/revel run gollery`
* Load the address in your browser (by default, the server will listen on any
  address on port 9000 - so you can access it at [http://localhost:9000/] ).
  The first page load will take some time as the code needs to be compiled.

For more advanced deployment options, refer to the [upstream revel
documentation](http://robfig.github.io/revel/manual/deployment.html).

## Common issues

### When installing the required go modules, it fails complaining about missing symbols

If the module installation fails complaining about undefined symbols like
`exiv2_image_factory_open`, you're probably not using Go version 1.2. Releases
of Go before 1.2 do not detect C++ files in CGo modules like goexiv, and do
not compile them with the module. Run `go version` to make sure you're using
Go 1.2.

If the installation fails because of some other missing symbols, you're maybe
missing some system dependencies (see the [requirements](#requirements)
section), or maybe a C++ compiler altogether.
