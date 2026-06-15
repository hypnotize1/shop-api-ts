import { Request, Response } from "express";
import slugify from "slugify";
import { IProduct } from "../interfaces/product.interface.js";
import Product from "../models/product.model.js";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/appError.js";
import redisClient from "../configs/redis.js";

type CreateProductRequest = CustomRequest & Request<any, any, IProduct>;

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - stock
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created
 *
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of products (Cached)
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

  // Expire products cache
  await redisClient.del("products:all");

  // Send the structured response back to the client
  res.status(201).json({ newProduct });
};

export const getAllProducts = async (req: Request, res: Response) => {
  // 1. Define a unique cache key for this specific query
  const cacheKey = "products:all";

  // 2. Query Redis to check if data already exists in memory
  const cachedProducts = await redisClient.get(cacheKey);

  // 3. Cache Hit: Data found in Redis, return it immediately
  if (cachedProducts) {
    return res.status(200).json({
      message: "Products fetched from Redis Cache!  ",
      data: JSON.parse(cachedProducts),
    });
  }

  // 4. Cache Miss: Data not found, query the primary database (MongoDB)
  const products = await Product.find();

  // 5. Store the fetched data in Redis for future requests
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(products));

  // 6. Send the response to the client
  res.status(200).json({
    message: "Products fetched successfully!",
    data: products,
  });
};

/**
 * @openapi
 * /products/{slug}:
 *   get:
 *     summary: Get single product by slug
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *
 *   put:
 *     summary: Update a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
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

  // Expire products Cache
  await redisClient.del("products:all");

  // Send response
  res.status(200).json(updatedProduct);
};

export const deleteProduct = async (req: CustomRequest, res: Response) => {
  const { slug } = req.params;

  // Find and delete product
  const deletedProduct = await Product.findOneAndDelete({ slug });

  // Check product existence
  if (!deletedProduct) {
    throw new AppError("Product not found!", 404);
  }

  // Expire products cache
  await redisClient.del("products:all");

  // Send response
  res.status(200).json({ message: "Product deleted successfully!" });
};
