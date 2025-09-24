import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Routes
import authRoutes from "./Routes/AuthRoutes.js";
import adminRoutes from "./Routes/AdminRoutes.js";
import studentRoutes from "./Routes/StudentRoutes.js";
import wardenRoutes from "./Routes/WardenRoutes.js";
import roomRoutes from "./Routes/RoomRoutes.js";
import noticeRoutes from "./Routes/NoticeRoutes.js";
import messRoutes from "./Routes/MenuRoutes.js";
import roomAllocationRoutes from "./Routes/roomAllocationRoutes.js";

// Load environment variables
dotenv.config();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------- CORS ---------------------
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://hostel-admin-frontend.vercel.app",
  "https://hostel-booking-frontend-phi.vercel.app"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log("Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// --------------------- Middleware ---------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Handle pre-flight OPTIONS requests globally
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Serve uploaded files
app.use("/uploads", express.static(join(__dirname, "uploads")));

// --------------------- Routes ---------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/warden", wardenRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/menu", messRoutes);
app.use("/api/room-allocation", roomAllocationRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("🏨 Hostel Management System API is running...");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// --------------------- Global Error Handler ---------------------
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked the request"
    });
  }

  console.error(err); // Log error for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message
  });
});

// --------------------- DB Connection ---------------------
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log("🌐 Allowed Origins:", allowedOrigins);
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });
