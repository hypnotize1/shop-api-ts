import { Router } from "express";
import {
  addItemToCart,
  getCart,
  removeItemFromCart,
  updateQuantity,
} from "../controllers/cartController.js";
import { optionalProtect } from "../middlewares/auth.middleware.js";

const cartRouter = Router();

cartRouter.post("/", optionalProtect, addItemToCart);
cartRouter.get("/", optionalProtect, getCart);
cartRouter.delete("/:productId", optionalProtect, removeItemFromCart);
cartRouter.put("/:productId", optionalProtect, updateQuantity);

export default cartRouter;
