FROM emscripten/emsdk:3.1.64 AS build

WORKDIR /src

COPY Makefile .
COPY mandelbrot.cpp .

RUN make mandelbrot.js

FROM scratch AS release
# Hand-written static assets
COPY --link public/ /dist/
# Emscripten-generated WASM glue + binary
COPY --link --from=build /src/mandelbrot.js  /dist/mandelbrot.js
COPY --link --from=build /src/mandelbrot.wasm /dist/mandelbrot.wasm
