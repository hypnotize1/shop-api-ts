import Router from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
} from "../controllers/productController.js";
import { admin, protect } from "../middlewares/auth.middleware.js";

const productRouter = Router();

// Main product routes
productRouter
  .route("/")
  .post(protect, admin, createProduct)
  .get(getAllProducts);

// Routes related to slug
productRouter
  .route("/:slug")
  .get(getProductBySlug)
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, updateProduct);

export default productRouter;
