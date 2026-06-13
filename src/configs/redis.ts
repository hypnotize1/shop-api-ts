import { createClient } from "redis";
import logger from "../utils/logger.js";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Event listeners using our centralized logger
redisClient.on("error", (err) => {
  logger.error("Redis client Error!", { error: err });
});

redisClient.on("connect", () => {
  logger.info("Redis connected successfully!");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error("Failed to connect to Redis, shutting down...", {
      error: err,
    });
    process.exit(1);
  }
};

export default redisClient;
