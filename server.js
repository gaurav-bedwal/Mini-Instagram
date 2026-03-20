require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./router/authRouter");
const postRoutes = require("./router/postRouter");
const adminRoutes = require("./router/adminRouter");
const messageRoutes = require("./router/messageRouter");
const notificationRoutes = require("./router/notificationRouter");
const storyRoutes = require("./router/storyRouter");
const reportRoutes = require("./router/reportRouter");

const app = express();
app.set("trust proxy", 1); // Trust Vercel's proxy for secure cookies
const PORT = process.env.PORT || 3000;

// Override previous rate limiter if any
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10000000, // A huge limit to effectively disable it
  handler: (req, res, next) => next()
});
app.use(limiter);

// Global cached database connection for serverless
let isConnected;

const connectDB = async () => {
  if (isConnected) return;
  
  const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-insta';
  try {
    const db = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000 // Fail fast if connection cannot be established
    });
    isConnected = db.connections[0].readyState;
    console.log(`Connected to MongoDB`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

// Ensure database is connected before handling any requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).send("Database connection failed. If you are on Vercel, please ensure your MongoDB Atlas Network Access is set to allow all IPs (0.0.0.0/0).");
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(flash());


app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", adminRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/stories", storyRoutes);
app.use("/reports", reportRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;