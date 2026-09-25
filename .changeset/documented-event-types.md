---
"react-use-echarts": minor
---

Type more of the events documented by ECharts in `EChartsEventPayloadMap`, so their handler `params` are inferred instead of falling back to `any`: `legendselectchanged`, `legendselected`, `legendunselected`, `legendselectall`, `legendinverseselect`, `legendscroll`, `datazoom` (including the batched `{ batch: [...] }` form emitted by inside zoom), `timelinechanged`, `timelineplaychanged`, `rendered` and `finished`. `selectchanged` now uses ECharts' `SelectChangedEvent` type instead of the deprecated `SelectChangedPayload`; both have the same shape.
