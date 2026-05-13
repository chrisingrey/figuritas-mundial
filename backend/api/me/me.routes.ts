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
  getMyInvitations,
  leaveMyViewerAlbum,
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
router.delete("/albums/:albumId", leaveMyViewerAlbum);
router.get("/invitations", getMyInvitations);

export { router as meRouter };
