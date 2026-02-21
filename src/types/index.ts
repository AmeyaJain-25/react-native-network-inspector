export type Headers = {[header: string]: string}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Public shape of a captured network request (implementation in core/NetworkRequest) */
export interface NetworkRequestShape {
  readonly id: string
  readonly type: string
  readonly url: string
  readonly method: RequestMethod
  status: number
  dataSent: string
  responseContentType: string
  responseSize: number
  requestHeaders: Headers
  responseHeaders: Headers
  response: string
  responseURL: string
  responseType: string
  timeout: number
  startTime: number
  endTime: number
  updatedAt: number
  readonly duration: number
  readonly curlRequest: string
  getRequestBody(replaceEscaped?: boolean): string
  getResponseBody(): Promise<string>
  update(values: Partial<NetworkRequestShape>): void
}

export interface NetworkInspectorOptions {
  /**
   * Max number of requests to keep before overwriting
   * @default 500
   */
  maxRequests?: number
  /** List of hosts to ignore, e.g. `services.test.com` */
  ignoredHosts?: string[]
  /** List of urls to ignore, e.g. `https://services.test.com/test` */
  ignoredUrls?: string[]
  /**
   * List of url patterns to ignore, e.g. `/^GET https://test.com\/pages\/.*$/`
   * Match target is `${method} ${url}`, e.g. `GET https://test.com/pages/123`
   */
  ignoredPatterns?: RegExp[]
  /**
   * Force the inspector to start even if another program is using the network interceptor
   */
  forceEnable?: boolean
  /**
   * Refresh rate in milliseconds
   * @default 50
   */
  refreshRate?: number
  /** Optional callback when requests change (for non-React usage) */
  onRequestsChange?: (requests: NetworkRequestShape[]) => void
}

export interface UseNetworkRequestsResult {
  requests: NetworkRequestShape[]
  isActive: boolean
  start: () => void
  stop: () => void
  clear: () => void
}
