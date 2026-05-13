import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import 'dotenv/config'
import { config } from "../config/index.js";
import { sendOtp } from "../services/otp_services.js";

export const isAuthenticated = async (req, res, next) => {
    try {
        // 1. Get the raw token from either location
        const tokenFromCookie = req.cookies?.token;
        const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ") 
            ? req.headers.authorization.split(" ")[1] 
            : null;

        const token = tokenFromCookie || tokenFromHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login to access this resource"
            });
        }

        // 2. Verify the raw token (no "Bearer " string here)
        const decoded = jwt.verify(token, config.jwt.secret);
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        req.id = user._id;
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};
 

export const sendOtpMiddleware = async (req, res, next) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.user;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10-digit phone number"
            });
        }

        
        await sendOtp(phoneNumber);

        
        req.phoneNumber = phoneNumber;
        req.id = userId
        
        res.status(200).json({
            success: true,
            message: "OTP sent"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const isAdmin = async(req, res, next)=>{
    if(req.user && req.user.role === "admin"){
        next()
    }
    else{
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin only"
        })
    }
}