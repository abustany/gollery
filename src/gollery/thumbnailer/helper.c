#include "helper.h"

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <wand/MagickWand.h>

struct _GolleryThumbnailer {
	MagickWand *wand;
};

static const double SAMPLING_FACTORS_211[] = {2., 1., 1.};
static const size_t SAMPLING_FACTORS_SIZE = sizeof(SAMPLING_FACTORS_211) / sizeof(double);

void
gollery_thumbnailer_init()
{
	// Nobody will call MagickWandTerminus()... Oh well
	MagickWandGenesis();
}

GolleryThumbnailer*
gollery_thumbnailer_new()
{
	GolleryThumbnailer *t = calloc(sizeof(GolleryThumbnailer), 1);
	t->wand = NewMagickWand();

	return t;
}

void
gollery_thumbnailer_free(GolleryThumbnailer *t)
{
	if (!t) {
		return;
	}

	DestroyMagickWand(t->wand);
	free(t);
}

static int
forward_error(MagickWand *wand, MagickBooleanType status, char **error, const char *prefix)
{
	if (status == MagickTrue) {
		return 0;
	}

	if (error) {
		ExceptionType severity; // unused
		char *magickException = MagickGetException(wand, &severity);
		asprintf(error, "%s: %s", prefix, magickException);
		MagickRelinquishMemory(magickException);
	}

	ClearMagickWand(wand);

	return 1;
}

int
gollery_thumbnailer_resize(GolleryThumbnailer *t, const char *src, const char *dst, const size_t size, char **error)
{
	MagickWand *wand = t->wand;
	MagickBooleanType status = MagickFalse;

	status = MagickSetSamplingFactors(wand, SAMPLING_FACTORS_SIZE, SAMPLING_FACTORS_211);

	if (forward_error(wand, status, error, "Cannot set sampling factors")) {
		return 0;
	}

	status = MagickReadImage(wand, src);

	if (forward_error(wand, status, error, "Cannot load image")) {
		return 0;
	}

	const size_t w = MagickGetImageWidth(wand);
	const size_t h = MagickGetImageHeight(wand);
	size_t sw, sh;

	if (w > h) {
		sw = size;
		sh = 1.0 * size / w * h;
	} else {
		sh = size;
		sw = 1.0 * size / h * w;
	}

	// The quality of the Triangle filter is probably not as great as Lanczos,
	// but it's twice as fast.
	status = MagickResizeImage(wand, sw, sh, TriangleFilter, 1.0);

	if (forward_error(wand, status, error, "Cannot resize image")) {
		return 0;
	}

	status = MagickStripImage(wand);

	if (forward_error(wand, status, error, "Cannot strip image")) {
		return 0;
	}

	status = MagickSetImageCompressionQuality(wand, 80);

	if (forward_error(wand, status, error, "Cannot set compression quality")) {
		return 0;
	}

	status = MagickWriteImage(wand, dst);

	if (forward_error(wand, status, error, "Cannot write image")) {
		return 0;
	}

	ClearMagickWand(wand);

	return 1;
}
