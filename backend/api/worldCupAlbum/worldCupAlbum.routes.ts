import { Router } from "express";
import {
  getWorldCupAlbum,
  getWorldCupStickers,
  getWorldCupTeams,
} from "./worldCupAlbum.controller";

const router = Router();

router.get("/", getWorldCupAlbum);
router.get("/teams", getWorldCupTeams);
router.get("/stickers", getWorldCupStickers);

export { router as worldCupAlbumRouter };
