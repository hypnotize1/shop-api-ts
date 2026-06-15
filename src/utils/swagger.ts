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
          required: ["name", "email", "age"],
          properties: {
            _id: {
              type: "string",
              example: "686c6c5f5e7d8b0012345678",
            },
            name: {
              type: "string",
              example: "Ali Ahmadi",
            },
            email: {
              type: "string",
              format: "email",
              example: "ali@example.com",
            },
            age: {
              type: "number",
              example: 25,
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              example: "user",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        Product: {
          type: "object",
          required: ["title", "price", "stock", "slug"],
          properties: {
            _id: {
              type: "string",
              example: "65f1c9a7b4d2c1a1d8e9f123",
            },
            title: {
              type: "string",
              example: "iPhone 15 Pro",
            },
            price: {
              type: "number",
              example: 75000000,
            },
            stock: {
              type: "number",
              example: 10,
            },
            slug: {
              type: "string",
              example: "iphone-15-pro",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        Cart: {
          type: "object",
          required: ["items", "totalPrice"],
          properties: {
            _id: {
              type: "string",
              example: "65f1c9a7b4d2c1a1d8e9f123",
            },
            userId: {
              type: "string",
            },

            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "number", example: 2 },
                  priceAtPurchase: { type: "number", example: 1500000 },
                },
              },
            },
            totalPrice: {
              type: "number",
              example: 3000000,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-01-01T12:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2025-01-02T12:00:00.000Z",
            },
          },
        },

        Order: {
          type: "object",
          required: [
            "userId",
            "items",
            "totalPrice",
            "status",
            "shippingAddress",
          ],
          properties: {
            _id: {
              type: "string",
              example: "65f1c9a7b4d2c1a1d8e9f123",
            },
            userId: {
              type: "string",
            },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "quantity", "price"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "number" },
                  price: { type: "number" },
                },
              },
            },
            totalPrice: {
              type: "number",
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
            },
            paymentDetails: {
              type: "object",
              properties: {
                transactionId: { type: "string" },
                authority: { type: "string" },
                gatewayStatus: { type: "string" },
              },
            },
            shippingAddress: {
              type: "string",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
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
  },
  apis: ["./src/controllers/*.ts", "./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
