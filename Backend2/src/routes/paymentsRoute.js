import express from "express";
import {
    // createRazorpayOrder,
    verifyPayment 
} from "../services/razorpayService.js";

import { isAuthenticated } from "../middleware/authmiddleware.js";

const router = express.Router();

// //  Create Razorpay Order
// router.post(
//     "/create-order",
//     isAuthenticated,
//     createRazorpayOrder
// );

// Verify Payment
router.post(
    "/verify",
    isAuthenticated,
    verifyPayment
);

export default router;