import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

const PORT = 3190;
export const EXAMPLES_URL = `http://localhost:${PORT}/`;

const STARTUP_TIMEOUT_MS = 60_000;

// Vitest globalSetup for the `examples` project: serve the examples app with
// `vp dev` for the smoke test. Dev, not `vp build` + preview: ECharts' "Component
// X is used but not imported" checks run only in development builds, and they
// are what catches a demo that forgot to register a module.
export default async function setup(): Promise<() => Promise<void>> {
  const server = spawn(
    resolve("node_modules/.bin/vp"),
    ["dev", "--port", String(PORT), "--strictPort"],
    {
      // Vitest sets NODE_ENV=test; the app should see the usual dev mode.
      env: { ...process.env, NODE_ENV: "development" },
      // Own process group, so teardown also stops the server vp starts.
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  server.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
  server.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));

  const stop = async () => {
    if (server.exitCode !== null || server.signalCode !== null) return;
    process.kill(-server.pid!, "SIGTERM");
    await once(server, "exit");
  };

  try {
    await waitForServer(() => server.exitCode !== null);
  } catch (error) {
    await stop();
    throw new Error(`${(error as Error).message}\n--- vp dev output ---\n${output}`);
  }
  return stop;
}

async function waitForServer(exited: () => boolean): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (exited()) throw new Error(`vp dev exited before serving ${EXAMPLES_URL}`);
    try {
      if ((await fetch(EXAMPLES_URL)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vp dev did not serve ${EXAMPLES_URL} within ${STARTUP_TIMEOUT_MS} ms`);
}
