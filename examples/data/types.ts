import type { DemoModule } from "./demo-modules";

export interface DemoItem extends DemoModule {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}
