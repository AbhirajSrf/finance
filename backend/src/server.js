import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import transactionRoutes from "./routes/transaction.route.js"; // ✅ new

const PORT = ENV.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/transactions", transactionRoutes); // ✅ new

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log("Server running on port: ", PORT));
  } catch (error) {
    console.error("Failed to connect: ", error);
    process.exit(1);
  }
}

startServer();
