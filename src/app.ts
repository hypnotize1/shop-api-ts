import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./configs/db.js";
import { connectRedis } from "./configs/redis.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import productRouter from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import paymentRouter from "./routes/payment.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./utils/swagger.js";

const app: Application = express();
const port: number = 3000; // The port your express server will be running on.

// Load env
dotenv.config();

// Databases connection
connectDB();
connectRedis();

/**
 * @desc    Global Middlewares
 */
// Parse URL-encoded bodies (HTML forms)
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (API payloads)
app.use(express.json());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @desc    Routes Mount
 */
app.use("/api/v1/products", productRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payment", paymentRouter);

app.use(globalErrorHandler);

// Base health check route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Typescript + Express!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
