export const PRECISION = 4
export const PRECISION_MUL = 10 ** PRECISION

function cmNameGuard(input: unknown): input is ColorMapName{
  return (colorMapNames as any).includes(input)
}

export const COLOR_MAP_CONST = {
  JET: 'jet',
  
  VIRIDIS: 'viridis',
  PLASMA: 'plasma',
  MAGMA: 'magma',
  INFERNO: 'inferno',

  ORANGES: 'oranges',
  YELLOW_GREEN: 'yellowgreen',
  COOLWARM: 'coolwarm',

  GREYSCALE: 'greyscale',

  RED: 'red',
  GREEN: 'green',
  BLUE: 'blue',

  RGB: 'rgb (3 channel)',
  RGBA: 'rgba (4 channel)',
} as const

export const colorMapNames = Object.values(COLOR_MAP_CONST)

export type ColorMapName = typeof colorMapNames[number]

interface IColorMap{
  /**
   * header
   */
  header: string
  /**
   * appended before void main() {} block
   */
  premain: string
  /**
   * appended in void main(){} block
   * 
   * input:
   * 
   * float x;
   * 
   * populate:
   * 
   * vec3 rgb;
   */
  main: string

  /**
   * overwrite colormap
   */
  override?: (cfg: Omit<TGetShaderCfg, 'colormap'>) => string
}

const mapKeyColorMap = new Map<ColorMapName, IColorMap>([
  [ COLOR_MAP_CONST.JET, {
    header: "",
    /**
     *  The MIT License (MIT)

        Copyright (c) 2015 kbinani

        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:

        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.

        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
        SOFTWARE.

     * <https://github.com/kbinani/colormap-shaders/blob/master/shaders/glsl/MATLAB_jet.frag>
     */
    premain: `
      float colormap_red(float x) {
        if (x < 0.7) {
          return 4.0 * x - 1.5;
        } else {
          return -4.0 * x + 4.5;
        }
      }
      
      float colormap_green(float x) {
        if (x < 0.5) {
          return 4.0 * x - 0.5;
        } else {
          return -4.0 * x + 3.5;
        }
      }
      
      float colormap_blue(float x) {
        if (x < 0.3) {
          return 4.0 * x + 0.5;
        } else {
          return -4.0 * x + 2.5;
        }
      }
    `,
    main: `
    float r = clamp(colormap_red(x), 0.0, 1.0);
    float g = clamp(colormap_green(x), 0.0, 1.0);
    float b = clamp(colormap_blue(x), 0.0, 1.0);
    rgb=vec3(r,g,b);
    `
  } ],

  [ COLOR_MAP_CONST.VIRIDIS, {
    header: "",
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 viridis(float t) {
      
        const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
        const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
        const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
        const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
        const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
        const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
        const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);
      
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
      }
    `,
    main: 'rgb=viridis(x);'
  } ],
  [ COLOR_MAP_CONST.PLASMA, {
    header: "",
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 plasma(float t) {

        const vec3 c0 = vec3(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
        const vec3 c1 = vec3(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
        const vec3 c2 = vec3(-2.689460476458034, -7.455851135738909, 3.110799939717086);
        const vec3 c3 = vec3(6.130348345893603, 42.3461881477227, -28.51885465332158);
        const vec3 c4 = vec3(-11.10743619062271, -82.66631109428045, 60.13984767418263);
        const vec3 c5 = vec3(10.02306557647065, 71.41361770095349, -54.07218655560067);
        const vec3 c6 = vec3(-3.658713842777788, -22.93153465461149, 18.19190778539828);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    
      }
    `,
    main: 'rgb=plasma(x);'
  } ],
  [ COLOR_MAP_CONST.MAGMA, {
    header: "",
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 magma(float t) {
      
          const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
          const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
          const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
          const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
          const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
          const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
          const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);
      
          return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
      
      }
    `,
    main: 'rgb=magma(x);'
  } ],
  [ COLOR_MAP_CONST.INFERNO, {
    header: '',
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 inferno(float t) {

        const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
        const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
        const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
        const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
        const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
        const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
        const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    
      }
    `,
    main: 'rgb=inferno(x);'
  } ],
  [ COLOR_MAP_CONST.ORANGES, {
    header: "",
    /**
     * created by Neuroinflab CC/0
     * https://www.shadertoy.com/view/tfBGWz
     */
    premain: `
      vec3 oranges(float t) {
      
        const vec3 c0 = vec3(1.00022304,   0.96035224,   0.92132486);
        const vec3 c1 = vec3(-0.20026948,  -0.16642638,  -0.44605086);
        const vec3 c2 = vec3(2.44453732,  -3.08922281,  -4.65432932);
        const vec3 c3 = vec3(-13.00019928,   8.80769566,  10.37336868);
        const vec3 c4 = vec3(32.69180493, -18.07344841, -17.12959053);
        const vec3 c5 = vec3(-37.8586546,   18.66298777,  19.0419038);
        const vec3 c6 = vec3(15.42023529,  -6.94862455,  -8.0908642);      

        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
      }
    `,
    main: 'rgb=oranges(x);'
  } ],
  [ COLOR_MAP_CONST.YELLOW_GREEN, {
    header: "",
    /**
     * created by Neuroinflab CC/0
     * https://www.shadertoy.com/view/tfBGWz
     */
    premain: `
      vec3 yellow_green(float t) {

        const vec3 c0 = vec3(1.000748967807784, 0.9995581760287703, 0.8977070859423847);
        const vec3 c1 = vec3(-0.3948082941024752, 0.44367414720358717, -1.754828526593224);
        const vec3 c2 = vec3(3.7583023396367294, -6.408918546958409, 3.0930196890977624);
        const vec3 c3 = vec3(-30.684917348451265, 23.384079101729025, 2.832646220883265);
        const vec3 c4 = vec3(65.08901178705935, -44.8818725210936, -22.649729065418814);
        const vec3 c5 = vec3(-58.09222188705258, 40.060760851353784, 29.640569800572912);
        const vec3 c6 = vec3(19.322887436458423, -13.32612926652298, -11.898329702252322);

        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
      }
    `,
    main: 'rgb=yellow_green(x);'
  } ],
  [ COLOR_MAP_CONST.COOLWARM, {
    header: "",
    /**
     * created by Neuroinflab CC/0
     * https://www.shadertoy.com/view/tfBGWz
     */
    premain: `
      vec3 coolwarm(float t) {

        const vec3 c0 = vec3(0.22893782970696291, 0.29312448545786735, 0.7544234583602972);
        const vec3 c1 = vec3(1.196659419113069, 2.2392214415577953, 1.5611120721650131);
        const vec3 c2 = vec3(0.11058280232132679, -7.092496487855577, -1.8296922052518632);
        const vec3 c3 = vec3(2.3308530078576446, 32.50536374266911, -1.9173978673537544);
        const vec3 c4 = vec3(-5.503823588308669, -76.56676639221565, -2.9180300463537545);
        const vec3 c5 = vec3(1.8858776921322877, 75.40235227142546, 8.692898651320393);
        const vec3 c6 = vec3(0.45830556308964526, -26.755477144559674, -4.195348488336139);

        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
      }
    `,
    main: 'rgb=coolwarm(x);'
  } ],
  [
    COLOR_MAP_CONST.RED, {
      header: '',
      premain: '',
      main: 'rgb=vec3(x, 0., 0.);'
    }
  ],
  [
    COLOR_MAP_CONST.GREEN, {
      header: '',
      premain: '',
      main: 'rgb=vec3(0., x, 0.);'
    }
  ],
  [
    COLOR_MAP_CONST.BLUE, {
      header: '',
      premain: '',
      main: 'rgb=vec3(0., 0., x);'
    }
  ],
  [ COLOR_MAP_CONST.GREYSCALE, {
    header: "",
    premain: '',
    main: 'rgb=vec3(x, x, x);'
  } ],

  [ COLOR_MAP_CONST.RGB, {
    header: '',
    main: '',
    premain: '',
    override(cfg) {
      /**
       * hideZero has no effect
       */
      const { brightness, contrast, highThreshold, lowThreshold, removeBg } = cfg
      const _lowThreshold = lowThreshold + 1e-10
      const getChan = (variable: string, idx: number) => `float ${variable} = ( toNormalized(getDataValue( ${idx} )) - ${_lowThreshold.toFixed(10)} ) / ( ${ highThreshold - _lowThreshold } ) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};`
      return `// ${encodeState({...cfg, colormap: COLOR_MAP_CONST.RGB})}
void main() { ${getChan('r', 0)} ${getChan('g', 1)} ${getChan('b', 2)}
${ removeBg ? 'if (r < 0.01 && g < 0.01 && b < 0.01 ) { emitTransparent(); } else {' : '' }
emitRGB(vec3(r, g, b) * exp(${contrast.toFixed(10)}));
${ removeBg ? '}' : '' }
}`
    }
  } ],

  [ COLOR_MAP_CONST.RGBA, {
    header: '',
    main: '',
    premain: '',
    override(cfg) {
      /**
       * hideZero has no effect
       */
      const { brightness, contrast, highThreshold, lowThreshold, removeBg } = cfg
      const _lowThreshold = lowThreshold + 1e-10
      const getChan = (variable: string, idx: number) => `float ${variable} = ( toNormalized(getDataValue( ${idx} )) - ${_lowThreshold.toFixed(10)} ) / ( ${ highThreshold - _lowThreshold } ) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};`
      return `// ${encodeState({...cfg, colormap: COLOR_MAP_CONST.RGBA})}
void main() { ${getChan('r', 0)} ${getChan('g', 1)} ${getChan('b', 2)} float a = toNormalized(getDataValue(3));
${ removeBg ? 'if (r < 0.01 && g < 0.01 && b < 0.01 ) { emitTransparent(); } else {' : '' }
emitRGBA(vec4(r, g, b, a) * exp(${contrast.toFixed(10)}));
${ removeBg ? '}' : '' }
}`
    }
  } ]
])


type TGetShaderCfg = {
  colormap: ColorMapName,
  lowThreshold: number
  highThreshold: number
  brightness: number
  contrast: number
  removeBg: boolean
  hideZero: boolean
  opacity: number
}

export const parseColorMapFromStr = (colormapstr: string): ColorMapName => {
  if (COLOR_MAP_CONST[colormapstr]) {
    return COLOR_MAP_CONST[colormapstr]
  }
  if (cmNameGuard(colormapstr)){
    return colormapstr
  }
  return COLOR_MAP_CONST.GREYSCALE
}

export const encodeShader = (cfg: TGetShaderCfg): string => {
  const {
    colormap = COLOR_MAP_CONST.GREYSCALE,
    lowThreshold = 0,
    highThreshold = 1,
    brightness = 0,
    contrast = 0,
    removeBg = false,
    hideZero = false,
    opacity = 0.5,
  } = cfg
  const { header, main, premain, override } = mapKeyColorMap.get(colormap) || (() => {
    console.warn(`colormap ${colormap} not found. Using default colormap instead`)
    return mapKeyColorMap.get(COLOR_MAP_CONST.GREYSCALE)
  })()
  if (!!override) {
    return override({ lowThreshold, highThreshold, brightness, contrast, removeBg, hideZero, opacity })
  }

  // so that if lowthreshold is defined to be 0, at least some background removal will be done
  const _lowThreshold = lowThreshold + 1e-10
  return `// ${encodeState(cfg)}
${header}
${premain}
void main() {
  float raw_x = toNormalized(getDataValue());
  ${hideZero ? 'if(x==0.0){emitTransparent();}' : ''}
  float x = (raw_x - ${_lowThreshold.toFixed(10)}) / (${highThreshold - _lowThreshold}) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};

  ${ removeBg ? 'if(x>1.0){emitTransparent();}else if(x<0.0){emitTransparent();}else{' : '' }
    vec3 rgb;
    ${main}
    emitRGB(rgb*exp(${contrast.toFixed(10)}));
  ${ removeBg ? '}' : '' }
}
`
}

export const decodeShader = (shader: string): TGetShaderCfg => {
  const foundShaderCode = shader.split('\n').find(line => line.includes(cmEncodingVersion))
  if (!foundShaderCode) {
    return null
  }
  return decodeState(foundShaderCode.replace('// ', ''))
}

export const cmEncodingVersion = 'encodedCmState-0.1'

function encodeBool(...flags: boolean[]) {
  if (flags.length > 8) {
    throw new Error(`encodeBool can only handle upto 8 bools`)
  }
  let rValue = 0
  flags.forEach((flag, idx) => {
    if (flag) {
      rValue += (1 << idx)
    }
  })
  return rValue
}
function decodeBool(num: number) {
  const rBool: boolean[] = []
  for (let i = 0; i < 8; i ++) {
    rBool.push( ((num >> i) & 1) === 1 )
  }
  return rBool
}
export function encodeState(cfg: TGetShaderCfg): string {
  const {
    brightness,
    colormap,
    contrast,
    hideZero,
    highThreshold,
    lowThreshold,
    opacity,
    removeBg
  } = cfg

  const array = new Float32Array([
    brightness,
    contrast,
    lowThreshold,
    highThreshold,
    opacity,
    encodeBool(hideZero, removeBg)
  ])
  
  const encodedVal = window.btoa(new Uint8Array(array.buffer).reduce((data, v) => data + String.fromCharCode(v), ''))
  return `${cmEncodingVersion}:${colormap}:${encodedVal}`
}

export function decodeState(encodedState: string): TGetShaderCfg {
  const stateV = encodedState.split(':')[0]
  if (stateV !== cmEncodingVersion) {
    throw new Error(`Cannot parse state. Its version is ${stateV}. Currently, ng-layer-tune is at version ${cmEncodingVersion}`)
  }
  const [ _, cmstring, encodedVal ] = encodedState.split(":")
  const _array = Uint8Array.from(window.atob(encodedVal), v => v.charCodeAt(0))
  const array = new Float32Array(_array.buffer)
  if (array.length !== 6) {
    throw new Error(`Expecting decoded array to be 6 length long, but is instead ${array.length}`)
  }
  const [
    brightness,
    contrast,
    lowThreshold,
    highThreshold,
    opacity,
  ] = Array.from(array).map(v => Math.round(v * PRECISION_MUL) / PRECISION_MUL)
  const [ hideZero, removeBg ] = decodeBool(array[5])

  return {
    brightness,
    contrast,
    lowThreshold,
    highThreshold,
    opacity,
    hideZero,
    removeBg,
    
    /**
     * since enum is encoded as key of enum, just access it
     */
    colormap: parseColorMapFromStr(cmstring) || COLOR_MAP_CONST.GREYSCALE
  }
}
