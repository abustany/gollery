package app

import (
	"github.com/abustany/gollery/thumbnailer"
	"github.com/robfig/revel"
	"github.com/robfig/revel/modules/jobs/app/jobs"
)

const (
	GOLLERY_CONFIG_ROOT_DIR  = "gollery.root_dir"
	GOLLERY_CONFIG_CACHE_DIR = "gollery.cache_dir"
)

var Thumbnailer *thumbnailer.Thumbnailer

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

	revel.OnAppStart(func() {
		initServices()
	})
}

func initServices() {
	rootdir, found := revel.Config.String(GOLLERY_CONFIG_ROOT_DIR)

	if !found {
		panic("Missing configuration parameter: " + GOLLERY_CONFIG_ROOT_DIR)
	}

	cachedir, found := revel.Config.String(GOLLERY_CONFIG_CACHE_DIR)

	if !found {
		panic("Missing configuration parameter: " + GOLLERY_CONFIG_CACHE_DIR)
	}

	var err error

	Thumbnailer, err = thumbnailer.NewThumbnailer(rootdir, cachedir)

	if err != nil {
		panic("Cannot initialize thumbnailer service: " + err.Error())
	}

	revel.INFO.Print("Started thumbnailing service")

	jobs.Now(jobs.Func(func() {
		err := Thumbnailer.CheckCache()

		if err != nil {
			revel.ERROR.Printf("Cannot check the thumbnail cache: %s", err)
		}

		err = Thumbnailer.SetupMonitors()

		if err != nil {
			revel.ERROR.Printf("Cannot start file monitoring for the thumbnailer: %s", err)
		}
	}))
}
