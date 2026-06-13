// utils/cartSync.ts
import redisClient from "../configs/redis.js";
import Cart from "../models/cart.model.js";

/**
 * Syncs cart data to Redis and updates MongoDB in the background.
 * @param cacheKey - The unique Redis key for the cart
 * @param cartData - The cart object to be stored
 * @param query - The MongoDB query object to find the cart
 */
export const syncCartToStorage = async (
  cacheKey: string,
  cartData: any,
  query: any,
) => {
  // 1. Update Redis (Instant)
  // 604800 seconds = 7 days
  await redisClient.setEx(cacheKey, 604800, JSON.stringify(cartData));

  // 2. Background Sync to MongoDB (Write-Behind pattern)
  Cart.findOneAndUpdate(
    query,
    { $set: cartData },
    { upsert: true, new: true },
  ).catch((err) => {
    console.error("Background MongoDB Sync Error:", err);
  });
};
