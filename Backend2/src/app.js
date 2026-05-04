import router from './routes/authRoute.js'
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config/index.js";
import addressRoutes from "./routes/addressRoute.js";
import cartRoutes from "./routes/cartRoutes.js";
import adminRoutes from "./routes/adminRoute.js";
import categoryRoutes from "./routes/categoryRoute.js";
import contactRoutes from "./routes/contactRoute.js";
import customizationRoutes from "./routes/customRoutes.js";
import homeRoutes from "./routes/homeRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import paymentRoutes from "./routes/paymentsRoute.js";
import productRoutes from "./routes/productRoute.js";
import searchRoutes from "./routes/searchRoute.js";
// import shipmentRoutes from "./routes/shipmentRoutes.js";
import userRoutes from "./routes/userProfileRoute.js";
import wishlistRoutes from "./routes/whishlistRoute.js";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';


const app = express();

// CORS
const allowedOrigins = [
    config.url.frontend,
    config.url.admin
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Security
app.use("/api", rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 100, // Limit each IP to 20 requests per `window
    message: 'Too many requests from this IP, please try again'
}));
app.use("/api/auth", rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 5, // Limit each IP to 5 requests per `window
    message: 'Too many requests from this IP, please try again'
}))




// ==========================
//  ADMIN ROUTES
// ==========================
app.use("/api/admin", adminRoutes);

// AUTH ROUTES
app.use('/api/auth/user', router)

// ADDRESS ROUTES
app.use("/api/address", addressRoutes);

// CART ROUTES
app.use("/api/cart", cartRoutes);

// CATEGORY ROUTES
app.use("/api", categoryRoutes);

// CONTACT ROUTES
app.use("/api", contactRoutes);

// CUSTOM CANDLE ROUTES
app.use("/api", customizationRoutes);

// HOME ROUTES
app.use("/api", homeRoutes);

// ORDER ROUTES
app.use("/api", orderRoutes);

// PAYMENT ROUTES
app.use("/api/payment", paymentRoutes);

// PRODUCT ROUTES
app.use("/api", productRoutes);

// SEARCH ROUTES
app.use("/api", searchRoutes);

// SHIPMENT ROUTES
// app.use("/api", shipmentRoutes);

// USER ROUTES
app.use("/api", userRoutes);

// WHISHLIST ROUTES
app.use("/api", wishlistRoutes);

export default app
