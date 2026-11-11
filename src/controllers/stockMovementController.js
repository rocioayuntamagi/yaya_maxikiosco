import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { StockMovement } from "../models/StockMovement.js";
import { getUserId } from "../utils/cashRegisterContext.js";

export const createStockMovement = async (req, res) => {
  try {
    const { product, type, quantity, reason } = req.body || {};
    if (!mongoose.isValidObjectId(product)) {
      return res.status(400).json({ message: "ID de producto inválido" });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "La cantidad debe ser un número mayor a cero" });
    }

    const exists = await Product.exists({ _id: product });
    if (!exists) return res.status(404).json({ message: "Producto no encontrado" });

    const movement = await StockMovement.create({
      product,
      type,
      quantity,
      reason,
      user: getUserId(req),
    });
    return res.status(201).json(movement);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error al registrar movimiento de stock" });
  }
};
