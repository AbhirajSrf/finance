import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";
import { analystRoute } from "../middleware/analyst.middleware.js";
import {
  getAllTransactions,
  getTransactionById,
  getTransactionSummary,
  getDashboardData,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

const router = express.Router();

// All logged in users
router.get("/dashboard", protectRoute, getDashboardData);

// Analyst + Admin only
router.get("/", protectRoute, analystRoute, getAllTransactions);
router.get("/summary", protectRoute, analystRoute, getTransactionSummary);
router.get("/:id", protectRoute, analystRoute, getTransactionById);

// Admin only
router.post("/", protectRoute, adminRoute, createTransaction);
router.patch("/:id", protectRoute, adminRoute, updateTransaction);
router.delete("/:id", protectRoute, adminRoute, deleteTransaction);

export default router;
