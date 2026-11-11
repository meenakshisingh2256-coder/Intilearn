import bcrypt from "bcryptjs";
import { Router, type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_LIFETIME = "7d";
const BCRYPT_COST = 10;

// Lets every route after requireAuth read req.userId with the right type.
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

// Trim and lowercase before the email check, so "Ana@Mail.com " and "ana@mail.com" are one account.
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8),
});

function createToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_LIFETIME });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
  } catch {
    res.status(401).json({ error: "Please log in" });
    return;
  }
  // Outside the try, so errors in the route itself are not reported as "Please log in".
  next();
}

export const authRouter = Router();

authRouter.post("/auth/signup", async (req, res) => {
  const { email, password } = credentialsSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "This email already has an account" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  res.status(201).json({ token: createToken(user.id) });
});

authRouter.post("/auth/login", async (req, res) => {
  const { email, password } = credentialsSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  // Same answer for an unknown email and a wrong password, so nobody can probe which emails exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Wrong email or password" });
    return;
  }
  res.json({ token: createToken(user.id) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { email: true },
  });
  res.json(user);
});
