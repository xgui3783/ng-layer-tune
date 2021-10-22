import { Component, Host, h, Prop, Watch, EventEmitter, Event, State } from '@stencil/core';
import { EnumColorMapName, getShader } from '../../utils/colormaps';
import { clamp, getDebouce, getLayer, verifyLayer } from '../../utils/utils';

export type TErrorEvent = {
  message: string
}

@Component({
  tag: 'ng-layer-tune',
  styleUrl: 'ng-layer-tune.css',
})
export class NgLayerTune {

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
      this.layerObj.layer.fragmentMain.restoreState(shader)
      
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
  ]

  private layerObj: any
  private async coupleLayer(){
    if (this.ngLayerName) {
      const layerObj = await getLayer({ layerName: this.ngLayerName })
      try {
        const warning = await verifyLayer(layerObj)
        if (warning) {
          this.errorEmitter.emit(warning)
        }
        this.layerObj = layerObj
      } catch (e) {
        this.errorEmitter.emit({
          message: `Error: ${e.toString()}`
        })
      }
    }
  }

  @Watch('ngLayerName')
  ngLayerNamePropChanged(){
    this.coupleLayer()
  }

  componentWillLoad(){
    this.coupleLayer()
    this.onThresholdMinMaxChange()
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
      return [
        <label style={this.labelStyle} htmlfor={id}>{title}</label>,
        <input type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onInput={ev => onInput(ev)}/>
      ]
    }
    return (
      <Host>
        <form style={this.formStyle}>
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
          <label style={this.labelStyle} htmlFor="colormap">Color map</label>
          <select name="colormap" id="colormap" onInput={val => this.selectedShader = (val.target as any).value}>
            <option value="">--Please select a color map--</option>
            {
              this.colorMapNames.map(name => (
                <option value={name}>{name}</option>
              ))
            }
          </select>
          <span></span>

          {getCheckBox({
            id: 'hide-threshold-checkbox',
            onInput: ev => this.hideBg = (ev.target as any).checked,
            checked: this.hideBg,
            title: 'Hide clamped'
          })}
          <span></span>

          {this.advancedControl && getCheckBox({
            id: 'hide-zero-value-checkbox',
            onInput: ev => this.hideZero = (ev.target as any).checked,
            checked: this.hideZero,
            title: 'Hide zero'
          })}
          <span></span>
          
        </form>
      </Host>
    );
  }

}
