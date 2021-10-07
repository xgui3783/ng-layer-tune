type TDebounceConfig = {
  duration: number // in ms
  leading?: boolean
  trailing?: boolean
}

export function clamp(lower: number, higher: number, val: number) {
  if (val < lower) return lower
  if (val > higher) return higher
  return val
} 

export function getDebouce(opts: TDebounceConfig) {
  
  const { duration, leading = false, trailing = true } = opts
  if (leading === false && trailing === false) {
    throw new Error(`at least one of leading or trailing must be true, or callback function will never be called.`)
  }
  let isDebounced = false
  let timeoutref: any

  const timedCb = (cb: () => any) => () => {
    timeoutref = null
    isDebounced = false
    if (trailing) cb()
  }
  return (cb: () => any) => {
    if (isDebounced) {
      if (!!timeoutref) clearTimeout(timeoutref)
      timeoutref = setTimeout(timedCb(cb), duration)
      return
    }
    if (leading) cb()
    timeoutref = setTimeout(timedCb(cb), duration)
    isDebounced = true
  }
}

type TRetryConfig = {
  retries: number
  timeout: number
}

export async function retry(fn: () => Promise<any>, opts?: TRetryConfig){
  const {
    retries = 3,
    timeout = 160,
  } = opts || {}

  let retryNo = 0

  while (retryNo < retries) {
    retryNo ++
    try {
      const result = await fn()
      return result
    } catch (e) {
      console.warn(`[retry] fn failed: ${e.toString()}. Retry after ${timeout} milliseconds`)
      await (() => new Promise(rs => setTimeout(rs, timeout)))()
    }
  }
  throw new Error(`[retry] fn failed ${retries} times. Aborting.`)
}

type TGetLayer = {
  viewerObj?: any
  layerName: string
}

export async function getLayer(spec: TGetLayer){
  const {
    viewerObj,
    layerName,
  } = spec
  const viewer = (viewerObj || (window as any).viewer)
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
  const type = layerObj?.initialSpecification?.type
  if (type === 'segmentation') throw new Error(`layer is a segmentation. Colormap will not work.`)
  if (type === 'image') return null
  return {
    message: `layer.initialSpecification.type not defined. Component may not funciton properly.`
  }
}