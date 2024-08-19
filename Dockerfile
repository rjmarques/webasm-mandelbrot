FROM emscripten/emsdk:3.1.64 as build

COPY Makefile .
COPY mandelbrot.cpp .

RUN make mandelbrot.js

FROM scratch as binaries
COPY --link --from=build /src/mandelbrot.js mandelbrot.js
COPY --link --from=build /src/mandelbrot.wasm mandelbrot.wasm
