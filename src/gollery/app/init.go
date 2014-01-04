package app

import (
	"github.com/robfig/revel"
	"github.com/robfig/revel/modules/jobs/app/jobs"
	"gollery/app/common"
	"gollery/auth"
	"gollery/metadata"
	"gollery/monitor"
	"gollery/thumbnailer"
	"runtime"
)

var Metadata metadata.MetadataManager
var Monitor *monitor.Monitor
var Thumbnailer *thumbnailer.Thumbnailer
var Groups auth.GroupBackend

// auto defined by the revel builder
var APP_VERSION string
var Version string

func init() {
	// Filters is the default set of global filters.
	revel.Filters = []revel.Filter{
		revel.PanicFilter,             // Recover from panics and display an error page instead.
		revel.RouterFilter,            // Use the routing table to select the right Action
		revel.FilterConfiguringFilter, // A hook for adding or removing per-Action filters.
		revel.ParamsFilter,            // Parse parameters into Controller.Params.
		revel.SessionFilter,           // Restore and write the session cookie.
		revel.FlashFilter,             // Restore and write the flash cookie.
		revel.ValidationFilter,        // Restore kept validation errors and save new ones from cookie.
		revel.I18nFilter,              // Resolve the requested language
		revel.InterceptorFilter,       // Run interceptors around the action.
		revel.ActionInvoker,           // Invoke the action.
	}

	Version = APP_VERSION

	revel.OnAppStart(func() {
		initServices()
	})

	// Use as many threads as we have CPUs, helps for thumbnailing
	runtime.GOMAXPROCS(runtime.NumCPU())
}

func initServices() {
	var found bool

	common.RootDir, found = revel.Config.String(common.GOLLERY_CONFIG_ROOT_DIR)

	if !found {
		panic("Missing configuration parameter: " + common.GOLLERY_CONFIG_ROOT_DIR)
	}

	cachedir, found := revel.Config.String(common.GOLLERY_CONFIG_CACHE_DIR)

	if !found {
		panic("Missing configuration parameter: " + common.GOLLERY_CONFIG_CACHE_DIR)
	}

	var err error

	Monitor, err = monitor.NewMonitor()

	if err != nil {
		panic("Cannot initalize file monitoring: " + err.Error())
	}

	Monitor.Watch(common.RootDir)

	Thumbnailer, err = thumbnailer.NewThumbnailer(common.RootDir, cachedir, Monitor)

	if err != nil {
		panic("Cannot initialize thumbnailer service: " + err.Error())
	}

	Groups, err = auth.NewFSGroupBackend(common.RootDir, Monitor)

	if err != nil {
		panic("Cannot initialize groups backend: " + err.Error())
	}

	revel.INFO.Print("Started thumbnailing service")

	jobs.Now(jobs.Func(func() {
		err := Thumbnailer.CheckCache()

		if err != nil {
			revel.ERROR.Printf("Cannot check the thumbnail cache: %s", err)
		}
	}))

	Metadata, err = metadata.NewFSMetadataManager(common.RootDir, Monitor)

	if err != nil {
		panic("Cannot initalize album metadata service: " + err.Error())
	}
}
