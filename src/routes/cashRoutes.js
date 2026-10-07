import express from "express";
import {
  openCashRegister,
  closeCashRegister,
  getCashStatus,
  previewCashRegister,
  closeCashRegisterWithTotals,
  getCashHistory,
  getCashHistoryById
} from "../controllers/cashController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", protect, getCashStatus); // ⭐ nuevo
router.get("/preview", protect, previewCashRegister);
router.get("/history", protect, getCashHistory);
router.get("/history/:id", protect, getCashHistoryById);
router.post("/open", protect, openCashRegister);
router.post("/close", protect, closeCashRegister);
router.put("/close", protect, closeCashRegisterWithTotals);

export default router;