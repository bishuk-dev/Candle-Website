import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({

    //  TYPE (NEW - REQUIRED)
    type: {
        type: String,
        enum: ["simpleRaw", "simpleCandle", "custom"],
        required: true
    },

    //  SIMPLE PRODUCT
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },

    //  CUSTOM CANDLE
    customCandle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomizedCandle"
    },

    name: String,
    quantity: Number,
    price: Number,
    image: String,

    //  SNAPSHOT FOR CUSTOM (VERY IMPORTANT)
    snapshot: {
        vesselName: String,
        scentName: String,
        addOnNames: [String],
        message: String
    }

});

const orderSchema = new mongoose.Schema({
    //  User
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    //  UPDATED ITEMS
    orderItems: [orderItemSchema],

    //  Shipping Address
    shippingAddress: {
        address: String,
        city: String,
        state: String,
        pincode: String,
        phone: String
    },

    //  Pricing
    itemsPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    //  Payment
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"], //  added refunded
        default: "pending"
    },

    paymentMethod: {
        type: String,
        enum: ["razorpay", "cod"],
        default: "razorpay"
    },

    paymentId: String,
    razorpayOrderId: String,
    razorpaySignature: String,
    refundId: String, //  NEW

    paidAt: Date,

    //  Order Status
    orderStatus: {
        type: String,
        enum: [
            "processing",
            "placed",
            "confirmed",
            "packaged",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled"
        ],
        default: "processing"
    },
    packaging:{
        type: String,
        enum:["small", "medium", "large"],
    },
    weight:{
        type: Number,
        default: 0
    },
    //  Tracking
    trackingId: String,
    awbCode: String,
    courierName: String,
    trackingUrl: String,

    //  Dates
    shippedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    //  Cancel 
    cancelReason: String,
    

    //  STATUS HISTORY
    statusHistory: [
        {
            status: String,
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]

}, { timestamps: true });

export const Order = mongoose.model("Order", orderSchema);