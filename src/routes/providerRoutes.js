import express from "express";
import {
  createProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider
} from "../controllers/providerController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas
router.get("/", getProviders);
router.get("/:id", getProviderById);

// Rutas protegidas
router.post("/", protect, createProvider);
router.put("/:id", protect, updateProvider);
router.delete("/:id", protect, deleteProvider);

export default router;
