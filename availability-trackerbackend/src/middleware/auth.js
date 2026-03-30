import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const userId = decoded.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.userId = user.id;
    req.userRole = user.role;
    req.userEmail = user.email;
    next();
  } catch (err) {
    console.error("[auth]", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `This action requires one of: ${roles.join(", ")}. Your role: ${req.userRole || "none"}.`,
      });
    }
    next();
  };
}
