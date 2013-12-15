#ifndef _GOLLERY_THUMBNAILER_H
#define _GOLLERY_THUMBNAILER_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>

typedef struct _GolleryThumbnailer GolleryThumbnailer;

// Must be called before any other calls here
void gollery_thumbnailer_init();

GolleryThumbnailer* gollery_thumbnailer_new();
void gollery_thumbnailer_free(GolleryThumbnailer *t);

// Resizes the image at path src to path dst at a given size, preserving ratio.
// Returns 1 on success, 0 on failure (ie. a bool)
// On failure, if **error is not NULL, the string is allocated and an error
// message is copied there. The string must then be freed by the caller.
int gollery_thumbnailer_resize(GolleryThumbnailer *t, const char *src, const char *dst, size_t size, char **error);

#ifdef __cplusplus
} // extern "C"
#endif

#endif // _GOLLERY_THUMBNAILER_H
