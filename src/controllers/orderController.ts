import { Request, Response } from "express";
import { AppError } from "../utils/appError.js";
import Order from "../models/order.model.js";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import Cart from "../models/cart.model.js";

/**
 * @desc    Create a new order from user's cart
 * @route   POST /api/v1/orders
 * @access  Private (User must be logged in)
 */
export const createOrder = async (req: CustomRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("You are not authorized!", 401);
  }
  // Find user cart with related product data
};
