import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

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
const DATABASE_HEALTH_TIMEOUT_MS = 4000;

export const getHealth = async (
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
};

async function checkDatabase(): Promise<DependencyHealth> {
  if (mongoose.connection.readyState === 1) {
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

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return {
      status: "down",
      message: "DATABASE_URL is not configured.",
    };
  }

  const client = new MongoClient(databaseUrl);
  try {
    await withTimeout(client.connect(), DATABASE_HEALTH_TIMEOUT_MS);
    await withTimeout(
      client.db(process.env.DATABASE_NAME ?? "figuritas-mundial").admin().ping(),
      DATABASE_HEALTH_TIMEOUT_MS,
    );
    return { status: "ok" };
  } catch {
    return {
      status: "down",
      message: "MongoDB ping failed.",
    };
  } finally {
    await client.close().catch(() => undefined);
  }
}

async function checkEmail(): Promise<DependencyHealth> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailAppPassword) {
    return {
      status: "down",
      message: "GMAIL_USER or GMAIL_APP_PASSWORD is not configured.",
    };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  try {
    await withTimeout(transporter.verify(), EMAIL_HEALTH_TIMEOUT_MS);
    return { status: "ok" };
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
