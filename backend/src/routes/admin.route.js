import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";
import {
  getAllUsers,
  createUser,
  assignRole,
  updateUserStatus,
  deleteUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(protectRoute, adminRoute);

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.patch("/users/:id/role", assignRole);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

export default router;
