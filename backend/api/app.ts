import express, { type NextFunction, type Request, type Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { corsHandler } from "./common/middleware/corsHandler";
import { healthRouter } from "./health/health.routes";

if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(__dirname, "../api/config/env/.env.dev") });
}

const app = express();
let initialized = false;
let initializationPromise: Promise<void> | null = null;

app.use(corsHandler);
app.use(express.json());
app.use("/api/health", healthRouter);
app.use(async (_req, _res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    next(error);
  }
});
app.use(bootstrapErrorHandler);

function ensureInitialized(): Promise<void> {
  if (initialized) return Promise.resolve();

  initializationPromise ??= import("./config/app.config").then(({ initializeApp }) => initializeApp(app)).then(async () => {
    const { errorHandler } = await import("./common/middleware/errorHandler");
    app.use(errorHandler);
    initialized = true;
  });

  return initializationPromise;
}

export async function bootstrapApp(): Promise<typeof app> {
  await ensureInitialized();
  return app;
}

function bootstrapErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("API bootstrap failed:", err);

  const statusCode = typeof err === "object" && err !== null && "statusCode" in err && typeof err.statusCode === "number"
    ? err.statusCode
    : 500;
  const code = typeof err === "object" && err !== null && "code" in err && typeof err.code === "string"
    ? err.code
    : "INTERNAL_ERROR";
  const isKnownError = statusCode !== 500 || code !== "INTERNAL_ERROR";
  const message = isKnownError && err instanceof Error
    ? err.message
    : "Internal server error.";

  res.status(statusCode).json({
    error_code: code,
    code,
    message,
  });
}

export default app;
