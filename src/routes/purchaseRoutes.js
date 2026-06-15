import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchasesByProvider,
  getPurchaseById 
} from "../controllers/purchaseController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas protegidas
router.post("/", protect, createPurchase);
router.get("/", protect, getPurchases);
router.get("/provider/:id", protect, getPurchasesByProvider);
router.get("/:id", protect, getPurchaseById); 

export default router;
