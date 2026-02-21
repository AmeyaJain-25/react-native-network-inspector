# react-native-network-inspector

React Native network inspector – intercept and inspect HTTP/XHR requests. This package exports **only** the core API and hooks; you build your own UI.

## Installation

```bash
yarn add react-native-network-inspector
```

**Peer dependencies:** `react`, `react-native`.

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
  onRequestsChange: (requests) => console.log(requests.length),
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

### Request shape

Each request (e.g. from `getRequests()` or the hook) exposes raw data: `id`, `url`, `method`, `status`, `requestHeaders`, `responseHeaders`, `response`, `dataSent`, `duration`, `curlRequest`, `getRequestBody()`, `getResponseBody()`. No parsing or interpretation—bodies and responses are kept as captured. See type `NetworkRequestShape` / class `NetworkRequest` in the exports.

## Exports

- **Functions:** `getNetworkInspector()`
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
