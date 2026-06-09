import mongoose, { Document, Types } from "mongoose";

interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: "pending" | "paid" | "failed";
  transactionId?: string;
}
