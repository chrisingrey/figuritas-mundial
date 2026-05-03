import { Router } from "express";
import { userAuthenticationFilter } from "@api/common/filters/userAuthenticationFilter";
import {
  getCurrentUser,
  changePassword,
  createPassword,
  updateUserProfile,
  createNotification,
  getNotificationById,
  getPagedNotifications,
  patchNotification,
  getMyAlbums,
} from "./me.controller";

const router = Router();

router.use(userAuthenticationFilter);

router.get("", getCurrentUser);
router.patch("/profile", updateUserProfile);
router.post("/password", createPassword);
router.patch("/password", changePassword);
router.post("/notifications", createNotification);
router.get("/notifications", getPagedNotifications);
router.get("/notifications/:id", getNotificationById);
router.patch("/notifications/:id", patchNotification);
router.get("/albums", getMyAlbums);

export { router as meRouter };
