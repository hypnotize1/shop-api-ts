import { Schema, model, Types } from "mongoose";
import { IOrder } from "../interfaces/order.interface.js";

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, min: 1, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
    },
  },
  { timestamps: true },
);

const Order = model<IOrder>("Order", orderSchema);
export default Order;
