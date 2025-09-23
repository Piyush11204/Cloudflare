import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

// security middlewares
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());

// rate limit globally (tweak as needed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, try again later." },
});
app.use(limiter);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// connect db and start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () => console.log(` Server running on port ${process.env.PORT || 5000}`));
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
