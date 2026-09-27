// utils/cashRegisterContext.js
import { CashRegister } from "../models/CashRegister.js";

export class NoOpenCashRegisterError extends Error {
  constructor(message = "No hay una caja abierta") {
    super(message);
    this.name = "NoOpenCashRegisterError";
    this.status = 409;
    this.code = "CASH_REGISTER_NOT_OPEN";
  }
}

/** Devuelve la caja abierta o lanza 409. */
export const requireOpenCashRegister = async () => {
  const cash = await CashRegister.findOpen();
  if (!cash) throw new NoOpenCashRegisterError();
  return cash;
};

/** Id del usuario autenticado, tolerante al payload del JWT. */
export const getUserId = (req) => req.user?.id || req.user?._id || null;