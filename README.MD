# 🧩 Yaya Backend — API del Sistema de Caja (POS)

Este backend provee la API completa para el sistema de caja del maxikiosco familiar.  
Incluye gestión de productos, ventas, clientes, proveedores y lógica de POS profesional.

---

## 🚀 Tecnologías principales
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Arquitectura MVC
- Middlewares personalizados
- Validaciones y manejo de errores

---

## 📦 Funcionalidades
### ✔ Productos
- CRUD completo
- Búsqueda por nombre
- Control de stock

### ✔ Ventas (POS)
- Registro de ventas con múltiples medios de pago:
  - Efectivo
  - Débito
  - Crédito (cuotas + interés)
  - Transferencia
  - Mercado Pago
  - Fiado (cuenta corriente)
- Ticket térmico generado desde frontend
- Auditoría de usuario

### ✔ Clientes
- Registro
- Cuenta corriente
- Deudas y pagos

### ✔ Proveedores
- Gestión básica

---

## 🛠 Scripts
```bash
npm install
npm run dev
