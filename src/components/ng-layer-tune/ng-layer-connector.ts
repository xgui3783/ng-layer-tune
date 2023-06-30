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

async function getLayer(spec: TGetLayer) {
  const {
    viewerObj,
    layerName,
    viewerVariableName
  } = spec
  
  const viewer = (viewerObj || (window as any)[ viewerVariableName || 'viewer'])

  return await retry(async () => {
    const layerObj = viewer.layerManager.getLayerByName(layerName)
    if (!layerObj) throw new Error(`layer obj ${layerName} not found!`)
    return layerObj
  }, {
    retries: 10,
    timeout: 16,
  })
}

export async function verifyLayer(layerObj: any) {
  await retry(async () => {
    if (!!layerObj?.layer?.fragmentMain) {
      throw new Error(`fragmentMain not yet defined!`)
    }
  }, { retries: 10, timeout: 16 })
  return {
    message: `layer.initialSpecification.type not defined. Component may not funciton properly.`
  }
}

export interface NgLayerInterface {
  init(): Promise<void>
  connected: boolean
  setOpacity(opacity: number): void
  setShader(shader: string): void
  getShader(): Promise<string>
}

export class IntraFrameNglayerConnector implements NgLayerInterface {

  private ngLayer: PartialNgLayer
  public connected = false

  constructor(private ngLayerName: string, private viewerVariableName?: string) {

  }
  async init(){
    const layerObj = await getLayer({ layerName: this.ngLayerName, viewerVariableName: this.viewerVariableName });
    const warning = await verifyLayer(layerObj)
    if (warning) {
      throw new Error(warning.message)
    }
    this.ngLayer = layerObj
    this.connected = true
  }
  setOpacity(opacity: number): void {
    this.ngLayer.layer.opacity.restoreState(opacity)
  }
  setShader(shader: string): void {
    this.ngLayer.layer.fragmentMain.restoreState(shader)
  }
  async getShader(): Promise<string> {
    return this.ngLayer.layer.fragmentMain.value
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
    await this.postMessage({

      method: `sxplr.loadLayers`,
      params: {
        layers: [{
          clType: 'customlayer/nglayer',
          source: `precomputed://${this.ngLayerSpec.source}`,
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
  setShader(shader: string): void {
    this.updateId += 1
    this.shader = shader
    const triggeredUpdateId = this.updateId
    setTimeout(() => this.loadIframeLayer(triggeredUpdateId), 32)
  }
  getShader(): Promise<string> {
    return Promise.reject(`IFrameNgLayerConnector getShader not yet implemented`)
  }
}