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
* Per album access control, either setting a private/public switch or defining a
  secret access token

### More details about access control

Access control settings are defined by creating a file named `.gollery.metadata`
in the album folder. If no such file is present, the album is considered public
and can be viewed by anyone.

The `.gollery.metadata` file should contain a JSON object with any of the
following keys:

```
{
  "public": false,
  "secretToken": "abcdef"
}
```

The `public` defines if the album should be publicly viewable or not. Setting
`public` to `true` has the same effect as not having a metadata file at all. If
`public` is set to `false`, then `secretToken` should be defined to an arbitrary
string, the secret to know in order to view this album. We recommend using only
letters and digits for the secret token.

Once `public` has been set to `false`, the album will disappear from the list of
albums in the main page. In order to get access to the private albums, the user
needs to pass one or many access tokens in the `tokens` URL parameter, like
this:

```
http://my.gollery.server/?tokens=oneToken,anotherToken
```

Tokens will be saved in a cookie, so they don't need to be specified again in
later loads.

## Planned features

* Admin interface to define permissions and additional album metadata
  (description etc.)
* Less ugly UI
* Caching on server side to make things snappier
* Abstract storage backend to allow running the app on Google App Engine or
  Heroku, against storage services like S3 or Google Cloud Storage
* Initial setup assistant
* Option to define whether albums with no metadata file should be public or
  private

## Requirements

* [Go](http://golang.org/) version 1.2
* [ImageMagick](http://imagemagick.org/)
* [exiv2](http://exiv2.org/) (required by goexiv)
* [grunt](http://gruntjs.com) (for building the UI bits)

Those dependencies should be packaged in any distribution.

Note that go and grunt are only needed for building Gollery, the resulting
binary will not need those tools.

## 1 minute startup guide (for developers)

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

## Generating a standalone archive ready to be deployed on a server

* Install the Gollery build dependencies
* Clone the source code
* Copy `src/gollery/conf/app.conf.dist` to `src/gollery/conf/app.conf` and edit
  the top lines to suit your needs
* Run `npm install && grunt package`
* You should now have a `tar.bz2` archive in the directory ready to deploy
  **Note:** The archive does not include the configuration file from the
  previous step.

## Generating a standalone archive ready to be deployed on CentOS using Docker

Since Gollery links against system library like ImageMagick, you need to build
it against the environment you want to deploy in. For example, if your build
host is a recent Fedora, the resulting binary won't run on CentOS which has a
much older ImageMagick.  To make building Gollery easier, we provide a
Dockerfile that can be used to build Gollery in a CentOS container. You still
need to have the tools to build the UI present on the host, since only the
gollery binary will be built in the container.

The steps to generate a Gollery archive are:

* Install [Docker](http://docker.io). The package is called `docker-io` on
  Fedora and Ubuntu. Note that after installing Docker, you probably need to add
  your user to the `docker` group in order to be allowed to use it.
* Generate a Gollery tarball: `cd build && ./build.sh`

The first build will take a while, since it needs to download the base image,
and all the dependencies needed to build Gollery. However, all of that will be
cached, so subsequent builds will be much faster. Once the builds completes,
there will be a tar.bz2 archive in the `build` folder. That archive can be
unzipped on the target server, and Gollery can be started with the `run.sh`
script after editing the `app.conf` file as in the other scenarios.

## Other deployment options

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
