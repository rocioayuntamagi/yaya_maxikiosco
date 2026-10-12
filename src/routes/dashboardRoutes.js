import express from "express";
import { getDailySummary } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/today", protect, getDailySummary);

export default router;
