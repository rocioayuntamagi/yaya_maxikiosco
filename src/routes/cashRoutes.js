import express from "express";
import {
  openCashRegister,
  closeCashRegister,
  getCashStatus
} from "../controllers/cashController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", protect, getCashStatus); // ⭐ nuevo
router.post("/open", protect, openCashRegister);
router.post("/close", protect, closeCashRegister);

export default router;