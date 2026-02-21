import {useState, useEffect, useCallback, useRef} from 'react'
import {getNetworkInspector} from '../core'
import type {NetworkInspectorOptions, UseNetworkRequestsResult} from '../types'
import type {NetworkRequest} from '../core/NetworkRequest'

export function useNetworkRequests(
  options?: NetworkInspectorOptions
): UseNetworkRequestsResult {
  const inspector = getNetworkInspector()
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [requests, setRequests] = useState<NetworkRequest[]>(() =>
    inspector.getRequests()
  )
  const [isActive, setIsActive] = useState(inspector.enabled)

  useEffect(() => {
    const unsubscribe = inspector.subscribe((next: NetworkRequest[]) => {
      setRequests(next)
      setIsActive(inspector.enabled)
    })
    return unsubscribe
  }, [inspector])

  const start = useCallback(() => {
    inspector.start(optionsRef.current)
    setRequests(inspector.getRequests())
    setIsActive(true)
  }, [inspector])

  const stop = useCallback(() => {
    inspector.stop()
    setIsActive(false)
  }, [inspector])

  const clear = useCallback(() => {
    inspector.clear()
    setRequests([])
  }, [inspector])

  return {requests, isActive, start, stop, clear}
}
