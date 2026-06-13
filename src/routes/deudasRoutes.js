import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getDebtByCustomer,
  markSaleAsPaid,
  partialPayment
} from "../controllers/deudasController.js";

const router = express.Router();

router.get("/:id", protect, getDebtByCustomer);
router.put("/pagar/:saleId", protect, markSaleAsPaid);
router.post("/pago-parcial/:id", protect, partialPayment);

export default router;
