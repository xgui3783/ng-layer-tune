# ng-layer-tune

A control wrapper for neuroglancer image layer.

[inframe example](https://ng-layer-tune.netlify.app/)

[iframe example](https://atlases.ebrains.eu/viewer/#/a:juelich:iav:atlas:v1.0.0:1/t:minds:core:referencespace:v1.0.0:a1655b99-82f1-420f-a3c2-fe80fd4c8588/p:juelich:iav:atlas:v1.0.0:4?pl=%5B%22https%3A%2F%2Fng-layer-tune.netlify.app%2Fplugin.html%22%5D)


## global exports

under `globalThis.ngLayerTune`

A number of utility functions and supported colormaps are exposed under `globalThis.ngLayerTune` once the library is imported. For example:

```js
globalThis.ngLayerTune.colorMapNames.length // 14
globalThis.ngLayerTune.colorMapNames[0] // 'jet'

globalThis.ngLayerTune.parseColorMapFromStr("jet") === "jet"
globalThis.ngLayerTune.parseColorMapFromStr("JET") === "jet"
globalThis.ngLayerTune.parseColorMapFromStr("rgba (4 channel)") === "rgba (4 channel)"
globalThis.ngLayerTune.parseColorMapFromStr("RGBA") === "rgba (4 channel)"

const cmstr = globalThis.ngLayerTune.encodeShader({ colormap: "jet" })
const cmCfg = globalThis.ngLayerTune.encodeShader.decodeShader(cmstr)

const greyscaleCmStr = globalThis.ngLayerTune.encodeShader({ colormap: "jett" }) // typo, default to greyscale
const greyscaleCmStr2 = globalThis.ngLayerTune.encodeShader({ colormap: "rgba" }) // not correct colormap (missing `4 channel`), default to greyscale
const greyscaleCmStr2 = globalThis.ngLayerTune.encodeShader({ colormap: "JET" }) // not correct colormap (should be `jet`), default to greyscale

```

# License

MIT
