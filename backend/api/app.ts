import express from "express";
import dotenv from "dotenv";
import path from "path";
import { corsHandler } from "./common/middleware/corsHandler";
import { errorHandler } from "./common/middleware/errorHandler";
import { initializeApp } from "./config/app.config";

if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(__dirname, "../api/config/env/.env.dev") });
}

const app = express();
let initialized = false;
let initializationPromise: Promise<void> | null = null;

app.use(corsHandler);
app.use(express.json());
app.use(async (_req, _res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

function ensureInitialized(): Promise<void> {
  if (initialized) return Promise.resolve();

  initializationPromise ??= initializeApp(app).then(() => {
    app.use(errorHandler);
    initialized = true;
  });

  return initializationPromise;
}

export async function bootstrapApp(): Promise<typeof app> {
  await ensureInitialized();
  return app;
}

export default app;
