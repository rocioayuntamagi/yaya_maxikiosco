import express from "express";
import { createStockMovement, getStockMovements } from "../controllers/stockMovementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getStockMovements);
router.post("/", protect, createStockMovement);

export default router;
