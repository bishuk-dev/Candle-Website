import Razorpay from "razorpay";
import crypto from "crypto";
import { User } from "../models/userModel.js";
import { Product } from "../models/productModels.js";
import { Order } from "../models/orderModel.js";
import { CustomizedCandle } from "../models/customModel.js";
import { CandleCustomization } from "../models/optionModel.js";
import { config } from "../config/index.js";
import { createShipment } from "./shipRocketService.js";
import { sendSMS } from "./otp_services.js";
import mongoose from "mongoose";

const razorpay = new Razorpay({
    key_id: config.razor.k_id,
    key_secret: config.razor.k_secret
});

// // =========================
// //  CREATE RAZORPAY ORDER
// // =========================
// export const createRazorpayOrder = async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id)
//             .populate("cart.product")
//             .populate("cart.customCandle");

//         if (!user || user.cart.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Cart is empty"
//             });
//         }

//         let orderItems = [];
//         let itemsPrice = 0;

//         for (let item of user.cart) {
//             if (item.type === "simpleCandle" || item.type === "simpleRaw") {
//                 const prod = item.product;
//                 const price = prod.discountPrice || prod.price;
//                 itemsPrice += price * item.quantity;
//                 orderItems.push({
//                     type: prod.type,
//                     product: prod._id,
//                     name: prod.name,
//                     quantity: item.quantity,
//                     price,
//                     image: prod.images?.[0]?.url || ""
//                 });
//             }

//             if (item.type === "custom") {
//                 const candle = item.customCandle;
//                 itemsPrice += candle.totalPrice * item.quantity;
//                 orderItems.push({
//                     type: "custom",
//                     customCandle: candle._id,
//                     name: `Custom Candle`,
//                     quantity: item.quantity,
//                     price: candle.totalPrice
//                 });
//             }
//         }

//         const shippingPrice = itemsPrice > 999 ? 0 : 99;
//         const taxPrice = itemsPrice * 0.05;

//         const totalAmount = Math.round(
//             itemsPrice + shippingPrice + taxPrice
//         );

//         const order = await Order.create({
//             user: user._id,
//             orderItems,
//             itemsPrice,
//             shippingPrice,
//             taxPrice,
//             totalAmount,
//             paymentMethod: "razorpay",
//             paymentStatus: "pending",
//             orderStatus: "processing"
//         });

//         const razorpayOrder = await razorpay.orders.create({
//             amount: totalAmount * 100,
//             currency: "INR",
//             receipt: `order_${order._id}`
//         });

//         order.razorpayOrderId = razorpayOrder.id;
//         await order.save();

//         res.status(200).json({
//             success: true,
//             razorpayOrder,
//             orderId: order._id,
//             amount: totalAmount
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// =========================
//  VERIFY PAYMENT
// =========================
export const verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const order = await Order.findById(orderId).session(session);

        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Prevent duplicate execution
        if (order.paymentStatus === "paid") {
            await session.abortTransaction();
            return res.status(200).json({
                success: true,
                message: "Already processed",
                order
            });
        }

        // =========================
        //  VERIFY SIGNATURE
        // =========================
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", config.razor.k_secret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // =========================
        //  GET USER + CONFIG
        // =========================
        const user = await User.findById(order.user).session(session);
        const customization = await CandleCustomization.findOne().session(session);

        // =========================
        //  UPDATE STOCK
        // =========================
        for (let item of order.orderItems) {

            // SIMPLE
            if (item.type === "simpleCandle" || item.type === "simpleRaw") {
                const prod = await Product.findById(item.product).session(session);
                if (prod) {
                    prod.stock -= item.quantity;
                    await prod.save({session});
                }
            }

            // CUSTOM
            if (item.type === "custom") {
                const candle = await CustomizedCandle.findById(item.customCandle).session(session);

                if (candle && customization) {
                    const reduceStock = (stepType, optionId) => {
                        if (!optionId) return;
                        const step = customization.steps.find(s => s.type === stepType).session(session);
                        if (step) {
                            const opt = step.options.find(i => i._id.toString() === optionId.toString()).session(session);
                            if (opt && opt.stock >= item.quantity) {
                                opt.stock -= item.quantity;
                            }
                        }
                    };

                    reduceStock("vessel", candle.vessel);
                    reduceStock("scent", candle.scent);

                    if (candle.addOns && candle.addOns.length > 0) {
                        candle.addOns.forEach(id => reduceStock("addon", id));
                    }
                }
            }
        }

        if (customization) {
            // Signal Mongoose that the nested array changed before saving
            customization.markModified('steps');
            await customization.save({session});
        }

        // =========================
        //  UPDATE ORDER
        // =========================
        order.paymentStatus = "paid";
        order.paymentId = razorpay_payment_id;
        order.razorpayOrderId = razorpay_order_id;
        order.razorpaySignature = razorpay_signature;
        order.paidAt = Date.now();

        order.orderStatus = "confirmed";
        order.statusHistory.push({ status: "confirmed" });

        await order.save({session});


        // =========================
        //  CLEAR CART
        // =========================
        user.cart = [];
        await user.save({session});

        await session.commitTransaction();
        
        // =========================
        //  SEND MSG91 SMS
        // =========================
        if (user?.phoneNumber) {
            const shortOrderId = order._id.toString().slice(-6).toUpperCase();

            // 👉 Updated to use the MSG91 Flow API pattern
            await sendSMS(
                user.phoneNumber,
                config.msg91.orderConfirmTemplateId, // Use the same template ID you used in the COD block
                {
                    NAME: user.firstName || "Customer",
                    ORDER_ID: shortOrderId,
                    AMOUNT: String(order.totalAmount)
                }
            ).catch(err => console.error("Failed to send Razorpay SMS:", err.message));
        }

        // =========================
        //  CREATE SHIPMENT
        // =========================

        // try {
        //     const shipment = await createShipment(order);

        //     if (shipment?.shipment_id) {
        //         order.trackingId = shipment.shipment_id;
        //         order.awbCode = shipment.awb_code;
        //         order.courierName = shipment.courier_name;
        //         order.trackingUrl = shipment.tracking_url;
        //         await order.save();
        //     }
        // } catch (shipmentError) {
        //     // We log the error for you to fix later, but we let the code continue!
        //     console.error("Shiprocket Error (Order saved successfully though!):", shipmentError.message);
        // }

        res.status(200).json({
            success: true,
            message: "Payment verified & order confirmed",
            order
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
    finally {
        // 5. Always end the session
        session.endSession();
    }
};