import axios from "axios";
import { Order } from "../models/orderModel.js";
import { getShiprocketToken } from "../services/shipRocketService.js";
import {Product} from "../models/productModels.js";


export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//we can track also by using order


export const getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("orderItems.product", "name images")
            .populate("user", "name email"); // Populate basic user info just in case

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // =========================
        //  SECURITY CHECK
        // =========================
        // Safely check if the user requesting is the owner OR an admin
        const isOwner = req.user && order.user && order.user._id.toString() === req.user._id.toString();
        const isAdmin = req.user && req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        // =========================
        //  DEFAULT TRACKING (ADMIN)
        // =========================
        let tracking = {
            source: "admin",
            status: order.orderStatus,
            timeline: order.statusHistory || []
        };

        // =========================
        //  SHIPROCKET TRACKING
        // =========================
        if (order.awbCode) {
            try {
                const token = await getShiprocketToken();

                const trackingRes = await axios.get(
                    `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${order.awbCode}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const data = trackingRes.data?.tracking_data;

                tracking = {
                    source: "shiprocket",
                    status: data?.shipment_track?.[0]?.current_status,
                    location: data?.shipment_track?.[0]?.current_location,
                    timeline: data?.shipment_track_activities || []
                };
            } catch (err) {
                console.error("Tracking API failed:", err.message);
                // Fails silently so the user still gets their order data even if Shiprocket is down
            }
        }

        res.status(200).json({
            success: true,
            order,
            tracking
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// export const cancelOrder = async (req, res) => {
//     try {
//         const { reason } = req.body;

//         const order = await Order.findById(req.params.id);

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Order not found"
//             });
//         }

//         if (order.orderStatus === "delivered") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Cannot cancel delivered order"
//             });
//         }

//         order.orderStatus = "cancelled";
//         order.cancelReason = reason;

//         await order.save();

//         res.status(200).json({
//             success: true,
//             message: "Order cancelled"
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };





export const addReviewAfterDelivery = async (req, res) => {
    try {
        const { orderId, productId, rating, comment } = req.body;

        //  1. Find order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        //  2. Check order belongs to user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        //  3. Check delivered
        if (order.orderStatus !== "delivered") {
            return res.status(400).json({
                success: false,
                message: "You can review only after delivery"
            });
        }

        // 4. Check product exists in order
        const isProductInOrder = order.orderItems.find(
            item => item.product.toString() === productId
        );

        if (!isProductInOrder) {
            return res.status(400).json({
                success: false,
                message: "Product not in this order"
            });
        }

        //  5. Find product
        const product = await Product.findById(productId);

        //  6. Prevent duplicate review
        const alreadyReviewed = product.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({
                success: false,
                message: "Already reviewed"
            });
        }

        //  7. Add review
        const review = {
            user: req.user._id,
            name: req.user.firstName,
            rating,
            comment
        };

        product.reviews.push(review);

        //  8. Update ratings
        product.numOfReviews = product.reviews.length;

        product.ratings =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        await product.save();

        res.status(200).json({
            success: true,
            message: "Review added successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};





// export const trackOrder = async (req, res) => {
//     try {
//         const { orderId } = req.params;

//         const order = await Order.findById(orderId);

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Order not found"
//             });
//         }

//         //   check
//         if (order.user.toString() !== req.user._id.toString()) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Unauthorized"
//             });
//         }

//         const currentStatus =
//             order.statusHistory[order.statusHistory.length - 1];

//         // =========================
//         //  COURIER TRACKING LOGIC
//         // =========================
//         let courierTracking = null;

//         if (order.trackingId && order.courierName) {

//             courierTracking = {
//                 trackingId: order.trackingId,
//                 courier: order.courierName,

//                 //  If you integrate real API (Shiprocket/Delhivery)
//                 // replace below with real data
//                 status: currentStatus.status,
//                 estimatedDelivery: new Date(
//                     new Date(order.createdAt).setDate(
//                         new Date(order.createdAt).getDate() + 5
//                     )
//                 ),

//                 trackingUrl: `https://track.example.com/${order.trackingId}`
//             };
//         }

//         res.status(200).json({
//             success: true,

//             //  BASIC ORDER INFO
//             orderId: order._id,
//             paymentStatus: order.paymentStatus,

//             //  CURRENT STATUS
//             currentStatus,

//             //  FULL TIMELINE
//             timeline: order.statusHistory,

//             //  COURIER DETAILS (only if shipped)
//             courierTracking
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };