---
"react-use-echarts": patch
---

Switching `lazyInit` from `false` to `true` no longer disposes a chart that already initialized eagerly; `useLazyInit` likewise keeps `isInView` true once an element was attached in eager mode. Lazy mode now only defers what has not initialized yet, matching `<img loading>` and react-intersection-observer's `skip`. Enabling lazy mode before any container is attached still defers as before.
