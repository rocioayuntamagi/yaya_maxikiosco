import express from "express";
import {
  createSale,
  getSales,
  getSalesToday
} from "../controllers/saleController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSale);
router.get("/", protect, getSales);
router.get("/today", protect, getSalesToday); // ⭐ NUEVO

export default router;
