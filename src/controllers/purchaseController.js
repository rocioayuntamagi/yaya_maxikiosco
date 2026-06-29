import { Purchase } from "../models/Purchase.js";
import { Product } from "../models/Product.js";

export const createPurchase = async (req, res) => {
  try {
    const { provider, items, total, date } = req.body;

    // Crear compra multiproducto
    const purchase = await Purchase.create({
      provider,
      items,
      total,
      date,
    });

    // Actualizar stock de cada producto
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    res.status(201).json({
      message: "Compra registrada correctamente",
      purchase,
    });

  } catch (error) {
    res.status(500).json({ message: "Error al registrar compra", error });
  }
};

// Obtener todas las compras
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("provider")
      .populate("product");

    res.json(purchases);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener compras", error });
  }
};

export const getPurchasesByProvider = async (req, res) => {
  try {
    const purchases = await Purchase.find({ provider: req.params.id })
      .populate("items.product", "name")
      .sort({ date: -1 });

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener compras", error });
  }
};


export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("provider", "name")
      .populate("items.product", "name");

    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener compra", error });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    // Revertir stock
    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Eliminar compra
    await purchase.deleteOne();

    res.json({ message: "Compra eliminada correctamente" });

  } catch (error) {
    res.status(500).json({ message: "Error al eliminar compra", error });
  }
};
