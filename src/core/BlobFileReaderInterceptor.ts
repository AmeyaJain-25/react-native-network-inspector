type BlobFileReaderModule = {
  isInterceptorEnabled: () => boolean
  setReadAsTextCallback: (...props: unknown[]) => void
  setLoadCallback: (...props: unknown[]) => void
  setErrorCallback: (...props: unknown[]) => void
  setAbortCallback: (...props: unknown[]) => void
  getBlobFileReader: () => unknown
  enableInterception: () => void
  disableInterception: () => void
}

let BlobFileReader: BlobFileReaderModule
try {
  const module = require('react-native/src/private/devsupport/devmenu/elementinspector/BlobFileReaderInterceptor')
  BlobFileReader = module.default ?? module
} catch {
  try {
    const module = require('react-native/src/private/inspector/BlobFileReaderInterceptor')
    BlobFileReader = module.default ?? module
  } catch {
    try {
      const module = require('react-native/Libraries/Blob/BlobFileReaderInterceptor')
      BlobFileReader = module.default ?? module
    } catch {
      BlobFileReader = {
        isInterceptorEnabled: () => false,
        setReadAsTextCallback: () => {},
        setLoadCallback: () => {},
        setErrorCallback: () => {},
        setAbortCallback: () => {},
        getBlobFileReader: () => require('react-native/Libraries/Blob/FileReader').default,
        enableInterception: () => {},
        disableInterception: () => {}
      }
    }
  }
}

export default BlobFileReader
