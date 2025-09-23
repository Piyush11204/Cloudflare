import express from "express";
import {
  register, login, refreshToken, logout,
  verifyEmail, forgotPassword, resetPassword
} from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateAndLock.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/verify-email", verifyEmail);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
