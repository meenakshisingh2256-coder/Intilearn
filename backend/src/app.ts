import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError, z } from "zod";
import { authRouter } from "./auth.js";
import { prisma } from "./db.js";

export const app = express();
app.use(express.json());

// SELECT 1 proves the database is reachable, not just the server.
// If it throws, Express 5 answers 500 for us.
app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});

app.use("/api", authRouter);

// Routes call schema.parse(req.body); a bad body becomes a 400 here instead of a 500.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (!(err instanceof ZodError)) return next(err);
  res.status(400).json({ error: z.prettifyError(err) });
});
