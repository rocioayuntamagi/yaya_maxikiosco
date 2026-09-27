import { Sale } from "../models/Sale.js";
import { Customer } from "../models/Customer.js";
import { Payment } from "../models/Payment.js";
import { registerDebtPayment, currentDebt } from "../services/payment.service.js";
import { getUserId } from "../utils/cashRegisterContext.js";

/** Ventas fiadas pendientes de un cliente + saldo real. */
export const getDebtByCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const sales = await Sale.find({
      customer: id,
      paymentMethod: "fiado",
      creditSettled: false,
      cancelled: { $ne: true },
    })
      .populate("products.product", "name")
      .sort({ createdAt: -1 });

    const items = sales.map((s) => ({
      saleId: s._id,
      date: s.createdAt,
      products: s.products.map((p) => ({
        name: p.product?.name || "Producto eliminado",
        quantity: p.quantity,
        price: p.price,
        subtotal: p.price * p.quantity,
      })),
      total: s.total,
    }));

    const payments = await Payment.find({
      customer: id,
      cancelled: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      items,
      // Suma de ventas fiadas sin cobrar
      total: items.reduce((acc, i) => acc + i.total, 0),
      // Deuda real: puede ser menor si hubo pagos parciales a cuenta
      balance: customer.balance,
      debt: currentDebt(customer),
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo deudas", error });
  }
};

/** Cobra una venta fiada completa. No borra la venta: la marca cobrada. */
export const markSaleAsPaid = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { paymentMethod } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: "Venta no encontrada" });

    const result = await registerDebtPayment({
      customerId: sale.customer,
      amount: sale.total,
      paymentMethod,
      saleId,
      settleSale: true,
      userId: getUserId(req),
    });

    res.json({
      message: "Venta fiada pagada",
      payment: result.payment,
      newBalance: result.newBalance,
      remainingDebt: result.remainingDebt,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Error al pagar deuda" });
  }
};

/** Pago parcial a cuenta, sin asociar a una venta puntual. */
export const partialPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;

    const result = await registerDebtPayment({
      customerId: id,
      amount,
      paymentMethod,
      userId: getUserId(req),
    });

    res.json({
      message: "Pago parcial registrado",
      payment: result.payment,
      newBalance: result.newBalance,
      remainingDebt: result.remainingDebt,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Error en pago parcial" });
  }
};