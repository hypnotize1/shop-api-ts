import { Router } from "express";
import {
  addItemToCart,
  getCart,
  removeItemFromCart,
} from "../controllers/cartController.js";
import { optionalProtect } from "../middlewares/auth.middleware.js";

const cartRouter = Router();

cartRouter.post("/", optionalProtect, addItemToCart);
cartRouter.get("/", optionalProtect, getCart);
cartRouter.delete("/:productId", optionalProtect, removeItemFromCart);

export default cartRouter;
