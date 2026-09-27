import { Payment } from "../models/Payment.js";
import { Customer } from "../models/Customer.js";
import { Sale } from "../models/Sale.js";
import { requireOpenCashRegister } from "../utils/cashRegisterContext.js";

export const VALID_PAYMENT_METHODS = [
  "efectivo",
  "debito",
  "credito",
  "transferencia",
  "mercadopago",
];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const fail = (message, status = 400, code = "PAYMENT_ERROR") => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  throw err;
};

/** Deuda vigente del cliente (positiva). balance negativo = debe. */
export const currentDebt = (customer) =>
  customer.balance < 0 ? round2(-customer.balance) : 0;

/**
 * Registra un cobro de fiado. Único lugar del sistema que mueve
 * customer.balance en sentido positivo y crea documentos Payment.
 */
export async function registerDebtPayment({
  customerId,
  amount,
  paymentMethod,
  saleId = null,
  settleSale = false,
  userId = null,
}) {
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    fail("Método de pago inválido", 400, "INVALID_PAYMENT_METHOD");
  }

  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) {
    fail("Monto de pago inválido", 400, "INVALID_AMOUNT");
  }

  // Regla: no se cobra sin caja abierta, así el pago queda atado al turno
  const cash = await requireOpenCashRegister();

  const customer = await Customer.findById(customerId);
  if (!customer) fail("Cliente no encontrado", 404, "CUSTOMER_NOT_FOUND");

  const debt = currentDebt(customer);
  if (debt <= 0) fail("El cliente no tiene deuda pendiente", 400, "NO_DEBT");
  if (value > debt) {
    fail(
      `El monto excede la deuda vigente ($${debt})`,
      400,
      "AMOUNT_EXCEEDS_DEBT"
    );
  }

  let sale = null;
  if (saleId) {
    sale = await Sale.findById(saleId);
    if (!sale) fail("Venta no encontrada", 404, "SALE_NOT_FOUND");
    if (sale.paymentMethod !== "fiado") {
      fail("La venta no es fiada", 400, "SALE_NOT_CREDIT");
    }
    if (sale.creditSettled) {
      fail("La venta ya fue cobrada", 409, "SALE_ALREADY_SETTLED");
    }
    if (sale.cancelled) fail("La venta está anulada", 400, "SALE_CANCELLED");
  }

  const payment = await Payment.create({
    customer: customer._id,
    amount: value,
    paymentMethod,
    sale: sale?._id || null,
    cashRegister: cash._id,
    user: userId,
  });

  // $inc atómico: evita perder pagos concurrentes
  const updated = await Customer.findByIdAndUpdate(
    customer._id,
    { $inc: { balance: value } },
    { new: true }
  );

  if (sale && settleSale) {
    sale.creditSettled = true;
    sale.settledAt = new Date();
    await sale.save();
  }

  return {
    payment,
    newBalance: round2(updated.balance),
    remainingDebt: currentDebt(updated),
  };
}