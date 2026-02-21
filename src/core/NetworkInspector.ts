import XHRInterceptor from './XHRInterceptor'
import {NetworkRequest} from './NetworkRequest'
import type {Headers, RequestMethod} from '../types'
import type {NetworkInspectorOptions} from '../types'
import {extractHost, debounce} from './utils'
import {DEFAULT_MAX_REQUESTS, DEFAULT_REFRESH_RATE_MS} from './utils'

type XHRWithIndex = {_index: number; responseHeaders?: Headers}

type Listener = (requests: NetworkRequest[]) => void

let nextXHRId = 0

export class NetworkInspector {
  private static instance: NetworkInspector
  private requests: NetworkRequest[] = []
  private xhrIndexToRequest = new Map<number, NetworkRequest>()
  private maxRequests = DEFAULT_MAX_REQUESTS
  private refreshRate = DEFAULT_REFRESH_RATE_MS
  private latestRequestUpdatedAt = 0
  private ignoredHosts: Set<string> | undefined
  private ignoredUrls: Set<string> | undefined
  private ignoredPatterns: RegExp[] | undefined
  public enabled = false
  private listeners = new Set<Listener>()
  private options: NetworkInspectorOptions | null = null

  static getInstance(): NetworkInspector {
    if (!NetworkInspector.instance) {
      NetworkInspector.instance = new NetworkInspector()
    }
    return NetworkInspector.instance
  }

  private notifyListeners(): void {
    const snapshot = [...this.requests]
    this.listeners.forEach(l => l(snapshot))
    this.options?.onRequestsChange?.(snapshot)
  }

  private debouncedNotify(): void {
    if (
      !this.latestRequestUpdatedAt ||
      this.requests.some(r => r.updatedAt > this.latestRequestUpdatedAt)
    ) {
      this.latestRequestUpdatedAt = Date.now()
      this.notifyListeners()
    }
  }

  private debouncedNotifyFn: (() => void) | null = null

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private getRequest(xhrIndex?: number): NetworkRequest | undefined {
    if (xhrIndex === undefined) return undefined
    return this.xhrIndexToRequest.get(xhrIndex)
  }

  private updateRequest(
    xhrIndex: number,
    update: Partial<NetworkRequest>
  ): void {
    const req = this.getRequest(xhrIndex)
    if (!req) return
    req.update(update)
    this.debouncedNotifyFn?.() ?? this.debouncedNotify()
  }

  private addRequest(request: NetworkRequest, xhrIndex: number): void {
    this.requests.unshift(request)
    this.xhrIndexToRequest.set(xhrIndex, request)
    if (this.requests.length > this.maxRequests) {
      const removed = this.requests.pop()
      if (removed) this.xhrIndexToRequest.delete(Number(removed.id))
    }
  }

  private openCallback = (method: RequestMethod, url: string, xhr: XHRWithIndex): void => {
    if (this.shouldIgnoreRequest(method, url)) return
    xhr._index = nextXHRId++
    const newRequest = new NetworkRequest(
      `${xhr._index}`,
      'XMLHttpRequest',
      method,
      url
    )
    this.addRequest(newRequest, xhr._index)
  }

  private shouldIgnoreRequest(method: RequestMethod, url: string): boolean {
    if (this.ignoredHosts) {
      const host = extractHost(url)
      if (host && this.ignoredHosts.has(host)) return true
    }
    if (this.ignoredUrls && this.ignoredUrls.has(url)) return true
    if (this.ignoredPatterns) {
      return this.ignoredPatterns.some(p => p.test(`${method} ${url}`))
    }
    return false
  }

  private requestHeadersCallback = (header: string, value: string, xhr: XHRWithIndex): void => {
    const req = this.getRequest(xhr._index)
    if (req) req.requestHeaders[header] = value
  }

  private headerReceivedCallback = (
    responseContentType: string,
    responseSize: number,
    _responseHeaders: Headers,
    xhr: XHRWithIndex
  ): void => {
    this.updateRequest(xhr._index, {
      responseContentType,
      responseSize,
      responseHeaders: xhr.responseHeaders ?? {}
    })
  }

  private sendCallback = (data: string, xhr: XHRWithIndex): void => {
    this.updateRequest(xhr._index, {startTime: Date.now(), dataSent: data})
    this.debouncedNotifyFn?.() ?? this.debouncedNotify()
  }

  private responseCallback = (
    status: number,
    timeout: number,
    response: string,
    responseURL: string,
    responseType: string,
    xhr: XHRWithIndex
  ): void => {
    this.updateRequest(xhr._index, {
      status,
      timeout,
      response,
      responseURL,
      responseType,
      endTime: Date.now()
    })
    this.debouncedNotifyFn?.() ?? this.debouncedNotify()
  }

  private applyOptions(options?: NetworkInspectorOptions): void {
    if (options?.maxRequests != null && typeof options.maxRequests === 'number' && options.maxRequests >= 1) {
      this.maxRequests = Math.floor(options.maxRequests)
    }
    if (options?.refreshRate != null && typeof options.refreshRate === 'number' && options.refreshRate >= 1) {
      this.refreshRate = Math.floor(options.refreshRate)
    }
    if (options?.ignoredHosts != null && Array.isArray(options.ignoredHosts)) {
      const hosts = options.ignoredHosts.filter((h): h is string => typeof h === 'string')
      this.ignoredHosts = hosts.length > 0 ? new Set(hosts) : undefined
    }
    if (options?.ignoredUrls != null && Array.isArray(options.ignoredUrls)) {
      const urls = options.ignoredUrls.filter((u): u is string => typeof u === 'string')
      this.ignoredUrls = urls.length > 0 ? new Set(urls) : undefined
    }
    if (options?.ignoredPatterns != null && Array.isArray(options.ignoredPatterns)) {
      const patterns = options.ignoredPatterns.filter((p): p is RegExp => p instanceof RegExp)
      this.ignoredPatterns = patterns.length > 0 ? patterns : undefined
    }
  }

  private enableInterception(options?: NetworkInspectorOptions): void {
    this.applyOptions(options)
    this.debouncedNotifyFn = debounce(
      () => this.debouncedNotify(),
      this.refreshRate
    )
    XHRInterceptor.setOpenCallback(this.openCallback)
    XHRInterceptor.setRequestHeaderCallback(this.requestHeadersCallback)
    XHRInterceptor.setHeaderReceivedCallback(this.headerReceivedCallback)
    XHRInterceptor.setSendCallback(this.sendCallback)
    XHRInterceptor.setResponseCallback(this.responseCallback)
    XHRInterceptor.enableInterception()
    this.enabled = true
  }

  private disableInterception(): void {
    if (!this.enabled) return
    this.debouncedNotifyFn = null
    this.clear()
    nextXHRId = 0
    this.enabled = false
    this.xhrIndexToRequest.clear()
    this.maxRequests = DEFAULT_MAX_REQUESTS
    this.refreshRate = DEFAULT_REFRESH_RATE_MS
    this.ignoredHosts = undefined
    this.ignoredUrls = undefined
    this.ignoredPatterns = undefined
    const noop = () => {}
    XHRInterceptor.setOpenCallback(noop)
    XHRInterceptor.setRequestHeaderCallback(noop)
    XHRInterceptor.setHeaderReceivedCallback(noop)
    XHRInterceptor.setSendCallback(noop)
    XHRInterceptor.setResponseCallback(noop)
    XHRInterceptor.disableInterception()
  }

  start(options?: NetworkInspectorOptions): void {
    if (this.enabled) return
    this.options = options ?? null
    this.enableInterception(options)
  }

  stop(): void {
    if (!this.enabled) return
    this.options = null
    this.disableInterception()
  }

  /** Returns a copy of the current requests so callers cannot mutate internal state. */
  getRequests(): NetworkRequest[] {
    return [...this.requests]
  }

  clear(): void {
    this.requests = []
    this.xhrIndexToRequest.clear()
    this.latestRequestUpdatedAt = 0
    this.debouncedNotifyFn?.() ?? this.notifyListeners()
  }
}

export function getNetworkInspector(): NetworkInspector {
  return NetworkInspector.getInstance()
}
