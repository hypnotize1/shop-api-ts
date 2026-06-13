import mongoose from "mongoose";
import { AppError } from "../utils/appError.js";

export const connectDB = async () => {
  // Connection to db
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new AppError("MONGODB_URI is not defined in the .env file!", 404);
    }

    const db = await mongoose.connect(mongoURI);
    console.log(`mongoDB connected to: ${db.connection.name}`);
    // Emit an event when the connection is successful
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};
