type TDebounceConfig = {
  duration: number // in ms
  leading?: boolean
  trailing?: boolean
}

let uuidCounter = 1
export function getUuid(){
  uuidCounter ++
  return uuidCounter.toString()
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
