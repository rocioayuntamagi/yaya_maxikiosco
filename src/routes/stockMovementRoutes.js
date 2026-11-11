import express from "express";
import { createStockMovement } from "../controllers/stockMovementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createStockMovement);

export default router;
