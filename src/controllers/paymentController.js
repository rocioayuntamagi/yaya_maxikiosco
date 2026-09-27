import { registerDebtPayment } from "../services/payment.service.js";
import { getUserId } from "../utils/cashRegisterContext.js";

export const registerPayment = async (req, res) => {
  try {
    const { customer, amount, paymentMethod = "efectivo", saleId } = req.body;

    const result = await registerDebtPayment({
      customerId: customer,
      amount,
      paymentMethod,
      saleId: saleId || null,
      settleSale: Boolean(saleId),
      userId: getUserId(req),
    });

    res.status(201).json({
      message: "Pago registrado",
      payment: result.payment,
      newBalance: result.newBalance,
      remainingDebt: result.remainingDebt,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Error al registrar pago" });
  }
};