import type { NextFunction, Request, Response } from "express";
import { services } from "@api/config/services.config";
import { asyncHandler } from "@api/common/middleware/asyncHandler";
import { mapWorldCupAlbumResponse } from "./WorldCupAlbumResponse";

export const getWorldCupAlbum = asyncHandler(async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(200).json(mapWorldCupAlbumResponse(services.worldCupAlbumService.getTemplate()));
});

export const getWorldCupTeams = asyncHandler(async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(200).json(services.worldCupAlbumService.getTeams());
});

export const getWorldCupStickers = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const teamCode = typeof req.query.teamCode === "string" ? req.query.teamCode : undefined;
  res.status(200).json(services.worldCupAlbumService.getStickers(teamCode));
});
