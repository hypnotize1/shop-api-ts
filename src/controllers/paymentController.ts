import axios from "axios";
import { Response } from "express";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import Order from "../models/order.model.js";
import { AppError } from "../utils/appError.js";

// ZarinPal configuration (Should be moved to environment variables)
const MERCHANT_ID =
  process.env.ZARINPAL_MERCHANT_ID || "00000000-0000-0000-0000-000000000000";
const IS_SANDBOX = true; // Set to false for production environment
const BASE_URL = IS_SANDBOX
  ? "https://sandbox.zarinpal.com"
  : "https://api.zarinpal.com";

/**
 * @desc    Initiate payment request with ZarinPal
 * @route   POST /api/v1/payment/request
 * @access  Private
 */
export const requestPayment = async (req: CustomRequest, res: Response) => {
  const { orderId } = req.body;

  // 1. Find the order and verify ownership
  const order = await Order.findOne({ _id: orderId, userId: req.user?.id });
  if (!order) throw new AppError("Order not found!", 404);

  // 2. Request payment authority from ZarinPal
  const response = await axios.post(`${BASE_URL}/pg/v4/payment/request.json`, {
    merchant_id: MERCHANT_ID,
    amount: order.totalPrice * 10, // Convert Toman to Rial
    callback_url: `${process.env.CALLBACK_URL}/api/v1/payment/verify`,
    description: `Order #${order._id}`,
    metadata: { email: req.user?.email || "email@example.com" },
  });

  // 3. Store Authority in the order record and redirect user
  const { data } = response.data;
  if (response.data.errors.length === 0) {
    // Save authority to database to verify later
    order.paymentDetails.authority = data.authority;
    await order.save();

    const paymentUrl = `${BASE_URL}/pg/StartPay/${data.authority}`;
    res.status(200).json({ paymentUrl });
  } else {
    throw new AppError("Payment request failed!", 400);
  }
};

/**
 * @desc    Verify payment after redirecting back from ZarinPal
 * @route   GET /api/v1/payment/verify
 * @access  Public
 */
export const verifyPayment = async (req: CustomRequest, res: Response) => {
  const { Authority, Status } = req.query as {
    Authority: string;
    Status: string;
  };

  // 1. Handle payment cancellation by user
  if (Status !== "OK") {
    throw new AppError("Payment failed or cancelled by user", 400);
  }

  // 2. Locate order by the authority code
  const order = await Order.findOne({ "paymentDetails.authority": Authority });
  if (!order) throw new AppError("Order not found with this authority", 404);

  // 3. Request payment verification to ZarinPal
  const response = await axios.post(`${BASE_URL}/pg/v4/payment/verify.json`, {
    merchant_id: MERCHANT_ID,
    authority: Authority,
    amount: order.totalPrice * 10,
  });

  // 4. Check verification result
  if (response.data.data.code === 100) {
    // Payment verified: Update order status
    order.status = "paid";
    order.paymentDetails.transactionId = response.data.data.ref_id;
    await order.save();

    res.status(200).json({
      message: "Payment verified successfully!",
      refId: order.paymentDetails.transactionId,
    });
  } else {
    throw new AppError("Payment verification failed!", 400);
  }
};
