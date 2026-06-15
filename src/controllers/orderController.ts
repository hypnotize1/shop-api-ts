import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/appError.js";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import redisClient from "../configs/redis.js";

/**
 * @openapi
 * /orders:
 * post:
 * summary: Create a new order (ACID Transaction)
 * tags: [Order]
 * security:
 * - bearerAuth: []
 * responses:
 * 201:
 * description: Order created successfully
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Order'
 * type: object
 * properties:
 * message: { type: string }
 * data: { type: object }
 * 400: { description: "Cart is empty or stock insufficient" }
 * 401: { description: "Unauthorized" }
 */
export const createOrder = async (req: CustomRequest, res: Response) => {
  const user = req.user;

  // Ensure user is authenticated
  if (!user) {
    throw new AppError("You are not authorized!", 401);
  }

  // Initialize a MongoDB session for the transaction
  const session = await mongoose.startSession();

  try {
    let finalOrder = null;

    // Execute operations within an isolated transaction block
    // It automatically handles commit and rollback processes
    await session.withTransaction(async () => {
      // Fetch the user's cart, explicitly attaching the session
      const cart = await Cart.findOne({ userId: user.id }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new AppError("Your cart is empty", 400);
      }

      // Iterate through cart items to validate and reduce stock atomically
      for (const item of cart.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity }, // Concurrency guard: Ensure sufficient stock
          },
          {
            $inc: { stock: -item.quantity }, // Atomic decrement
          },
          { returnDocument: "after", session }, // Attach session & return updated doc
        );

        // If product is not found, it means stock is insufficient or product is deleted
        // Throwing an error here will automatically abort the entire transaction
        if (!updatedProduct) {
          throw new AppError(
            `Product with ID ${item.productId} is out of stock`,
            400,
          );
        }
      }

      // Create the order record (Note: array format is required inside transactions)
      const newOrder = await Order.create(
        [
          {
            userId: user.id,
            items: cart.items,
            totalPrice: cart.totalPrice,
            status: "pending",
          },
        ],
        { session },
      );

      // Clear the user's cart after successful order creation
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save({ session });

      await redisClient.del(`cart:user:${user.id}`);

      finalOrder = newOrder[0];
    });

    await redisClient.del("products:all");

    // Transaction successful: Send response
    res.status(201).json({
      message: "Order created successfully!",
      data: finalOrder,
    });
  } finally {
    // End the session to release resources and prevent memory leaks
    await session.endSession();
  }
};
