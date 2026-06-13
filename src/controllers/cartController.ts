import { Response } from "express";
import Product from "../models/product.model.js";
import { AppError } from "../utils/appError.js";
import Cart from "../models/cart.model.js";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import { Types } from "mongoose";

/**
 * @desc    Add product to Cart (Supports both Authenticated and Guest users)
 * @route   POST /api/v1/cart
 * @access  Public
 */
export const addItemToCart = async (req: CustomRequest, res: Response) => {
  const { productId, quantity, cartId } = req.body;

  // Check cartId type
  if (cartId && typeof cartId !== "string") {
    throw new AppError("Invalid Cart ID format", 400);
  }

  // Check ProductId type
  if (!productId || typeof productId !== "string") {
    throw new AppError("Invalid Product ID format", 400);
  }

  // 1. Check if the product exists in the database
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product doesn't exist!", 404);
  }

  const user = req.user;
  let cart;

  // 2. Fetch the cart based on user authentication status
  if (user) {
    cart = await Cart.findOne({ userId: user.id }).populate("items.productId");
  } else {
    if (cartId) {
      cart = await Cart.findById(cartId).populate("items.productId");
      if (!cart) {
        throw new AppError(
          "Your cart session has expired or been deleted!",
          404,
        );
      }
    }
  }

  // 3. Scenario A: If no cart exists, create a new one
  if (!cart) {
    if (user) {
      cart = await Cart.create({
        userId: user.id,
        items: [{ productId: product.id, quantity }],
      });
    } else {
      cart = await Cart.create({
        items: [{ productId: product.id, quantity }],
      });
    }

    // Calculate initial total price for the new cart
    cart.totalPrice = quantity * product.price;
    await cart.save();
    return res
      .status(201)
      .json({ message: "Product added successfully!", data: cart });
  }

  // 4. Scenario B: If cart exists, check if the product is already in the cart
  const item = cart.items.find((el) => el.productId.equals(productId));

  if (item) {
    // If product exists, increase its quantity
    item.quantity += quantity;
  } else {
    // If product is new, push it to the items array
    cart.items.push({
      productId: new Types.ObjectId(productId),
      quantity,
    });
  }

  // 5. Recalculate the total price of the cart using reduce
  cart.totalPrice = cart.items.reduce((sum, item) => {
    const productInfo = item.productId as any;
    // Fallback to initial product price if item is newly pushed and not populated yet
    const price = productInfo?.price || product.price;
    return sum + item.quantity * price;
  }, 0);

  // 6. Save the updated cart to the database
  await cart.save();

  // 7. Send successful response back to the client
  res.status(200).json({ message: "Cart updated successfully!", data: cart });
};

/**
 * @desc    Get current user or guest cart
 * @route   GET /api/v1/cart
 * @access  Public (With Optional Authentication)
 */
export const getCart = async (req: CustomRequest, res: Response) => {
  if (req.query.cartId && typeof req.query.cartId !== "string") {
    throw new AppError("Invalid Cart ID format", 400);
  }

  // 1. Extract cartId from query parameters for guest users
  const cartId = req.query.cartId;
  const user = req.user;

  let cart;

  // 2. Fetch the cart based on authentication status
  if (user) {
    // Write the mongoose code to find cart by userId and populate items.productId
    cart = await Cart.findOne({ userId: user.id }).populate("items.productId");
  } else {
    // Write the mongoose code to find cart by cartId and populate items.productId
    cart = await Cart.findById(cartId).populate("items.productId");
    if (!cart) {
      throw new AppError("Your cart session has expired or been deleted!", 404);
    }
  }

  // 3. If no cart exists in the database, return a mock empty cart structure
  if (!cart) {
    return res.status(200).json({
      status: "success",
      data: {
        items: [],
        totalPrice: 0,
      },
    });
  }

  // 4. If cart exists, return the actual database document
  return res.status(200).json({
    status: "success",
    data: cart,
  });
};

/**
 * @desc    Remove specific item from cart
 * @route   DELETE /api/v1/cart/:productId
 * @access  Public (With Optional Authentication)
 */
export const removeItemFromCart = async (req: CustomRequest, res: Response) => {
  if (
    (req.query.cartId && typeof req.query.cartId !== "string") ||
    typeof req.params.productId !== "string"
  ) {
    throw new AppError("Invalid Cart/ProductID format", 400);
  }
  // 1. Get productId from params and cartId from query
  const productId = req.params.productId;
  const cartId = req.query.cartId;
  const user = req.user;

  let cart;

  // 2.Fetch the cart
  if (user) {
    // Write the mongoose code to find cart by userId and populate items.productId
    cart = await Cart.findOne({ userId: user.id }).populate("items.productId");
  } else {
    // Write the mongoose code to find cart by cartId and populate items.productId
    if (cartId) {
      cart = await Cart.findById(cartId).populate("items.productId");
    } else {
      throw new AppError("Cart ID is required for guest users!", 400);
    }
  }

  if (!cart) {
    throw new AppError("Your cart session has expired or been deleted!", 404);
  }

  // 3. Remove the item from the cart.items array
  cart.items = cart.items.filter((e) => {
    const currentProductId = e.productId as any;
    return !currentProductId.equals(productId);
  });

  // 4. Recalculate totalPrice and save cart
  cart.totalPrice = cart.items.reduce((total, item) => {
    const product = item.productId as any;
    return total + product.price * item.quantity;
  }, 0);

  await cart.save();

  // Send response
  res
    .status(200)
    .json({ message: "Product removed successfully!", data: cart });
};

/**
 * @desc   Update cart item quantity
 * @route  PUT /api/v1/cart/:productId
 * @access Public (With Optional Authentication)
 */
export const updateQuantity = async (req: CustomRequest, res: Response) => {
  // Validate id's type
  if (
    (req.query.cartId && typeof req.query.cartId !== "string") ||
    typeof req.params.productId !== "string"
  ) {
    throw new AppError("Invalid Cart/ProductID ID format", 400);
  }

  // 1. Get IDs and the new quantity
  const productId = req.params.productId;
  const cartId = req.query.cartId;
  const { quantity } = req.body;
  const user = req.user;

  // Validate quantity
  if (!quantity || quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  let cart;

  // 2.Fetch the cart
  if (user) {
    // Write the mongoose code to find cart by userId and populate items.productId
    cart = await Cart.findOne({ userId: user.id }).populate("items.productId");
  } else {
    // Write the mongoose code to find cart by cartId and populate items.productId
    if (cartId) {
      cart = await Cart.findById(cartId).populate("items.productId");
    } else {
      throw new AppError("Cart ID is required for guest users!", 400);
    }
  }

  if (!cart) {
    throw new AppError("Your cart session has expired or been deleted!", 404);
  }

  // 3. Find the specific item index in the cart
  const itemIndex = cart.items.findIndex((e) => {
    const currentProductId = e.productId as any;
    return currentProductId.equals(productId);
  });

  // Guart Clause: If product is not in the cart array
  if (itemIndex === -1) {
    throw new AppError("Product not found in your cart!", 404);
  }

  // 4. Update the quantity of that specific item
  cart.items[itemIndex].quantity = quantity;

  // 5. Recalculate totalPrice
  cart.totalPrice = cart.items.reduce((total, item) => {
    const product = item.productId as any;
    return total + product.price * item.quantity;
  }, 0);

  // 6. Save and send response
  await cart.save();

  res.status(200).json({
    message: "Cart updated successfully!",
    data: cart,
  });
};
