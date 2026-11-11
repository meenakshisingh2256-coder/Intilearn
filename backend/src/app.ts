import express from "express";
import { prisma } from "./db.js";

export const app = express();
app.use(express.json());

// SELECT 1 proves the database is reachable, not just the server.
// If it throws, Express 5 answers 500 for us.
app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});
