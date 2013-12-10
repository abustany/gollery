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
* Touch friendly - UI suits tablets too and is gesture enabled (handheld UI
  in the works)

## Planned features

* Token based access control: user "unlocks" tokens, and each token gives
  access to a set of albums
* Admin interface to define tokens and additional album metadata (description
  etc.), and monitor the server status (thumbnailer etc.)
* Less ugly UI
* Caching to make things snappier
* Abstract storage backend to allow running the app on Google App Engine or
  Heroku, against storage services like S3 or Google Cloud Storage
* Initial setup assistant

## Requirements

* Go version 1.2
* [ImageMagick](http://imagemagick.org/) (required by the gographics/imagick
  module)
* [exiv2](http://exiv2.org/) (required by goexiv)
* [compass](http://compass-style.org/) (for compiling the SCSS files to CSS)

Those dependencies should be packaged in any distribution.

## 1 minute startup guide

* Clone the source code
* Install the dependencies (on Fedora/RedHat systems, you need the packages
  `exiv2-devel`, `ImageMagick-devel` and `rubygem-compass`, on Ubuntu it's
  probably `libexiv2-dev`, `libmagickwand-dev` and `ruby-compass`)
* Setup your environment (`GOPATH`) for running the app by sourcing the `env.sh`
  file in your shell (answer "y" when it prompts you to install the revel tool)
* Install the required go packages with `go get gollery/...`
* Generate the CSS files with `(cd src/gollery/static && compass compile)`
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
missing the system dependecies (see #requirements).
