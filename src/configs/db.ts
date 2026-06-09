import mongoose from "mongoose";

export const connectDB = async () => {
  // Connection to db
  try {
    const db = await mongoose.connect("mongodb://database:27017/shop-db");
    console.log(`mongoDB connected to: ${db.connection.name}`);
    // Emit an event when the connection is successful
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
