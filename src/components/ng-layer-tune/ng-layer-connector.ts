import { retry, getUuid } from "../../utils/utils"

type TGetLayer = {
  viewerObj?: any
  layerName: string
  viewerVariableName?: string
}

type PartialNgLayer = {
  layer: {
    opacity: {
      restoreState(opacity: number): void
    }
    fragmentMain: {
      restoreState(shader: string): void
      value: string
    }
  }
}

type PartialNgSegLayer = {
  layer: {
    displayState: {
      selectedAlpha: {
        restoreState(opacity: number): void
      }
      segmentSelectionState: {
        selectedSegment: {
          low: number
          high: number
        }
        changed: {
          add: (cb: () => void) => () => void
        }
      }
    }
  }
}

export async function getLayerType(spec: TGetLayer): Promise<string> {
  const {
    viewerObj,
    layerName,
    viewerVariableName
  } = spec
  
  const viewer = (viewerObj || (window as any)[ viewerVariableName || 'viewer'])
  
  const layerObj = await retry(async () => {
    const layerObj = viewer.layerManager.getLayerByName(layerName)
    if (!layerObj) {
      throw new Error(`layer with name ${layerName} not yet defined.`)
    }
    return layerObj
  }, { retries: 100, timeout: 160 })
  return layerObj.initialSpecification?.type || 'image'
}

async function getLayer(spec: TGetLayer) {
  const {
    viewerObj,
    layerName,
    viewerVariableName
  } = spec
  
  const viewer = (viewerObj || (window as any)[ viewerVariableName || 'viewer'])

  try {
    await retry(async () => {
      const layerObj = viewer.layerManager.getLayerByName(layerName)
      if (!layerObj) {
        throw new Error(`layer with name ${layerName} not yet defined.`)
      }
    }, { retries: 100, timeout: 160 })
    
    // nifti volumes sometimes takes a while to load
    const { layerObj, warning } = await retry(async () => {
      const layerObj = viewer.layerManager.getLayerByName(layerName)
      if (!layerObj) throw new Error(`layer obj ${layerName} not found!`)

      if (typeof layerObj.isReady === "function") {
        if (layerObj.isReady()) {
          const warning = !!(layerObj?.layer?.fragmentMain)
          ? null
          : `layer.fragmentMain undefined. Did you try to couple to a segmentation layer?`
          return { layerObj, warning }
        }
        throw new Error(`layer not yet ready`)
      }
      
      /**
       * fallback, for earlier version of neuroglancer
       */
      if (layerObj?.layer?.fragmentMain) {
        return { layerObj }
      }
      throw new Error(`fragmentMain not yet defined!`)

      // 10 minutes should be enough... right?
    }, { retries: 1200, timeout: 500 })

    return { layerObj, warning }
  } catch (e) {
    const layerObj = viewer.layerManager.getLayerByName(layerName)
    return {
      layerObj,
      warning: `Some error occurred. This component may not function properly. ${e.toString()}`
    }
  }
}

export interface NgLayerInterface {
  init(): Promise<void>
  connected: boolean
  setOpacity(opacity: number): void
  setShader(shader: string): Promise<void>
  getShader(): Promise<string>
  getUrl(): Promise<string>
}

export class IntraFrameNglayerConnector implements NgLayerInterface {

  private ngLayer: PartialNgLayer
  public connected = false

  constructor(private ngLayerName: string, private viewerVariableName?: string) {

  }
  async init(){
    const { layerObj, warning } = await getLayer({ layerName: this.ngLayerName, viewerVariableName: this.viewerVariableName })
    if (warning) {
      throw new Error(warning)
    }
    this.ngLayer = layerObj
    this.connected = true
  }
  setOpacity(opacity: number): void {
    this.ngLayer.layer.opacity.restoreState(opacity)
  }
  async setShader(shader: string): Promise<void> {
    const { layerObj, warning } = await getLayer({ layerName: this.ngLayerName, viewerVariableName: this.viewerVariableName })
    if (warning) {
      throw new Error(warning)
    }
    layerObj.layer.fragmentMain.restoreState(shader)
  }
  async getShader(): Promise<string> {
    return this.ngLayer.layer.fragmentMain.value
  }

  async getUrl(): Promise<string> {
    const { layerObj, warning } = await getLayer({ layerName: this.ngLayerName, viewerVariableName: this.viewerVariableName })
    if (warning) {
      throw new Error(warning)
    }
    let url: string
    if (typeof layerObj.initialSpecification.source === "string") {
      url = layerObj.initialSpecification.source
    }
    if (typeof layerObj.initialSpecification.source.url === "string") {
      url = layerObj.initialSpecification.source.url
    }
    if (!url) {
      throw new Error(`Cannot find url`)
    }
    return url.replace(/^[a-z-_]+:\/\//, '')
  }
}

interface ParentWindow {
  parentWindow: Window
  parentOrigin: string
}

export interface NgLayerSpec {
  source: string
  transform: number[][]
}

export class IFrameNgLayerConnector implements NgLayerInterface {
  public connected: boolean = false
  private parent: ParentWindow

  constructor(private ngLayerName: string, private ngLayerSpec: NgLayerSpec, private pluginName: string = 'ng-layer-tune', _parent?: ParentWindow) {
    if (_parent){
      this.parent = _parent
    }
  }

  private updateId = 1
  private opacity: number = null
  private shader: string = null

  private async handshake() {
    if (this.parent) {
      return Promise.resolve(true)
    }

    return Promise.race([
      new Promise(rs => {
        window.addEventListener('message', ev => {
          
          const { source, data, origin } = ev
          const { id, method, params: _params, result, error } = data

          if (method === "sxplr.init") {
            const src = source as Window
            this.parent = {
              parentOrigin: origin,
              parentWindow: src
            }

            src.postMessage({
              id,
              jsonrpc: '2.0',
              result: {
                name: this.pluginName
              }
            }, origin)
            rs(true)
          }

          if (this.promiseMap.has(id)) {
            const { rs, rj } = this.promiseMap.get(id)
            this.promiseMap.delete(id)
            if (error) return rj(error)
            return rs(result)
          }
        })
      }),
      new Promise((_, rj) => setTimeout(rj, 10000, 'Timeout after 10sec'))
    ])
  }

  onDestroyHook(){
    this.postMessage({
      method: `sxplr.exit`,
      params: {
        requests: [
          {
            id: getUuid(),
            jsonrpc: '2.0',
            method: `sxplr.removeLayers`,
            params: {
              layers: [
                {
                  id: this.ngLayerName
                }
              ]
            }
          }
        ] // any remaining requests to be carried out
      }
    })
  }

  async init() {
    await this.handshake()
    await this.loadIframeLayer(this.updateId)
    window.addEventListener('pagehide', () => this.onDestroyHook(), { once: true })
    this.connected = true
  }

  private promiseMap = new Map<string, { rs: (...arg: unknown[]) => void, rj: (...arg: unknown[]) => void }>()
  private postMessage(message: Record<string, unknown>): Promise<number> {
    return new Promise((rs, rj) => {
      const id = getUuid()
      const payload = {
        id,
        jsonrpc: '2.0',
        ...message
      }
      this.promiseMap.set(id, { rs, rj })
      this.parent.parentWindow.postMessage(payload, this.parent.parentOrigin)
    })
  }

  private async loadIframeLayer(triggeredUpdateId: number) {
    if (triggeredUpdateId !== this.updateId) return
    if (!this.opacity || !this.shader) return
    let source = this.ngLayerSpec.source
    if (! /^n5:\/\/|^precomputed:\/\//.test(source)) {
      source = `precomputed://${source}`
    }
    await this.postMessage({

      method: `sxplr.loadLayers`,
      params: {
        layers: [{
          clType: 'customlayer/nglayer',
          source,
          transform: this.ngLayerSpec.transform,
          opacity: this.opacity,
          shader: this.shader,
          id: this.ngLayerName
        }]
      }
    })
  }

  setOpacity(opacity: number): void {
    this.updateId += 1
    this.opacity = opacity
    const triggeredUpdateId = this.updateId
    setTimeout(() => this.loadIframeLayer(triggeredUpdateId), 32)
  }
  async setShader(shader: string): Promise<void> {
    this.updateId += 1
    this.shader = shader
    const triggeredUpdateId = this.updateId
    setTimeout(() => this.loadIframeLayer(triggeredUpdateId), 32)
  }
  getShader(): Promise<string> {
    return Promise.reject(`IFrameNgLayerConnector getShader not yet implemented`)
  }

  async getUrl(): Promise<string> {
    return Promise.reject(`IFrameNgLayerConnector getUrl not yet implemented`)
  }
}

export class SegmentationNglayerConnector{
  onValueUpdate(_cb: (label: number) => void){
    throw new Error(`Not implemented`)
  }
  // onValueUpdate: ((cb: (label: number) => void) => void)
}

export class IntraFrameSegLayerConnector extends SegmentationNglayerConnector implements NgLayerInterface {
  connected: boolean = false
  ngLayer: PartialNgSegLayer = null

  ondestroycb: (() => void)[] = []
  onValueUpdateCb: ((label: number) => void)[] = []

  async init(): Promise<void> {
    const { layerObj } = await getLayer({ layerName: this.ngLayerName, viewerVariableName: this.viewerVariableName })
    if (!layerObj.layer.displayState) {
      throw new Error(`layer.layer.displayState not defined. Does not seem to be a segmentation layer =/`)
    }
    this.ngLayer = layerObj as PartialNgSegLayer
    this.connected = true
    const ondestroycb = this.ngLayer.layer.displayState.segmentSelectionState.changed.add(
      () => {
        for (const cb of this.onValueUpdateCb){
          cb(this.ngLayer.layer.displayState.segmentSelectionState.selectedSegment.low)
        }
      }
    )
    this.ondestroycb.push(ondestroycb)
  }
  
  constructor(private ngLayerName: string, private viewerVariableName?: string) {
    super()
  }

  setOpacity(opacity: number): void {
    this.ngLayer.layer.displayState.selectedAlpha.restoreState(opacity)
  }

  async getShader(): Promise<string> {
    return ""
  }

  async setShader(_shader: string): Promise<void> {
    /**
     * noop
     */
  }
  async getUrl(): Promise<string> {
    
    const { layerObj } = await getLayer({ layerName: this.ngLayerName, viewerVariableName: this.viewerVariableName })
    if (!layerObj.layer.displayState) {
      throw new Error(`layer.layer.displayState not defined. Does not seem to be a segmentation layer =/`)
    }
    let url: string
    if (typeof layerObj.initialSpecification.source === "string") {
      url = layerObj.initialSpecification.source
    }
    if (typeof layerObj.initialSpecification.source.url === "string") {
      url = layerObj.initialSpecification.source.url
    }
    if (!url) {
      throw new Error(`Cannot find url`)
    }
    return url.replace(/^precomputed:\/\//, '')
  }

  onValueUpdate(cb: (label: number) => void) {
    this.onValueUpdateCb.push(cb)
  }

}

export function isSegmentConnector(instance: unknown): instance is SegmentationNglayerConnector{
  return instance instanceof SegmentationNglayerConnector
}
