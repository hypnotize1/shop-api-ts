import { createClient } from "redis";

// Initialize the Redis client using the URL from environment variables
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Event listeners for monitoring the connection
redisClient.on("error", (err) => {
  console.error("Redis client Error!", err);
});

redisClient.on("connect", () => {
  console.log("Redis connected successfully!");
});

// Export a function to establish the connection
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Faild to connect to Redis:", err);
    process.exit(1);
  }
};

export default redisClient;
