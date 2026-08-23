---
"react-use-echarts": patch
---

Refresh the published documentation to match the implementation precisely. The README and the shipped `AGENTS.md` now state the exact `JSON.stringify` keying semantics for `initOpts` and custom `theme` objects (serialization is non-canonical, so property insertion order affects the key), that lazy init forwards only `root` / `rootMargin` / `threshold` to the `IntersectionObserver` (`scrollMargin` is not supported), the full `onError` coverage including the deliberately bare `off()` during dynamic event rebinding, and the `onChartReady`-style migration pattern via the reactive `instance` field. The README quick start was also deduplicated against the module-registration section.

Documentation only — no runtime behavior change.
