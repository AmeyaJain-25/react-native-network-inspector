import BlobFileReader from './BlobFileReaderInterceptor'
import type {Headers, RequestMethod} from '../types'

/**
 * Network request capture (single XHR/fetch).
 */
export class NetworkRequest {
  public readonly id: string
  public readonly type: string
  public readonly url: string
  public readonly method: RequestMethod
  public status: number = -1
  public dataSent: string = ''
  public responseContentType: string = ''
  public responseSize: number = 0
  public requestHeaders: Headers = {}
  public responseHeaders: Headers = {}
  public response: string = ''
  public responseURL: string = ''
  public responseType: string = ''
  public timeout: number = 0
  public startTime: number = 0
  public endTime: number = 0
  public updatedAt: number = 0

  constructor(id: string, type: string, method: RequestMethod, url: string) {
    this.id = id
    this.type = type
    this.method = method
    this.url = url
    this.updatedAt = Date.now()
  }

  get duration(): number {
    return Math.max(0, this.endTime - this.startTime)
  }

  get curlRequest(): string {
    const headersPart = this.formatHeaders()
    const body = this.dataSent ? this.escapeQuotes(String(this.dataSent)) : ''
    const methodPart =
      this.method !== 'GET' ? `-X${this.method.toUpperCase()}` : ''
    const bodyPart = body.length > 0 ? `-d '${body}'` : ''
    const parts = ['curl', methodPart, headersPart, bodyPart, `'${this.url}'`]
    return parts.filter(Boolean).join(' ')
  }

  update(values: Partial<NetworkRequest>): void {
    const readonlyKeys = new Set(['id', 'type', 'url', 'method'])
    for (const key of Object.keys(values) as (keyof NetworkRequest)[]) {
      if (readonlyKeys.has(key)) continue
      const v = (values as Record<string, unknown>)[key]
      if (v !== undefined) (this as Record<string, unknown>)[key] = v
    }
    this.updatedAt = Date.now()
  }

  /** Raw request body as sent. Optionally unescape \\n and \\" for display. */
  getRequestBody(replaceEscaped = false): string {
    const body = this.dataSent ?? ''
    if (replaceEscaped) {
      return body.replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }
    return body
  }

  /** Raw response body. For blob responses, reads and returns as text. Rejects on read error. */
  async getResponseBody(): Promise<string> {
    if (this.responseType !== 'blob') {
      return typeof this.response === 'string' ? this.response : String(this.response ?? '')
    }
    try {
      return await this.parseResponseBlob()
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)))
    }
  }

  private formatHeaders(): string {
    if (!this.requestHeaders || typeof this.requestHeaders !== 'object') return ''
    const entries = Object.entries(this.requestHeaders)
      .map(([key, value]) => `'${key}: ${this.escapeQuotes(String(value ?? ''))}'`)
      .join(' -H ')
    return entries ? `-H ${entries}` : ''
  }

  private escapeQuotes(value: string): string {
    return String(value).replace(/'/g, "\\'")
  }

  private async parseResponseBlob(): Promise<string> {
    const FileReaderModule =
      BlobFileReader.getBlobFileReader?.() ??
      (() => {
        const M = require('react-native/Libraries/Blob/FileReader')
        return M.default ?? M
      })()
    const blobReader = new FileReaderModule()
    blobReader.readAsText(this.response)
    return new Promise<string>((resolve, reject) => {
      const handleError = () => reject(blobReader.error ?? new Error('Blob read failed'))
      blobReader.addEventListener('load', () => resolve(String(blobReader.result ?? '')))
      blobReader.addEventListener('error', handleError)
      blobReader.addEventListener('abort', handleError)
    })
  }
}
