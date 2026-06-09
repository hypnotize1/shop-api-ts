import { Schema, model } from "mongoose";
import { IProduct } from "../interfaces/product.interface.js";

// Create a Schema corresponding to the document interface.
const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

// Create and export Model
const Product = model<IProduct>("Product", productSchema);
export default Product;
