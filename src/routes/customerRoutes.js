import express from "express";
import {
  createCustomer,
  getCustomers,
  customerAccount
} from "../controllers/customerController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createCustomer);
router.get("/", protect, getCustomers);
router.get("/:id/account", protect, customerAccount);

export default router;
