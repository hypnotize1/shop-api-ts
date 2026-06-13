import { Types, Document } from "mongoose";

interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  priceAtPurchase: number;
}

export interface ICart extends Document {
  userId?: Types.ObjectId;
  items: ICartItem[];
  totalPrice: number;
}
