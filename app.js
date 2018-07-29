const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 350;
const canvas = document.getElementById('canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// mandel params
const width = canvas.clientWidth;
const height = canvas.clientHeight;
var zoom = 1;
var moveX = 0, moveY = 0;

var needsUpdate = true; // true if the params have changed since last plot

// draw the first time after webasm loaded
Module.addOnPostRun(() => {
    animate();
});

function animate() {
    requestAnimationFrame(animate);

    if(needsUpdate) {
        drawMandel();
        needsUpdate = false;
    }
}

function drawMandel() {
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }            

    // console.time('mandelbrot');
    const mandelbrot = Module.mandelbrot(width, height, zoom, moveX, moveY);
    // console.timeEnd('mandelbrot');
    
    // console.time('canvas');
    const imageData = new ImageData(new Uint8ClampedArray(mandelbrot), width, height);
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    // console.timeEnd('canvas');            
}

window.addEventListener("mousewheel", MouseWheelHandler, false);

const DELTA_SCALE_FACTOR = 8;

function MouseWheelHandler(e) {
    var e = window.event || e;
    var oldZoom = zoom;

    // new zoom
    var zoomDelta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    zoom = Math.max(1, zoom * (1 + zoomDelta / 10));

    if(zoom === oldZoom) {
        return; // nothing to do
    }

    // new moveX and moveY
    var deltas = getDeltas(e.x, e.y);
    moveX += ((deltas.x/DELTA_SCALE_FACTOR) / zoom) * zoomDelta;
    moveY += ((deltas.y/DELTA_SCALE_FACTOR) / zoom) * zoomDelta;

    needsUpdate = true;
}

function getDeltas(xPos, yPos) {
    var canvasRect = canvas.getBoundingClientRect(); 
    var canvasLowerX = canvasRect.left;
    var canvasLowerY = canvasRect.top;
    var canvasUpperX = canvasRect.right;
    var canvasUpperY = canvasRect.bottom;

    // transform coordinates to canvas positions
    xPos = Math.min(canvasUpperX, Math.max(canvasLowerX, xPos));
    yPos = Math.min(canvasUpperY, Math.max(canvasLowerY, yPos));

    // normalize positions between -1 and 1
    // NewValue = (((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin
    deltaX = (((xPos - canvasLowerX) * 2) / canvasRect.width) - 1
    deltaY = (((yPos - canvasLowerY) * 2) / canvasRect.height) - 1

    return {
        x: deltaX,
        y: deltaY
    };
}