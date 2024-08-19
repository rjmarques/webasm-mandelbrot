# Web Assembly Mandelbrot Viewer

## Build steps

The build runs in a docker container for compatibility reasons (old dependencies). The artefacts are commited to GH for simplicity.

```bash
docker build -t rjmarques/webasm-mandelbrot . --output type=tar,dest=mandel.tar --target binaries

tar -xf mandel.tar
```