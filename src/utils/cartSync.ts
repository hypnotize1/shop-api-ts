// utils/cartSync.ts
import redisClient from "../configs/redis.js";
import Cart from "../models/cart.model.js";
import logger from "./logger.js";

export const syncCartToStorage = async (
  cacheKey: string,
  cartData: any,
  query: any,
) => {
  try {
    // 1. Update Redis
    await redisClient.setEx(cacheKey, 604800, JSON.stringify(cartData));
  } catch (err) {
    logger.error("Redis Sync Error", { cacheKey, error: err });
    throw err;
  }

  // 2. Background Sync to MongoDB
  Cart.findOneAndUpdate(query, { $set: cartData }, { upsert: true, new: true })
    .then(() =>
      logger.info(`Cart successfully synced to MongoDB for ${cacheKey}`),
    )
    .catch((err) => {
      logger.error("Background MongoDB Sync Failed", { query, error: err });
    });
};
