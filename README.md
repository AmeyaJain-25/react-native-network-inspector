# react-native-network-inspector

React Native network inspector – intercept and inspect HTTP/XHR requests. This package exports **only** the core API and hooks; you build your own UI.

## Installation

```bash
yarn add react-native-network-inspector
```

**Peer dependencies:** `react`, `react-native`.

## Demo

This is how captured requests can be viewed in your own UI.

**1.** Base code (default options) — intercept and display all requests:

```tsx
const { requests, isActive, start, stop } = useNetworkRequests();
// Render your list with requests; start() / stop() to begin or end capture.
```

**2.** With options — e.g. ignore a host so it does not appear in the list:

```tsx
const { requests, isActive, start, stop } = useNetworkRequests({
  ignoredHosts: ["10.0.2.2"],
});
```

<img src="https://raw.githubusercontent.com/AmeyaJain-25/react-native-network-inspector/refs/heads/master/demo-images/all-requests.png" width="280" alt="All requests" /> <img src="https://raw.githubusercontent.com/AmeyaJain-25/react-native-network-inspector/refs/heads/master/demo-images/filtered-requests.png" width="280" alt="Filtered requests" />

## Usage

### Imperative API

```ts
import { getNetworkInspector } from "react-native-network-inspector";

const inspector = getNetworkInspector();

// Start intercepting (optional filter options)
inspector.start({
  maxRequests: 500,
  refreshRate: 50,
  ignoredHosts: ["analytics.example.com"],
  ignoredUrls: ["https://example.com/ignore"],
  ignoredPatterns: [/^GET https:\/\/api\.example\.com\/health/],
  onRequestsChange: (requests) => {
    console.log(requests.length);
  },
});

// Read current requests
const requests = inspector.getRequests();

// Stop intercepting
inspector.stop();

// Clear the in-memory list (logging can stay active)
inspector.clear();
```

### React hook

Use the hook to drive your own UI (list, detail, filters).

```tsx
import { useNetworkRequests } from "react-native-network-inspector";

function MyNetworkScreen() {
  const { requests, isActive, start, stop, clear } = useNetworkRequests({
    ignoredHosts: ["analytics.example.com"],
  });

  return (
    <View>
      <Button
        title={isActive ? "Stop" : "Start"}
        onPress={isActive ? stop : start}
      />
      <Button title="Clear" onPress={clear} />
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <Text>
            {item.method} {item.url} {item.status}
          </Text>
        )}
      />
    </View>
  );
}
```

### Filter options (`NetworkInspectorOptions`)

| Option             | Type                 | Description                                                    |
| ------------------ | -------------------- | -------------------------------------------------------------- |
| `maxRequests`      | `number`             | Max requests to keep (default `500`)                           |
| `refreshRate`      | `number`             | Notify interval in ms (default `50`)                           |
| `ignoredHosts`     | `string[]`           | Blocklist by host, e.g. `['api.analytics.com']`                |
| `ignoredUrls`      | `string[]`           | Blocklist by full URL                                          |
| `ignoredPatterns`  | `RegExp[]`           | Blocklist by pattern; match target is `` `${method} ${url}` `` |
| `forceEnable`      | `boolean`            | Force start even if another interceptor is active              |
| `onRequestsChange` | `(requests) => void` | Callback when requests update (e.g. for non-React usage)       |

### API reference

Everything you need to build your UI is below. Requests are plain objects/class instances with the listed properties and methods.

---

#### `getNetworkInspector(): NetworkInspector`

Returns the singleton network inspector. Use it for the imperative API (no React).

```ts
import { getNetworkInspector } from "react-native-network-inspector";
const inspector = getNetworkInspector();
```

---

#### `NetworkInspector` (class)

| Method / property | Signature | Description |
| ----------------- | --------- | ----------- |
| `start` | `(options?: NetworkInspectorOptions) => void` | Start intercepting. No-op if already active. |
| `stop` | `() => void` | Stop intercepting and clear internal XHR mapping. |
| `getRequests` | `() => NetworkRequest[]` | Current list of requests (newest first). Returns a copy. |
| `clear` | `() => void` | Clear the in-memory request list. Interception can stay active. |
| `subscribe` | `(listener: (requests: NetworkRequest[]) => void) => () => void` | Subscribe to request updates. Returns an unsubscribe function. |
| `enabled` | `boolean` | Whether interception is currently active. |

---

#### `useNetworkRequests(options?: NetworkInspectorOptions): UseNetworkRequestsResult`

React hook to drive your UI. Options are the same as `NetworkInspectorOptions` (filters, `maxRequests`, `refreshRate`, etc.).

**Returns:**

| Property / method | Type | Description |
| ----------------- | ---- | ----------- |
| `requests` | `NetworkRequest[]` | Current list of requests (newest first). |
| `isActive` | `boolean` | Whether interception is active. |
| `start` | `() => void` | Start intercepting (uses options passed to the hook). |
| `stop` | `() => void` | Stop intercepting. |
| `clear` | `() => void` | Clear the request list. |

---

#### `NetworkRequest` (class instance)

Each item in `requests` (from `getRequests()` or the hook) is a `NetworkRequest` with these members. Use them to render list rows, detail screens, copy-as-curl, etc.

**Properties (read-only unless noted):**

| Property | Type | Description |
| -------- | ---- | ----------- |
| `id` | `string` | Unique id for the request. |
| `type` | `string` | e.g. `'XMLHttpRequest'`. |
| `url` | `string` | Request URL. |
| `method` | `RequestMethod` | `'GET' \| 'POST' \| 'PUT' \| 'PATCH' \| 'DELETE'`. |
| `status` | `number` | HTTP status (e.g. 200). `-1` until response. |
| `dataSent` | `string` | Raw request body as sent. |
| `responseContentType` | `string` | Response `Content-Type` header value. |
| `responseSize` | `number` | Response size (when available). |
| `requestHeaders` | `Headers` | Request headers `{ [name: string]: string }`. |
| `responseHeaders` | `Headers` | Response headers `{ [name: string]: string }`. |
| `response` | `string` | Raw response (or blob reference). Prefer `getResponseBody()` for body text. |
| `responseURL` | `string` | Final response URL (after redirects). |
| `responseType` | `string` | e.g. `'text'`, `'blob'`. |
| `timeout` | `number` | Timeout value. |
| `startTime` | `number` | Timestamp when request started. |
| `endTime` | `number` | Timestamp when request finished. |
| `updatedAt` | `number` | Last update timestamp. |
| `duration` | `number` (getter) | `Math.max(0, endTime - startTime)` in ms. |
| `curlRequest` | `string` (getter) | Approximate `curl` command for the request. |

**Methods:**

| Method | Signature | Description |
| ------ | --------- | ----------- |
| `getRequestBody` | `(replaceEscaped?: boolean) => string` | Request body. If `replaceEscaped === true`, unescapes `\\n` and `\\"` for display. |
| `getResponseBody` | `() => Promise<string>` | Response body as text. For blob responses, reads the blob and resolves with text. Rejects on read error. |
| `update` | `(values: Partial<NetworkRequest>) => void` | Update mutable fields (internal use; you typically only read). |

---

#### Types

- **`NetworkInspectorOptions`** — Options for `inspector.start(options)` and `useNetworkRequests(options)`. See [Filter options](#filter-options-networkinspectoroptions) table.
- **`UseNetworkRequestsResult`** — Return type of `useNetworkRequests()`: `{ requests, isActive, start, stop, clear }`.
- **`NetworkRequestShape`** — Interface describing a request (same shape as `NetworkRequest` instances).
- **`Headers`** — `{ [header: string]: string }`.
- **`RequestMethod`** — `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`.

## Exports

- **Functions:** `getNetworkInspector()`
- **Classes:** `NetworkInspector`, `NetworkRequest`
- **Hook:** `useNetworkRequests(options?)`
- **Types:** `NetworkRequest`, `NetworkInspectorOptions`, `NetworkRequestShape`, `UseNetworkRequestsResult`, `Headers`, `RequestMethod`

## Development

From the package root:

```bash
yarn install
yarn build
```

### Compatibility

- **React:** 16.8+
- **React Native:** The package resolves `XHRInterceptor` and `BlobFileReaderInterceptor` via fallbacks:
  - **0.79+:** uses private API paths (`react-native/src/private/...`).
  - **0.72 and earlier:** uses public path (`react-native/Libraries/Network/XHRInterceptor`, `Libraries/Blob/...`).

If a future React Native version moves or changes these internal APIs, compatibility may need a patch.

## License

MIT
