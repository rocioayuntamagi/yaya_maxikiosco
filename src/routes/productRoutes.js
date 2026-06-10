import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  searchProducts,
  advancedSearchProducts
} from "../controllers/productController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/search/advanced", advancedSearchProducts);
router.get("/barcode/:code", getProductByBarcode); 
router.get("/:id", getProductById);

router.post("/", protect, (req, res, next) => {
  console.log("📥 LLEGÓ POST /api/products");
  next();
}, createProduct);


// Rutas protegidas (solo usuarios logueados)
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
