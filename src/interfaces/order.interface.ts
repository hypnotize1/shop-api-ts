import { Document, Types } from "mongoose";

interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

interface IPaymentDetails {
  transactionId?: string;
  authority?: string;
  gatewayStatus?: string;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  paymentDetails: IPaymentDetails;
  shippingAddress: string;
}
