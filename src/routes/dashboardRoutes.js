import express from "express";
import { getDailySummary, getWeeklySummary } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/today", protect, getDailySummary);
router.get("/week", protect, getWeeklySummary);

export default router;
