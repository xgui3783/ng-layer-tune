import { colorMapNames, parseColorMapFromStr, encodeShader, decodeShader } from "./utils/colormaps"
/**
 * This fn gets run before anything gets bootstraped
 */
export default function globalFn(){
  globalThis['ngLayerTune'] = {
    colorMapNames,
    parseColorMapFromStr,
    encodeShader,
    decodeShader,
  }
}
