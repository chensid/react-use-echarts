---
"react-use-echarts": patch
---

Document in the README and the shipped `AGENTS.md` that, since 3.2.0 binds `onEvents` handlers through proxies, calling `instance.off(name, yourHandler)` no longer removes a listener bound through `onEvents` — remove the entry from `onEvents` instead. Documentation only — no runtime behavior change.
