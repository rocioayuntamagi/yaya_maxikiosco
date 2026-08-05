import express from "express";
import { addDebt } from "../controllers/debtController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/agregar", protect, addDebt);

export default router;
