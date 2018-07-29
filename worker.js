self.importScripts('mandelbrot.js');

Module.addOnPostRun(() => {
	postMessage(true);
});

onmessage = function (evt) {
	var data = evt.data;
	const mandelbrot = Module.mandelbrot(data.width, data.height, data.zoom, data.moveX, data.moveY);
	postMessage(mandelbrot);
}