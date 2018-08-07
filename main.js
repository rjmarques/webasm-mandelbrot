const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 800;
const canvas = document.getElementById('canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const context = canvas.getContext('2d');

// initial base values
const ZOOM = 1;
const MOVE_X = -0.5, MOVE_Y = 0;
const MAX_ITERATIONS = 512;
const NUMBER_WORKERS = 2;
 
// mandel params
const width = canvas.clientWidth;
const height = canvas.clientHeight;
let zoom = ZOOM;
let moveX = MOVE_X, moveY = MOVE_Y;
let maxIterations = MAX_ITERATIONS;
let numberWorkers = NUMBER_WORKERS;

// mandelbrot orchestration
let needsUpdate = true; // true if the params have changed since last plot
let activeWorkerCount = 0; // > 0 if there's a worker processing a request
let workers = []; // web workers to calculate the mandelbrot
let workersReady = -1; // how many workers have reported for duty..sir!

// performance metrics
let t0, t1;

function init() {
    updateWorkerPool();
    updateInputs();
    animate();
}
init(); // for some reason it feels right to wrap initialization in a function... O.o

/* MANDELBROT CALCULATION */

function updateWorkerPool() {
    const currNumberWorkers = workers.length;
    workersReady = currNumberWorkers;

    for (let i = currNumberWorkers; i < numberWorkers; i++) {
        workers.push(initWorker());
    }

    for (let i = workers.length; i > numberWorkers; i--) {
        const worker = workers.pop();
        worker.terminate();
        workersReady--;
    }
}

function initWorker() {
    const webworker = new Worker("worker.js");

    webworker.onerror = function (evt) {
        console.log(`Error from Web Worker: ${evt.message}`);
    }
    webworker.onmessage = function (evt) {        
        // web worker is ready!
        if(evt.data === true) {
            workersReady++;
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
    // all workers have finished
    if(!activeWorkerCount) {
        endTimer(); 
    }
}

function animate() {
    requestAnimationFrame(animate);

    // workers are still starting up
    if(workersReady < workers.length) { return; }

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
    for (let i = 0; i < numberWorkers; i++) {
        const worker = workers[i];
        worker.postMessage(
            {
                yStart: currHeight,
                yEnd: currHeight + sectionHeight,
                width,
                height,
                zoom,
                moveX,
                moveY,
                maxIterations
            }
        );    

        currHeight += sectionHeight;
        activeWorkerCount++; 
    }
    startTimer();
}

/* PERFORMANCE */
function startTimer() {
    t0 = performance.now();
    t1 = undefined;
}

function endTimer() {
    if(!t0) { throw Error(); }
    t1 = performance.now();

    const operationTime = t1 - t0;
    updateOperationTime(operationTime);
}

/* INPUT HANDLERS*/
function updateInputs() {
    document.getElementById("zoom").value = zoom;
    document.getElementById("movex").value = moveX;
    document.getElementById("movey").value = moveY;
    document.getElementById("maxiterations").value = maxIterations;
    document.getElementById("workers").value = numberWorkers;
}

function reset() {
    zoom = ZOOM;
    moveX = MOVE_X;
    moveY = MOVE_Y;
    maxIterations = MAX_ITERATIONS;
    updateInputs();

    needsUpdate = true;
}

function draw() { needsUpdate = true; }
function updateZoom(obj) { zoom = Number(obj.value); }
function updateMoveX(obj) { moveX = Number(obj.value); }
function updateMoveY(obj) { moveY = Number(obj.value); }
function updateMaxIterations(obj) { maxIterations = Number(obj.value); }
function updateOperationTime(operationTime) { 
    document.getElementById("operationtime").textContent = Math.round(operationTime) / 1000 + " seconds";
}
function updateNumWorkers(obj) {
    numberWorkers = obj.value;
    updateWorkerPool();
}

/* MOUSE CONTROLS */
window.addEventListener("mousewheel", MouseWheelHandler, false);

const DELTA_SCALE_FACTOR = 8;

function MouseWheelHandler(e) {
    if(activeWorkerCount) { return; }

    e = window.event || e;
    const oldZoom = zoom;

    // new zoom
    const zoomDelta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    zoom = Math.max(1, zoom * (1 + zoomDelta / 10));

    if(zoom === oldZoom) {
        return; // nothing to do
    }

    // new moveX and moveY
    let deltas = getDeltas(e.x, e.y);
    moveX += ((deltas.x/DELTA_SCALE_FACTOR) / zoom) * zoomDelta;
    moveY += ((deltas.y/DELTA_SCALE_FACTOR) / zoom) * zoomDelta;

    updateInputs();

    needsUpdate = true;
}

function getDeltas(xPos, yPos) {
    const canvasRect = canvas.getBoundingClientRect(); 
    const canvasLowerX = canvasRect.left;
    const canvasLowerY = canvasRect.top;
    const canvasUpperX = canvasRect.right;
    const canvasUpperY = canvasRect.bottom;

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