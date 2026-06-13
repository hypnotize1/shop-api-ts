import { Router } from "express";
import {
  requestPayment,
  verifyPayment,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/auth.middleware.js";

const paymentRouter = Router();

// 1. Request Payment (Requires login to know which user is paying)
// POST /api/v1/payment/request
paymentRouter.post("/request", protect, requestPayment);

// 2. Verify Payment (Callback from ZarinPal, no login required here)
// GET /api/v1/payment/verify
paymentRouter.get("/verify", verifyPayment);

export default paymentRouter;
