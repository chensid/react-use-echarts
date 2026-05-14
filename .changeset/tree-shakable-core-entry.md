---
"react-use-echarts": minor
---

Add tree-shakable `react-use-echarts/core` subpath entry.

The default entry now imports `"echarts"` as a side-effect to preserve its zero-config behavior (every chart and component pre-registered). The new `/core` entry skips that import, letting consumers register only the modules they need via `echarts.use([...])` for substantially smaller production bundles. Both entries share the same public API — only the import path differs.

```tsx
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([LineChart, GridComponent, CanvasRenderer]);

import { useEcharts, EChart } from "react-use-echarts/core";
```

This is fully backwards-compatible: the default entry's behavior is unchanged.
