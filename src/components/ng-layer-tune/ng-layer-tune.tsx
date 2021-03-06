import { Component, Host, h, Prop, Watch, EventEmitter, Event, State } from '@stencil/core';
import { EnumColorMapName, getShader } from '../../utils/colormaps';
import { clamp, getDebouce } from '../../utils/utils';
import { IFrameNgLayerConnector, IntraFrameNglayerConnector, NgLayerInterface, NgLayerSpec } from "./ng-layer-connector"

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
  ngLayerName: string

  @Prop()
  thresholdMin: number = 0

  @Prop()
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

  @Watch('lowerThreshold')
  @Watch('higherThreshold')
  @Watch('brightness')
  @Watch('contrast')
  @Watch('selectedShader')
  @Watch('hideBg')
  @Watch('hideZero')
  refreshShader(){
    this.debounce(() => {
      const shader = getShader({
        lowThreshold: this.lowerThreshold,
        highThreshold: this.higherThreshold,
        colormap: this.selectedShader,
        brightness: this.brightness,
        contrast: this.contrast,
        removeBg: this.hideBg,
        hideZero: this.hideZero
      })
      this.shaderCode = shader
      if (this.connector?.connected) this.connector.setShader(shader)
    })
  }

  @State()
  shaderCode: string

  private colorMapNames: string[] = [
    EnumColorMapName.VIRIDIS,
    EnumColorMapName.PLASMA,
    EnumColorMapName.MAGMA,
    EnumColorMapName.INFERNO,

    EnumColorMapName.GREYSCALE,
    
    EnumColorMapName.JET,

    EnumColorMapName.RGB,
  ]

  private async coupleLayer(){
    if (!this.ngLayerName) return
    if (!this.useIframeCtrl) {
      this.connector = new IntraFrameNglayerConnector(this.ngLayerName)
      await this.connector.init()
      return
    }
    if (!this.iframeLayerSpec) return
    this.connector = new IFrameNgLayerConnector(this.ngLayerName, this.iframeLayerSpec, this.iFrameName)
    await this.connector.init()
    this.connector.setOpacity(this.opacity)
    this.connector.setShader(this.shaderCode)
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
    const getRangeInput = (opts: {min: number, max: number, title: string, id: string, value: number, onInput: (ev: Event) => any}) => {
      const {
        min, max, title, id, value, onInput
      } = opts
      if (this.hideCtrlList.includes(id)) return []
      return [
        <label style={this.labelStyle} htmlFor={id}>{title}</label>,
        <input
          type="range"
          min={min}
          max={max}
          step="0.01"
          value={value}
          onInput={ev => onInput(ev)}
          name={id}
          id={id}/>,
        <span>
          {value}
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
          {getRangeInput({
            min: 0,
            max: 1,
            id: 'opacity',
            title: 'Opacity',
            onInput: ev => this.opacity = Number((ev.target as any).value),
            value: this.opacity
          })}
          {getRangeInput({
            min: this.thresholdMin,
            max: this.thresholdMax,
            id: 'lower_threshold',
            title: 'Lower threshold',
            onInput: ev => this.lowerThreshold = Number((ev.target as any).value),
            value: this.lowerThreshold
          })}

          {getRangeInput({
            min: this.thresholdMin,
            max: this.thresholdMax,
            id: 'higher_threshold',
            title: 'Higher threshold',
            onInput: ev => this.higherThreshold = Number((ev.target as any).value),
            value: this.higherThreshold
          })}
          {this.advancedControl && getRangeInput({
            min: -1,
            max: 1,
            id: 'brightness',
            title: 'Brightness',
            onInput: ev => this.brightness = Number((ev.target as any).value),
            value: this.brightness
          })}
          {this.advancedControl && getRangeInput({
            min: -1,
            max: 1,
            id: 'contrast',
            title: 'Contrast',
            onInput: ev => this.contrast = Number((ev.target as any).value),
            value: this.contrast
          })}
          {this.hideCtrlList.includes('colormap')
            ? []
            : [
              <label style={this.labelStyle} htmlFor="colormap">Color map</label>,
              <select name="colormap" id="colormap" onInput={val => this.selectedShader = (val.target as any).value}>
                <option value="">--Please select a color map--</option>
                {
                  this.colorMapNames.map(name => (
                    <option value={name}>{name}</option>
                  ))
                }
              </select>,
              <span></span>
            ]}

          {getCheckBox({
            id: 'hide-threshold-checkbox',
            onInput: ev => this.hideBg = (ev.target as any).checked,
            checked: this.hideBg,
            title: 'Hide clamped'
          })}

          {this.advancedControl && getCheckBox({
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
