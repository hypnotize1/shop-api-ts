import { Schema, model } from "mongoose";
import { ICart } from "../interfaces/cart.interface.js";

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Cart = model<ICart>("Cart", cartSchema);
export default Cart;
