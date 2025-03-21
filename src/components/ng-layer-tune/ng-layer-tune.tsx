import { Component, Host, h, Prop, Watch, EventEmitter, Event, State, Method } from '@stencil/core';
import { encodeShader, parseColorMapFromStr, PRECISION, PRECISION_MUL, colorMapNames, COLOR_MAP_CONST, decodeShader } from '../../utils/colormaps';
import { clamp, getDebouce, isNullish } from '../../utils/utils';
import { IFrameNgLayerConnector, IntraFrameNglayerConnector, NgLayerInterface, NgLayerSpec, IntraFrameSegLayerConnector, isSegmentConnector } from "./ng-layer-connector"

export type TErrorEvent = {
  message: string
}

@Component({
  tag: 'ng-layer-tune',
  styleUrl: 'ng-layer-tune.css',
})
export class NgLayerTune {

  private connector: NgLayerInterface

  @Prop()
  /**
   * used for postMessage communication with siibra-explorer
   */
  useIframeCtrl: boolean = false

  @Prop()
  iframeLayerSpec: NgLayerSpec

  @Prop()
  iFrameName: string = 'ng-layer-tune'

  @Prop()
  /**
   * comma-separate controls to hide
   */
  hideCtrl: string = ''

  @State()
  hideCtrlList: string[] = []

  @Watch('hideCtrl')
  updateHideCtrlList(){
    this.hideCtrlList = this.hideCtrl.split(',')
  }

  @Prop()
  useNativeControl: boolean = false

  @Prop()
  viewerVariableName: string

  @Prop()
  ngLayerName: string

  @Prop({
    mutable: true
  })
  thresholdMin: number = 0

  @Prop({
    mutable: true
  })
  thresholdMax: number = 1

  @Prop()
  advancedControl: boolean = false

  @Prop()
  hideBackground: boolean = false

  @Prop()
  hideZeroValue: boolean = false

  @Prop()
  initialOpacity: number = null

  @Watch('hideBackground')
  setBg(){
    this.hideBg = this.hideBackground
  }

  @Watch('hideZeroValue')
  setZeroVal(){
    this.hideZero = this.hideZeroValue
  }

  @Watch('thresholdMin')
  @Watch('thresholdMax')
  onThresholdMinMaxChange(){
    this.lowerThreshold = clamp(this.thresholdMin, this.thresholdMax, this.lowerThreshold)
    this.higherThreshold = clamp(this.thresholdMin, this.thresholdMax, this.higherThreshold)
  }

  @Event()
  errorEmitter: EventEmitter<TErrorEvent>

  private debounce = getDebouce({
    duration: 160,
    leading: false,
    trailing: true
  })

  @State()
  opacity: number = 0.5

  @State()
  useTextMode: boolean = false

  @Watch('opacity')
  updateOpacity(){
    if (this.connector?.connected) this.connector.setOpacity(this.opacity)
  }

  @State()
  brightness: number = 0
  @State()
  contrast: number = 0
  @State()
  lowerThreshold: number = 0
  @State()
  higherThreshold: number = 1
  @State()
  selectedShader: any
  @State()
  hideBg: boolean = false
  @State()
  hideZero: boolean = false
  @State()
  step: number = 1 / PRECISION_MUL
  @State()
  hoverValue: number = 0

  overrideShader: string

  layerIsSegment: boolean = false

  @Method()
  async forceRefreshShader() {
    this.refreshShader()
  }

  @Watch('lowerThreshold')
  @Watch('higherThreshold')
  @Watch('brightness')
  @Watch('contrast')
  @Watch('selectedShader')
  @Watch('hideBg')
  @Watch('hideZero')
  @Watch('opacity')
  refreshShader(){
    this.debounce(() => {
      const shader = encodeShader({
        lowThreshold: this.lowerThreshold,
        highThreshold: this.higherThreshold,
        colormap: this.selectedShader,
        brightness: this.brightness,
        contrast: this.contrast,
        removeBg: this.hideBg,
        hideZero: this.hideZero,
        opacity: this.opacity,
      })
      this.shaderCode = shader
      if (this.connector?.connected) this.connector.setShader(this.overrideShader || shader)
    })
  }

  @State()
  shaderCode: string

  @State()
  error: string = null

  private colorMapNames: string[] = colorMapNames

  private async coupleLayer(){
    if (!this.ngLayerName) return
    try {
      if (!this.useIframeCtrl) {
        this.connector = new IntraFrameNglayerConnector(this.ngLayerName, this.viewerVariableName)
        await this.connector.init() 
      } else {
        if (!this.iframeLayerSpec) return
        this.connector = new IFrameNgLayerConnector(this.ngLayerName, this.iframeLayerSpec, this.iFrameName)
        await this.connector.init()
        this.connector.setOpacity(this.opacity)
        await this.connector.setShader(this.overrideShader || this.shaderCode)
      }
    } catch (e) {
      try {
        this.connector = new IntraFrameSegLayerConnector(this.ngLayerName, this.viewerVariableName)
        await this.connector.init() 
      } catch (err2) {
        
        this.error = err2.toString()
        console.error(err2)
      }
    }
    
    try {
      const shader = await this.connector.getShader()
      const decodedShader = decodeShader(shader)
      if (decodedShader) {
        const { brightness, colormap, contrast, hideZero, highThreshold, lowThreshold, opacity, removeBg } = decodedShader
        this.hideBg = removeBg
        this.opacity = opacity
        this.lowerThreshold = lowThreshold
        this.hideZero = hideZero
        this.higherThreshold = highThreshold
        this.contrast = contrast
        this.brightness = brightness
        this.selectedShader = colormap
      } else {
        const url = await this.connector.getUrl()

        let meta
        try {
          meta = await (await fetch(`${url}/meta.json`)).json()
        } catch {
          meta = null
        }
        
        const { version, data, override, preferredColormap } = meta || {}
        if (version === 1) {
          const { type: datatype, range } = data || {}
          if (datatype === "image/3d") {
            this.selectedShader = COLOR_MAP_CONST.RGB
          }

          for (const str of ((preferredColormap || []) as string[])) {
            const colormap = parseColorMapFromStr(str)
            if (!!colormap) {
              this.selectedShader = colormap
              break
            }
          }

          let min: number = Number.POSITIVE_INFINITY
          let max: number = Number.NEGATIVE_INFINITY
          for (const r of (range || []) as {min?: number, max?: number}[]) {
            if (!isNullish(r.min)) {
              min = Math.min(min, r.min)
            }
            if (!isNullish(r.max)) {
              max = Math.max(max, r.max)
            }
          }
          this.thresholdMin = min === Number.POSITIVE_INFINITY ? this.thresholdMin : min
          this.thresholdMax = max === Number.NEGATIVE_INFINITY ? this.thresholdMax : max
          this.step = (this.thresholdMax - this.thresholdMin) / PRECISION_MUL
        }
        this.overrideShader = override?.shader
      }
    } catch (e) {
      console.error('error', e)
    }

    this.layerIsSegment = false
    if (isSegmentConnector(this.connector)) {
      this.layerIsSegment = true
      this.connector.onValueUpdate(label => {
        this.hoverValue = label
      })
    }
  }

  @Watch('ngLayerName')
  @Watch('iframeLayerSpec')
  ngLayerNamePropChanged(){
    this.coupleLayer()
  }

  componentWillLoad(){
    if (this.initialOpacity !== null) {
      this.opacity = this.initialOpacity
    }
    this.coupleLayer()
    this.onThresholdMinMaxChange()
    this.updateHideCtrlList()
  }

  private labelStyle = {
    textAlign: 'right'
  }

  private formStyle = {
    display: 'grid',
    gridAutoColumns: '1fr',
    gridTemplateColumns: '10em 1fr 5em',
    gap: '0.2rem 0.2rem',
    margin: '0.5rem'
  }

  render() {
    if (this.error) {
      return (
        <Host>
          Cannot couple to layer. Did you try to couple to a segmentation layer?
        </Host>
      )
    }
    const getRangeInput = (opts: {step?: number, min: number, max: number, title: string, id: string, value: number, onInput: (ev: Event) => any}) => {
      const {
        min, max, title, id, value, onInput, step=1/PRECISION_MUL
      } = opts
      if (this.hideCtrlList.includes(id)) return []
      if (this.useTextMode) {
        return [
          <label style={this.labelStyle} htmlFor={id}>{title}</label>,
          <input type="number" value={value} id={id} name={id} onInput={onInput} />,
          <div></div>
        ]
      }
      return [
        <label style={this.labelStyle} htmlFor={id}>{title}</label>,
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onInput={ev => onInput(ev)}
          name={id}
          id={id}/>,
        <span>
          {value.toFixed(PRECISION)}
        </span>
      ]
    }
    const getCheckBox = (opts: { id: string, title: string, checked: boolean, onInput: (ev: Event) => void }) => {
      const {
        id,
        title,
        checked,
        onInput
      } = opts
      if (this.hideCtrlList.includes(id)) return []
      return [
        <label style={this.labelStyle} htmlfor={id}>{title}</label>,
        <input type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onInput={ev => onInput(ev)}/>,
        <span></span>
      ]
    }
    return (
      <Host>
        <form style={this.formStyle}>
          {this.layerIsSegment && [
            <label style={this.labelStyle} htmlFor="hover_value">Hover Value</label>,
            <input type="number" value={this.hoverValue} id="hover_value" name="hover_value" disabled/>,
            <div></div>
          ]}
          {getCheckBox({
            id: "text_mode",
            title: 'Text Mode',
            checked: this.useTextMode,
            onInput: (ev: InputEvent) => this.useTextMode = (ev.target as HTMLInputElement).checked
          })}
          {getRangeInput({
            min: 0,
            max: 1,
            id: 'opacity',
            title: 'Opacity',
            onInput: ev => this.opacity = Number((ev.target as any).value),
            value: this.opacity
          })}
          {!this.layerIsSegment && getRangeInput({
            min: this.thresholdMin,
            max: this.thresholdMax,
            id: 'lower_threshold',
            title: 'Lower threshold',
            step: this.step,
            onInput: ev => this.lowerThreshold = Number((ev.target as any).value),
            value: this.lowerThreshold
          })}

          {!this.layerIsSegment && getRangeInput({
            min: this.thresholdMin,
            max: this.thresholdMax,
            id: 'higher_threshold',
            title: 'Higher threshold',
            step: this.step,
            onInput: ev => this.higherThreshold = Number((ev.target as any).value),
            value: this.higherThreshold
          })}
          {!this.layerIsSegment && this.advancedControl && getRangeInput({
            min: -1,
            max: 1,
            id: 'brightness',
            title: 'Brightness',
            onInput: ev => this.brightness = Number((ev.target as any).value),
            value: this.brightness
          })}
          {!this.layerIsSegment && this.advancedControl && getRangeInput({
            min: -1,
            max: 1,
            id: 'contrast',
            title: 'Contrast',
            onInput: ev => this.contrast = Number((ev.target as any).value),
            value: this.contrast
          })}
          {this.layerIsSegment || this.hideCtrlList.includes('colormap')
            ? []
            : [
              <label style={this.labelStyle} htmlFor="colormap">Color map</label>,
              <select name="colormap" id="colormap" onInput={val => this.selectedShader = (val.target as any).value}>
                <option value="">--Please select a color map--</option>
                {
                  this.colorMapNames.map(name => (
                    <option value={name} selected={name === this.selectedShader}>{name}</option>
                  ))
                }
              </select>,
              <span></span>
            ]}

          {!this.layerIsSegment && getCheckBox({
            id: 'hide-threshold-checkbox',
            onInput: ev => this.hideBg = (ev.target as any).checked,
            checked: this.hideBg,
            title: 'Hide clamped'
          })}

          {!this.layerIsSegment && this.advancedControl && getCheckBox({
            id: 'hide-zero-value-checkbox',
            onInput: ev => this.hideZero = (ev.target as any).checked,
            checked: this.hideZero,
            title: 'Hide zero'
          })}
          
        </form>
      </Host>
    );
  }

}
