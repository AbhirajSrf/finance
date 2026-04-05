import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { login, logout, signup } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protectRoute, logout);
router.get("/check", protectRoute, (req, res) =>
  res.status(200).json(req.user)
);

export default router;
