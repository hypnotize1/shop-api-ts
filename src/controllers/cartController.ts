import { Response } from "express";
import { Types } from "mongoose";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";
import { AppError } from "../utils/appError.js";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import redisClient from "../configs/redis.js";
import { syncCartToStorage } from "../utils/cartSync.js";

/**
 * @openapi
 * /cart:
 *   post:
 *     summary: Add product to Cart (Hybrid Write-Behind)
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               cartId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cart updated instantly
 *
 *   get:
 *     summary: Get user or guest cart
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: cartId
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart fetched (Redis/MongoDB)
 */
export const addItemToCart = async (req: CustomRequest, res: Response) => {
  const { productId, quantity, cartId } = req.body;
  const user = req.user;

  // Validate ID formats
  if (cartId && typeof cartId !== "string")
    throw new AppError("Invalid Cart ID format", 400);
  if (!productId || typeof productId !== "string")
    throw new AppError("Invalid Product ID format", 400);

  // 1. Fetch product from DB to ensure validity
  const product = await Product.findById(productId).lean();
  if (!product) throw new AppError("Product doesn't exist!", 404);

  // 2. Generate unique Redis cache key
  const resolvedCartId = cartId || new Types.ObjectId().toString();
  const cacheKey = user
    ? `cart:user:${user.id}`
    : `cart:guest:${resolvedCartId}`;

  // 3. Try fetching from Redis first
  let cartData: any = null;
  const cachedCart = await redisClient.get(cacheKey);

  if (cachedCart) {
    cartData = JSON.parse(cachedCart);
  } else {
    // 4. Cache Miss: Fetch from MongoDB
    const dbCart = user
      ? await Cart.findOne({ userId: user.id }).populate("items.productId")
      : await Cart.findById(resolvedCartId).populate("items.productId");

    cartData = dbCart
      ? dbCart.toObject()
      : { _id: resolvedCartId, userId: user?.id, items: [], totalPrice: 0 };
  }

  // 5. Update Cart Logic in Memory
  const itemIndex = cartData.items.findIndex(
    (el: any) => el.productId.toString() === productId.toString(),
  );
  if (itemIndex > -1) {
    cartData.items[itemIndex].quantity += quantity;
  } else {
    cartData.items.push({
      productId: new Types.ObjectId(productId),
      quantity,
      priceAtPurchase: product.price,
    });
  }

  // 6. Recalculate total price
  cartData.totalPrice = cartData.items.reduce((sum: number, item: any) => {
    return sum + item.quantity * item.priceAtPurchase;
  }, 0);

  // 7. Sync to Redis and background Sync to MongoDB
  await syncCartToStorage(
    cacheKey,
    cartData,
    user ? { userId: user.id } : { _id: resolvedCartId },
  );

  res
    .status(200)
    .json({ message: "Cart updated instantly! ⚡", data: cartData });
};

export const getCart = async (req: CustomRequest, res: Response) => {
  const cartId = req.query.cartId as string;
  const user = req.user;
  const cacheKey = user ? `cart:user:${user.id}` : `cart:guest:${cartId}`;

  // 1. Try fetching from Redis first (Cache-Aside pattern)
  if (user || cartId) {
    const cachedCart = await redisClient.get(cacheKey);
    if (cachedCart)
      return res.status(200).json({
        message: "Cart fetched from Redis!",
        data: JSON.parse(cachedCart),
      });
  }

  // 2. Fetch from MongoDB if not in Redis
  const cart = user
    ? await Cart.findOne({ userId: user.id }).populate("items.productId")
    : await Cart.findById(cartId).populate("items.productId");

  if (!cart)
    return res.status(200).json({ data: { items: [], totalPrice: 0 } });

  // 3. Update Redis cache for future requests
  if (user || cartId)
    await redisClient.setEx(cacheKey, 604800, JSON.stringify(cart));

  res.status(200).json({ status: "success", data: cart });
};

/**
 * @openapi
 * /cart/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed
 *
 *   put:
 *     summary: Update item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quantity updated
 */
export const removeItemFromCart = async (req: CustomRequest, res: Response) => {
  const { productId } = req.params;
  const cartId = req.query.cartId as string;
  const user = req.user;
  const cacheKey = user ? `cart:user:${user.id}` : `cart:guest:${cartId}`;

  // 1. Fetch cart from DB
  const cart = await (user
    ? Cart.findOne({ userId: user.id })
    : Cart.findById(cartId));
  if (!cart) throw new AppError("Cart not found", 404);

  // 2. Remove item and recalculate
  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId,
  );
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.quantity * (item.priceAtPurchase || 0),
    0,
  );

  // 3. Sync to Redis and background Sync to MongoDB
  await syncCartToStorage(
    cacheKey,
    cart.toObject(),
    user ? { userId: user.id } : { _id: cartId },
  );

  res.status(200).json({ message: "Product removed!", data: cart });
};

export const updateQuantity = async (req: CustomRequest, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const cartId = req.query.cartId as string;
  const user = req.user;
  const cacheKey = user ? `cart:user:${user.id}` : `cart:guest:${cartId}`;

  // 1. Fetch cart from DB
  const cart = await (user
    ? Cart.findOne({ userId: user.id })
    : Cart.findById(cartId));
  if (!cart) throw new AppError("Cart not found", 404);

  // 2. Update quantity and recalculate
  const item = cart.items.find(
    (item) => item.productId.toString() === productId,
  );
  if (!item) throw new AppError("Product not in cart", 404);

  item.quantity = quantity;
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.quantity * (item.priceAtPurchase || 0),
    0,
  );

  // 3. Sync to Redis and background Sync to MongoDB
  await syncCartToStorage(
    cacheKey,
    cart.toObject(),
    user ? { userId: user.id } : { _id: cartId },
  );

  res.status(200).json({ message: "Quantity updated!", data: cart });
};
