import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../src/server.js";
import { Store } from "../src/store.js";

export interface TestApp {
  base: string;
  store: Store;
  close: () => Promise<void>;
}

const tempDirs: string[] = [];

/** A store path inside a fresh temp dir. Call `removeTempStores()` in an afterAll to clean up. */
export function tempStoreFile(): string {
  const dir = mkdtempSync(join(tmpdir(), "linkr-"));
  tempDirs.push(dir);
  return join(dir, "store.json");
}

/** Remove every temp dir `tempStoreFile()` handed out in this test file. */
export function removeTempStores(): void {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
}

/** Start the app on a free port with an empty throwaway store; `close()` also removes that store. */
export async function startApp(): Promise<TestApp> {
  const dir = mkdtempSync(join(tmpdir(), "linkr-"));
  const store = new Store(join(dir, "store.json"));
  const server = createApp(store);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as any;
  return {
    base: `http://127.0.0.1:${port}`,
    store,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export async function postJson(base: string, path: string, body: unknown): Promise<Response> {
  return fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
