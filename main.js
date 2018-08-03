const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 800;
const canvas = document.getElementById('canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const context = canvas.getContext('2d');

// initial base values
var ZOOM = 1;
var MOVE_X = 0, MOVE_Y = 0;
 
// mandel params
const width = canvas.clientWidth;
const height = canvas.clientHeight;
var zoom = ZOOM;
var moveX = MOVE_X, moveY = MOVE_Y;

var needsUpdate = true; // true if the params have changed since last plot
var activeWorkerCount = 0; // > 0 if there's a worker processing a request

// web workers to calculate the mandelbrot
var workersReady = 0;
var workers = [initWorker(), initWorker(), initWorker(), initWorker()];

function reset() {
    zoom = ZOOM;
    moveX = MOVE_X;
    moveY = MOVE_Y;
    needsUpdate = true;
}

function initWorker() {
    var webworker = new Worker("worker.js");

    webworker.onerror = function (evt) {
        console.log(`Error from Web Worker: ${evt.message}`);
    }
    webworker.onmessage = function (evt) {        
        // web worker is ready!
        if(evt.data === true) {
            workersReady++;
            animate();
        } 
        // draw on canvas
        else {
            drawMandelSection(evt.data.yStart, evt.data.yEnd, evt.data.mandelbrot);
        }
    }

    return webworker;
}

function drawMandelSection(yStart, yEnd, mandelbrot) {
    const imageData = new ImageData(new Uint8ClampedArray(mandelbrot), width, yEnd - yStart); 
    context.putImageData(imageData, 0, yStart);
    activeWorkerCount--;
}

function animate() {
    // workers are still starting up
    if(workersReady < workers.length) { return; }

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

    const sectionHeight = height / workers.length;
    let currHeight = 0;
    workers.forEach((w, index) => {
        w.postMessage(
            {
                yStart: currHeight,
                yEnd: currHeight + sectionHeight,
                width,
                height,
                zoom,
                moveX,
                moveY
            }
        );    

        currHeight += sectionHeight;
        activeWorkerCount++; 
    });         
}

window.addEventListener("mousewheel", MouseWheelHandler, false);

const DELTA_SCALE_FACTOR = 8;

function MouseWheelHandler(e) {
    if(activeWorkerCount) { return; }

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