# Shop API

A high-performance, scalable E-commerce REST API built with **Node.js**, **Express**, and **TypeScript**. Features include MongoDB ACID transactions and Redis caching (Cache-Aside pattern) for ultra-fast product delivery.

## 🚀 Features

* **ACID Transactions:** Reliable order processing using MongoDB Replica Sets.
* **Performance:** Optimized data retrieval with Redis caching.
* **Clean Architecture:** Well-structured controller-service-model pattern.
* **Documentation:** Interactive API documentation via **OpenAPI/Swagger**.
* **Observability:** Structured logging with **Winston**.
* **Containerized:** Full environment setup with Docker & Docker Compose.

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Database:** MongoDB (with Replica Set configuration)
* **Cache:** Redis
* **API Documentation:** Swagger/OpenAPI
* **Logging:** Winston
* **DevOps:** Docker, Docker Compose

## 📦 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hypnotize1/shop-api-ts.git
   cd shop-api-ts
   ```

2. **Setup environment variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Run with Docker:**
   ```bash
   docker-compose up --build
   ```

## 📖 API Documentation
Once the server is running, you can access the interactive API documentation at:
`http://localhost:3000/api-docs`

## 🤝 Contributing
Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

## 📜 License
This project is licensed under the MIT License.
