import type { Application } from "express";
import { Router } from "express";
import { initializeFirebase } from "@auth/firebase";
import { connectMessagingService } from "@businessLogic/messaging";
import { connectDatabase } from "@dataAccess/config/database.config";
import { setupServices } from "./services.config";
import { authRouter } from "../auth/auth.routes";
import { meRouter } from "@api/me/me.routes";
import { verificationRouter } from "@api/verifications/verification.routes";
import { albumsRouter } from "@api/albums/albums.routes";
import { worldCupAlbumRouter } from "@api/worldCupAlbum/worldCupAlbum.routes";
import { healthRouter } from "@api/health/health.routes";

export async function initializeApp(app: Application): Promise<void> {
  const messagingService = await connectMessagingService();
  initializeFirebase();
  const connection = await connectDatabase();
  setupServices(connection, messagingService);
  await seedData();
  registerRoutes(app);
}

async function seedData(): Promise<void> {
  const { services } = await import("./services.config");
  await services.permissionService.seedPermissions();
}

function registerRoutes(app: Application): void {
  const api = Router();
  api.use("/health", healthRouter);
  api.use("/auth", authRouter);
  api.use("/me", meRouter);
  api.use("/verifications", verificationRouter);
  api.use("/albums", albumsRouter);
  api.use("/world-cup-2026", worldCupAlbumRouter);
  app.use("/api", api);
}
