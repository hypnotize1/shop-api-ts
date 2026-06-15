import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Shop Api",
      version: "1.0.0",
      description:
        "A professional backend API for a high-perfomance e-commerce platform.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            age: { type: "number" },
            role: { type: "string", enum: ["user", "admin"] },
          },
        },
        Product: {
          type: "object",
          properties: {
            title: { type: "string" },
            price: { type: "number" },
            stock: { type: "number" },
            slug: { type: "string" },
          },
        },
        OrderStatus: {
          type: "string",
          enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
        },
        Order: {
          type: "object",
          properties: {
            userId: { type: "string" },
            totalPrice: { type: "number" },
            status: { $ref: "#/components/schemas/OrderStatus" },
            shippingAddress: { type: "string" },
          },
        },
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local Development Server",
      },
    ],
    apis: ["./routes/*.ts", "./controllers/*.ts"],
  },
};

export const swaggerSpec = swaggerJSDoc(options);
