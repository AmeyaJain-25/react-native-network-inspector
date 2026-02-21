export const DEFAULT_MAX_REQUESTS = 500
export const DEFAULT_REFRESH_RATE_MS = 50

export function extractHost(url: string): string | undefined {
  if (typeof url !== 'string' || url.length === 0) return undefined
  const afterProtocol = url.split('//')[1]
  if (afterProtocol === undefined) return undefined
  const hostPart = afterProtocol.split(':')[0]?.split('/')[0]
  return hostPart && hostPart.length > 0 ? hostPart : undefined
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  const clampedWait = Math.max(0, Number(wait) || 0)
  let timeout: ReturnType<typeof setTimeout> | undefined
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout !== undefined) clearTimeout(timeout)
    if (immediate && timeout === undefined) func.apply(this, args)
    timeout = setTimeout(() => {
      timeout = undefined
      if (!immediate) func.apply(this, args)
    }, clampedWait)
  }
}
