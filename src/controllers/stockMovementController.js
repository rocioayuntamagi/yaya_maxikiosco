import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { StockMovement } from "../models/StockMovement.js";
import { getUserId } from "../utils/cashRegisterContext.js";

export const getStockMovements = async (req, res) => {
  const { product } = req.query;
  if (product !== undefined && (typeof product !== "string" || !mongoose.isValidObjectId(product))) {
    return res.status(400).json({ message: "ID de producto inválido" });
  }

  try {
    const movements = await StockMovement.find(product ? { product } : {})
      .select("product type quantity reason user createdAt")
      .populate("product", "name")
      .populate("user", "name")
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return res.json(movements);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener movimientos de stock" });
  }
};

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

    const movementData = {
      product,
      type,
      quantity,
      reason,
      user: getUserId(req),
    };
    await new StockMovement(movementData).validate();

    const delta = type === "ingreso" || type === "ajuste_positivo" ? quantity : -quantity;
    const movement = await mongoose.connection.transaction(async (session) => {
      const updated = await Product.findOneAndUpdate(
        { _id: product, stock: { $gte: -delta } },
        { $inc: { stock: delta } },
        { new: true, session }
      );
      if (!updated) {
        const stillExists = await Product.exists({ _id: product }).session(session);
        const error = new Error(stillExists ? "Stock insuficiente para registrar el movimiento" : "Producto no encontrado");
        error.status = stillExists ? 409 : 404;
        throw error;
      }

      const [record] = await StockMovement.create([movementData], { session });
      return record;
    });
    return res.status(201).json(movement);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error al registrar movimiento de stock" });
  }
};
