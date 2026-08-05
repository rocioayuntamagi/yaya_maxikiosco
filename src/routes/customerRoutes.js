import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  customerAccount
} from "../controllers/customerController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Crear cliente
router.post("/", protect, createCustomer);

// Listar clientes
router.get("/", protect, getCustomers);

// Obtener cliente por ID
router.get("/:id", protect, getCustomerById);

// Cuenta del cliente (deudas, compras, etc.)
router.get("/:id/account", protect, customerAccount);

// Editar cliente
router.put("/:id", protect, updateCustomer);

// Eliminar cliente
router.delete("/:id", protect, deleteCustomer);

export default router;
