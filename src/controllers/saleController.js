import { Sale } from "../models/Sale.js";
import { Product } from "../models/Product.js";
import { Customer } from "../models/Customer.js";
import { requireOpenCashRegister, getUserId } from "../utils/cashRegisterContext.js";
// ⛔ eliminado: import Debt from "../models/Debt.js";

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

    // Validar stock y calcular total ANTES de tocar la base
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

    // Recién ahora descontamos stock
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

    // Fiado: la venta ES la deuda. No hay colección Debt.
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