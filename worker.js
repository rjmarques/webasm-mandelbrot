self.importScripts('mandelbrot.js');

Module.addOnPostRun(() => {
	postMessage(true);
});

onmessage = function (evt) {
	var data = evt.data;
	const mandelbrot = Module.mandelbrot(data.yStart, data.yEnd, data.width, data.height, data.zoom, data.moveX, data.moveY);
	postMessage({
		yStart: data.yStart, 
		yEnd: data.yEnd,
		mandelbrot
	});
}