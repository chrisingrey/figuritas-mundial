import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { services } from "@api/config/services.config";
import { asyncHandler } from "@api/common/middleware/asyncHandler";

type HealthStatus = "ok" | "degraded" | "down";

interface DependencyHealth {
  status: HealthStatus;
  message?: string;
}

interface HealthResponse {
  status: HealthStatus;
  checkedAt: string;
  uptimeSeconds: number;
  services: {
    api: DependencyHealth;
    database: DependencyHealth;
    email: DependencyHealth;
  };
}

const EMAIL_HEALTH_TIMEOUT_MS = 4000;

export const getHealth = asyncHandler(async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const [database, email] = await Promise.all([
    checkDatabase(),
    checkEmail(),
  ]);

  const servicesHealth = {
    api: { status: "ok" as const },
    database,
    email,
  };

  const status = Object.values(servicesHealth).every((service) => service.status === "ok")
    ? "ok"
    : "degraded";

  const response: HealthResponse = {
    status,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    services: servicesHealth,
  };

  res.status(status === "ok" ? 200 : 503).json(response);
});

async function checkDatabase(): Promise<DependencyHealth> {
  if (mongoose.connection.readyState !== 1) {
    return {
      status: "down",
      message: "MongoDB connection is not ready.",
    };
  }

  try {
    await mongoose.connection.db?.admin().ping();
    return { status: "ok" };
  } catch {
    return {
      status: "down",
      message: "MongoDB ping failed.",
    };
  }
}

async function checkEmail(): Promise<DependencyHealth> {
  try {
    const healthy = await withTimeout(
      services.messagingService.verifyConnection(),
      EMAIL_HEALTH_TIMEOUT_MS,
    );

    return healthy
      ? { status: "ok" }
      : { status: "down", message: "Email service verification failed." };
  } catch {
    return {
      status: "down",
      message: "Email service verification failed.",
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Health check timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}
