---
"react-use-echarts": patch
---

Fix `getConnectedDataURL()` called without options. ECharts 6.1.0 reads `opts.type` without defaulting `opts`, so the documented no-argument call threw a `TypeError` (routed to `onError`, or rethrown without one) instead of returning the image. The hook now passes `{}` when no options are given.
