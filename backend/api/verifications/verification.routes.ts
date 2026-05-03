import { Router } from "express";
import {
	createVerification,
	createResetPasswordVerification,
	verifyResetPassword,
	verifyEmailValidation,
} from "./verification.controller";

const router = Router();

router.post("", createVerification);
router.post("/reset-password", createResetPasswordVerification);
router.patch("/:id/verify-email", verifyEmailValidation);
router.patch("/reset-password/:token", verifyResetPassword);

export { router as verificationRouter };
