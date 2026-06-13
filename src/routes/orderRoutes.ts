import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { createOrder } from "../controllers/orderController.js";

const orderRouter = Router();

orderRouter.post("/", protect, createOrder);

export default orderRouter;
