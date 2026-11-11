import { afterAll, beforeAll, expect, test, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "./app.js";

// vi.hoisted runs before the imports above, so auth.ts sees the secret when it loads.
const users = vi.hoisted(() => {
  process.env.JWT_SECRET = "test-secret";
  return [] as { id: string; email: string; passwordHash: string }[];
});

// An in-memory users table instead of Postgres.
vi.mock("./db.js", () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: any) => users.find((u) => u.email === where.email) ?? null,
      create: async ({ data }: any) => {
        const user = { id: `user-${users.length + 1}`, ...data };
        users.push(user);
        return user;
      },
      findUniqueOrThrow: async ({ where }: any) => ({
        email: users.find((u) => u.id === where.id)!.email,
      }),
    },
  },
}));

let server: Server;
let baseUrl: string;

beforeAll(() => {
  server = app.listen(0);
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

function post(path: string, body: object) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// The tests run in order and share the users table: the first one creates the account.
test("sign up, log in with different capitals, then read /api/me", async () => {
  const signup = await post("/api/auth/signup", { email: "  Ana@Mail.com ", password: "secret123" });
  expect(signup.status).toBe(201);

  const login = await post("/api/auth/login", { email: "ana@mail.COM", password: "secret123" });
  expect(login.status).toBe(200);
  const { token } = await login.json();

  const me = await fetch(`${baseUrl}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
  expect(await me.json()).toEqual({ email: "ana@mail.com" });
});

test("the same email with other capitals cannot sign up twice", async () => {
  const res = await post("/api/auth/signup", { email: "ANA@mail.com", password: "another123" });
  expect(res.status).toBe(409);
});

test("a wrong password is rejected", async () => {
  const res = await post("/api/auth/login", { email: "ana@mail.com", password: "wrongpass" });
  expect(res.status).toBe(401);
});

test("/api/me without a token is rejected", async () => {
  const res = await fetch(`${baseUrl}/api/me`);
  expect(res.status).toBe(401);
});

test("a bad email or short password is a 400", async () => {
  const res = await post("/api/auth/signup", { email: "not-an-email", password: "short" });
  expect(res.status).toBe(400);
});
