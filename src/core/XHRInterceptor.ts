type XHRInterceptorModule = {
  isInterceptorEnabled: () => boolean
  setOpenCallback: (...props: unknown[]) => void
  setRequestHeaderCallback: (...props: unknown[]) => void
  setSendCallback: (...props: unknown[]) => void
  setHeaderReceivedCallback: (...props: unknown[]) => void
  setResponseCallback: (...props: unknown[]) => void
  enableInterception: () => void
  disableInterception: () => void
}

let XHRInterceptor: XHRInterceptorModule
try {
  const module = require('react-native/src/private/devsupport/devmenu/elementinspector/XHRInterceptor')
  XHRInterceptor = module.default ?? module
} catch {
  try {
    const module = require('react-native/src/private/inspector/XHRInterceptor')
    XHRInterceptor = module.default ?? module
  } catch {
    try {
      const module = require('react-native/Libraries/Network/XHRInterceptor')
      XHRInterceptor = module.default ?? module
    } catch {
      throw new Error('XHRInterceptor could not be found in either location')
    }
  }
}

export default XHRInterceptor
