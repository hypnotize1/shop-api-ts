import express, { Application, Request, Response } from "express";
import productRouter from "./routes/productRoutes.js";
import { connectDB } from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import dotenv from "dotenv";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import cartRouter from "./routes/cartRoutes.js";

const app: Application = express();
const port: number = 3000; // The port your express server will be running on.

// Load env
dotenv.config();

// Database connection
connectDB();

/**
 * @desc    Global Middlewares
 */
// Parse URL-encoded bodies (HTML forms)
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (API payloads)
app.use(express.json());

/**
 * @desc    Routes Mount
 */
app.use("/api/v1/products", productRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/cart", cartRouter);

app.use(globalErrorHandler);

// Base health check route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Typescript + Express!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
