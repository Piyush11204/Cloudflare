import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import morgan from 'morgan';
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
};

dotenv.config();
const app = express();

// Middleware - Apply CSP BEFORE error handler
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());

// Content Security Policy - MOVED BEFORE error handler
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://checkout.razorpay.com",
        "https://www.google.com",
        "https://www.gstatic.com",
        "https://recaptcha.google.com",
      ],
      scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://checkout.razorpay.com",
        "https://www.google.com",
        "https://www.gstatic.com",
        "https://recaptcha.google.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://www.google.com",
        "https://fonts.googleapis.com",
      ],
      connectSrc: [
        "'self'",
        'https://velvikx-com.onrender.com',
        'https://api.razorpay.com',
        'https://www.google.com',
        'https://recaptcha.google.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'https://www.google.com',
        'https://www.gstatic.com',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://fonts.googleapis.com',
      ],
      frameSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
        "https://www.google.com",
        "https://recaptcha.google.com",
      ],
      reportUri: '/csp-report',
    },
  })
);

// CSP violation report endpoint
app.use('/csp-report', express.json({ type: ['application/csp-report', 'application/json'] }));
app.post('/csp-report', (req, res) => {
  console.warn('CSP Violation: ', req.body);
  res.status(204).end();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, try again later." },
});
app.use(limiter);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Error handler - MOVED AFTER CSP
app.use(errorHandler);

// Serve frontend static files (Vite build)
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all to serve index.html for SPA routes (only for non-API routes)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

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
