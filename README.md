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
* [compass](http://compass-style.org/) (for compiling the SCSS files to CSS)

Those dependencies should be packaged in any distribution.

Note that go and compass are only needed for building Gollery, the resulting
binary will not need those tools.

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

## Access control
Gollery uses a very (very) simple token system to grant access to albums. You
could think of it as an authentication scheme using a username and no password.
While that's totally insecure, it also makes Gollery way more family-compatible
(no, they don't remember yet another password, nor have Facebook accounts).
Making the authentication pluggable in the future to allow more secure schemes
shouldn't be too hard.

Gollery reads any file in the root directory (where the pictures are) called
`.gollery.metadata`, and uses that to configure the access rules. The
`.gollery.metadata` file in the root directory is a bit special, we call it the
root metadata file.

### Root metadata file
That's where you configure the users and groups. It looks like:

```
{
    "users": {
        "token1": {
            "name": "Token for myself"
        },
        "token2": {
            "name": "Another token for which I can configure different rules"
        }
    },
    "groups": {
        "family": {
            "members": ["token1"]
        },
        "trusted-people": {
            "members": ["token1", "token2"]
        }
    }
}
```

Its content should be self-explaining, you can define any number of tokens, and
use groups to group them together. At the moment, you can't nest groups, but
that might change at some point.

You can refer at any point to the `RootMetadata` struct definition in
`metadata.go` for an up to date reference.

### Album metadata file
That's the `.gollery.metadata` file that you can drop in any of your albums,
that is in any subfolder of the root folder. It looks like:

```
{
    "public": false,
    "allowed": [
        {"user": "token1"},
        {"group": "trusted-people"}
    ]
}
```

If you set the album to be `public`, then no authentication will be needed to
access it. That value is set to false by default, so that new albums don't get
published by accident.

For private albums, you can define a list of users or groups that will be
granted access (the example above is redundant, since "token1" is already in
the "trusted-people" group).

You can refer at any point to the `AlbumMetadata` struct definition in
`metadata.go` for an up to date reference.

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
