import { Request, Response } from "express";
import slugify from "slugify";
import { IProduct } from "../interfaces/product.interface.js";
import Product from "../models/product.model.js";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/appError.js";

type CreateProductRequest = CustomRequest & Request<any, any, IProduct>;

/**
 * @desc    Create a new product with an automated slug
 * @route   POST /api/products
 * @access  Private
 */
export const createProduct = async (
  req: CreateProductRequest,
  res: Response,
) => {
  const { title, price, stock } = req.body;

  // Check the values input
  if (
    (title ?? undefined) === undefined ||
    (price ?? undefined) === undefined ||
    (stock ?? undefined) === undefined
  ) {
    throw new AppError("Please provide all fields!", 400);
  }

  // Check the type of values
  if (
    typeof title !== "string" ||
    typeof price !== "number" ||
    typeof stock !== "number"
  ) {
    throw new AppError(
      "Invalid input types! Title must be a string, price and stock must be numbers",
      400,
    );
  }

  // Generate a URL-friendly slug from the product title
  const slug = slugify(title, { lower: true });

  // Create Product in database
  const newProduct = await Product.create({ title, price, stock, slug });

  // Send the structured response back to the client
  res.status(201).json({ newProduct });
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = async (req: Request, res: Response) => {
  // Get all products and send to client
  const products = await Product.find();
  res.status(200).json({ products });
};

/**
 * @desc    Get single product by slug
 * @route   GET /api/products/:slug
 * @access  Public
 */
type GetProductParams = { slug: string };

export const getProductBySlug = async (
  req: Request<GetProductParams>,
  res: Response,
) => {
  // Get slug field from request paramaters
  const { slug } = req.params;

  const product = await Product.findOne({ slug });
  // Check product exist
  if (!product) {
    throw new AppError("Product not found!", 404);
  } else {
    res.status(200).json(product);
  }
};

/**
 * @desc    Update a product by slug
 * @route   PUT /api/products/:slug
 * @access  Private
 */
export const updateProduct = async (req: CustomRequest, res: Response) => {
  const { slug } = req.params;

  // Find and update product
  const updatedProduct = await Product.findOneAndUpdate({ slug }, req.body, {
    returnDocument: "after",
  });

  // Check product existence
  if (!updatedProduct) {
    throw new AppError("Product not found!", 404);
  }

  // Send response
  res.status(200).json(updatedProduct);
};

/**
 * @desc    Delete a product by slug
 * @route   DELETE /api/products/:slug
 * @access  Private
 */

export const deleteProduct = async (req: CustomRequest, res: Response) => {
  const { slug } = req.params;

  // Find and delete product
  const deletedProduct = await Product.findOneAndDelete({ slug });

  // Check product existence
  if (!deletedProduct) {
    throw new AppError("Product not found!", 404);
  }

  res.status(200).json({ message: "Product deleted successfully!" });
};
