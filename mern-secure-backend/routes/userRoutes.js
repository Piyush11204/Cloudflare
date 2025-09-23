import express from "express";
import User from "../models/User.js";
import { verifyAccessTokenMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", verifyAccessTokenMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -refreshTokens");
  res.json({ user });
});

export default router;
