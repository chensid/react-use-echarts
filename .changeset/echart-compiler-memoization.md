---
"react-use-echarts": patch
---

Let React Compiler optimize `<EChart>` again. The component read the container callback ref as `chart.ref` directly inside JSX, which the compiler treats as accessing a ref during render — it bailed out and emitted the component uncompiled. Destructuring the ref before the return restores compilation (the emitted component now carries its memo cache), so `<EChart>` no longer re-creates its container props object and `useEcharts` argument on every render.

No API or behavior change. Consumers that only import `useEcharts` are unaffected; `<EChart>` users gain the memoization at a cost of roughly 0.65 kB min+gzip.
