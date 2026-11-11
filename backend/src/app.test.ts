import { afterAll, beforeAll, expect, test, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "./app.js";

vi.mock("./db.js", () => ({ prisma: { $queryRaw: vi.fn().mockResolvedValue([]) } }));

let server: Server;
let baseUrl: string;

// Port 0 lets the OS pick a free port, so tests never clash with a running dev server.
beforeAll(() => {
  server = app.listen(0);
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

test("GET /api/health returns ok", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});
