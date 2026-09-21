---
"react-use-echarts": patch
---

Raise the declared Node.js tooling floor on 22.x from 22.18 to 22.19, matching the `size-limit` 14 requirement introduced with the latest development dependency refresh: Node.js 22.19+ on 22.x, 24.11+ on 24.x, or 26+. The CI job that guards the 22.x minimum now pins 22.19.0 so the tested floor and the declared floor stay identical.
