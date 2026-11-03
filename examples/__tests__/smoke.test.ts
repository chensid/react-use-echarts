import { chromium, type Browser, type BrowserContext } from "playwright";
import { afterAll, beforeAll, test } from "vite-plus/test";
import { featureItems } from "../data/features";
import { galleryItems } from "../data/gallery";
import { EXAMPLES_URL } from "./dev-server";

// Every route in App.tsx, demo ids taken from the same data the router uses.
const ROUTES = [
  "/",
  "/gallery",
  "/features",
  "/playground",
  "/compare",
  ...galleryItems.map((item) => `/gallery/${item.id}`),
  ...featureItems.map((item) => `/features/${item.id}`),
];

let browser: Browser;
// One context, so pages share the HTTP cache for the dev server's modules.
let context: BrowserContext;

beforeAll(async () => {
  browser = await chromium.launch();
  context = await browser.newContext();
});

afterAll(async () => {
  await browser?.close();
});

// A fresh page per route: ECharts' module registry lives in the page, so moving
// one page through several routes would let earlier ones register modules a
// later demo forgot.
test.concurrent.for(ROUTES)("%s renders without errors", async (route, { expect }) => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  try {
    await page.goto(`${EXAMPLES_URL}#${route}`, { waitUntil: "networkidle" });
    // An unknown id redirects to "/", which would pass with Home's errors.
    expect(new URL(page.url()).hash).toBe(`#${route}`);
    await page.locator("main h1").first().waitFor();
    // Let mount effects (chart init, setOption) run and report.
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});
