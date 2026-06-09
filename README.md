# WebAssembly Mandelbrot Viewer

A Mandelbrot explorer rendered via WebAssembly (C++ compiled with Emscripten)
and a pool of Web Workers. Deployed as a static-asset
[Cloudflare Worker](https://developers.cloudflare.com/workers/static-assets/).

## Build

Docker handles the Emscripten toolchain; the `release` stage exports the
assembled `dist/` as a tar:

```bash
docker build -t webasm-mandelbrot . --output type=tar,dest=dist.tar --target release
rm -rf dist && tar -xf dist.tar && rm dist.tar
```

## Deploy

Pushes to `master` run `.github/workflows/deploy.yml`, which builds `dist/`
and runs `wrangler deploy`.

## Credits

UI based on [tilde.club/~david/m](http://www.tilde.club/~david/m).
