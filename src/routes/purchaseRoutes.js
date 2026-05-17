import express from "express";
import {
  createPurchase,
  getPurchases
} from "../controllers/purchaseController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas protegidas
router.post("/", protect, createPurchase);
router.get("/", protect, getPurchases);

export default router;
