import { Sale } from "../models/Sale.js";
import { Product } from "../models/Product.js";
import { Customer } from "../models/Customer.js";
import { requireOpenCashRegister, getUserId } from "../utils/cashRegisterContext.js";

// ===============================
// 📌 Obtener todas las ventas
// ===============================
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("products.product")
      .populate("customer");

    res.json(sales);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener ventas",
      error: error.message,
    });
  }
};

// ===============================
// 📌 Obtener ventas del día
// ===============================
export const getSalesToday = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate("products.product")
      .populate("customer");

    res.json(sales);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener ventas del día",
      error: error.message,
    });
  }
};

// ===============================
// 📌 Registrar una venta
// ===============================
export const createSale = async (req, res) => {
  try {
    const { products, paymentMethod, customer: customerId } = req.body;

    if (!products?.length) {
      return res.status(400).json({ message: "La venta debe tener productos" });
    }

    // Regla: no se vende sin caja abierta
    const cash = await requireOpenCashRegister();

    let customer = null;
    if (paymentMethod === "fiado") {
      if (!customerId) {
        return res
          .status(400)
          .json({ message: "El fiado requiere un cliente" });
      }
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
    }

    // Validar stock y calcular total
    let total = 0;
    const validated = [];

    for (const item of products) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      if (prod.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Stock insuficiente para ${prod.name}` });
      }
      total += item.quantity * item.price;
      validated.push({ prod, quantity: item.quantity });
    }

    total = Math.round(total * 100) / 100;

    // Límite de crédito (0 = sin límite)
    if (customer && customer.creditLimit > 0) {
      const debtAfter = -(customer.balance - total);
      if (debtAfter > customer.creditLimit) {
        return res.status(400).json({
          message: `Supera el límite de crédito del cliente ($${customer.creditLimit})`,
        });
      }
    }

    // Descontar stock
    for (const { prod, quantity } of validated) {
      prod.stock -= quantity;
      await prod.save();
    }

    const sale = await Sale.create({
      products,
      total,
      paymentMethod,
      customer: paymentMethod === "fiado" ? customerId : null,
      creditSettled: false,
      cashRegister: cash._id,
      user: getUserId(req),
    });

    // Fiado: la venta es la deuda
    if (paymentMethod === "fiado") {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { balance: -total },
      });
    }

    return res.status(201).json({ message: "Venta registrada", sale });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Error al registrar venta",
    });
  }
};
