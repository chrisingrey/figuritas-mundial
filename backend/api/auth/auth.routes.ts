import { Router } from "express";
import { userAuthenticationFilter } from "@api/common/filters/userAuthenticationFilter";
import {
	register,
	login,
	verifyTwoFactor,
	setupTwoFactor,
	enableTwoFactor,
} from "./auth.controller";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/2fa/verify", verifyTwoFactor);
router.post("/2fa/setup", userAuthenticationFilter, setupTwoFactor);
router.post("/2fa/enable", userAuthenticationFilter, enableTwoFactor);

export { router as authRouter };
