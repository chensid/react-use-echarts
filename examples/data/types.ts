import type React from "react";

export interface DemoItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
  readonly source: () => Promise<{ default: string }>;
  readonly sourcePath: string;
}
