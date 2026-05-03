import mongoose from "mongoose";
import type { Db } from "mongodb";
import { AppError, ErrorCode } from "@errors";

export type DatabaseConnection = { type: "mongodb"; db: Db };

export async function connectDatabase(): Promise<DatabaseConnection> {
  return connectMongoDB();
}

async function connectMongoDB(): Promise<DatabaseConnection> {
  const DATABASE_URL = process.env.DATABASE_URL!;
  const DATABASE_NAME = process.env.DATABASE_NAME ?? "figuritas-mundial";

  try {
    await mongoose.connect(DATABASE_URL, { dbName: DATABASE_NAME });
  } catch {
    throw new AppError(500, ErrorCode.DATABASE_CONNECTION_FAILED, "Could not connect to the database.");
  }
  console.log(`✅ Connected to MongoDB: ${DATABASE_NAME}`);
  return { type: "mongodb", db: mongoose.connection.db as unknown as Db };
}

export function getDb(): Db {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError(500, ErrorCode.DATABASE_NOT_INITIALIZED, "Database not initialized. Call connectDatabase() first.");
  }
  return mongoose.connection.db as unknown as Db;
}
