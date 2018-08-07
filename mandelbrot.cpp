#include <emscripten/bind.h>
#include <cstddef>
#include <cstdlib>

using namespace emscripten;

typedef struct {
	double r; // a fraction between 0 and 1
	double g; // a fraction between 0 and 1
	double b; // a fraction between 0 and 1
} rgb;

typedef struct {
	double h; // angle in degrees
	double s; // a fraction between 0 and 1
	double v; // a fraction between 0 and 1
} hsv;

static rgb hsv2rgb(hsv in) {
	double hh, p, q, t, ff;
	long i;
	rgb out;

	if (in.s <= 0.0) {
		out.r = in.v;
		out.g = in.v;
		out.b = in.v;
		return out;
	}
	hh = in.h;
	if (hh >= 360.0)
		hh = 0.0;
	hh /= 60.0;
	i = (long)hh;
	ff = hh - i;
	p = in.v * (1.0 - in.s);
	q = in.v * (1.0 - (in.s * ff));
	t = in.v * (1.0 - (in.s * (1.0 - ff)));

	switch (i) {
	case 0:
		out.r = in.v;
		out.g = t;
		out.b = p;
		break;
	case 1:
		out.r = q;
		out.g = in.v;
		out.b = p;
		break;
	case 2:
		out.r = p;
		out.g = in.v;
		out.b = t;
		break;

	case 3:
		out.r = p;
		out.g = q;
		out.b = in.v;
		break;
	case 4:
		out.r = t;
		out.g = p;
		out.b = in.v;
		break;
	case 5:
	default:
		out.r = in.v;
		out.g = p;
		out.b = q;
		break;
	}
	return out;
}

uint8_t *buffer = nullptr;

// Mandlebrot definition from http://lodev.org/cgtutor/juliamandelbrot.html
val mandelbrot(int yStart, int yEnd, int w, int h, double zoom, double moveX, double moveY, int maxIterations) {
	if (buffer != nullptr) {
		free(buffer);
	}

	// The image format that imageData expects is four unsigned bytes: red, green, blue, alpha
	size_t bufferSize = w * (yEnd-yStart) * 4;
	buffer = (uint8_t *)malloc(bufferSize);
	if (buffer == nullptr) {
		return val::undefined();
	}

	for (int y = yStart, rowCount = 0; y < yEnd; y++, rowCount++) {
		for (int x = 0; x < w; x++) {
			double pr = 1.5 * (x - w / 2) / (0.5 * zoom * w) + moveX;
			double pi = (y - h / 2) / (0.5 * zoom * h) + moveY;
			double newRe, newIm, oldRe, oldIm;
			newRe = newIm = oldRe = oldIm = 0; 
			
			int i;
			for (i = 0; i < maxIterations; i++) {
				oldRe = newRe;
				oldIm = newIm;
				newRe = oldRe * oldRe - oldIm * oldIm + pr;
				newIm = 2 * oldRe * oldIm + pi;
				if ((newRe * newRe + newIm * newIm) > 4) {
					break;
				}
			}

			hsv hsvColor;
			hsvColor.h = i % 360;
			hsvColor.s = 1; // fully saturated.
			hsvColor.v = (i < maxIterations);
			rgb color = hsv2rgb(hsvColor);
			
			size_t bufferOffset = (x + rowCount * w) * 4;
			buffer[bufferOffset + 0] = color.r * 255;
			buffer[bufferOffset + 1] = color.g * 255;
			buffer[bufferOffset + 2] = color.b * 255;
			buffer[bufferOffset + 3] = 255;
		}
	}

	return val(typed_memory_view(bufferSize, buffer));
}

EMSCRIPTEN_BINDINGS(hello) {
	function("mandelbrot", &mandelbrot);
}
