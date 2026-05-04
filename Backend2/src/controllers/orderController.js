import Razorpay from "razorpay";
import { Order } from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import { Product } from "../models/productModels.js";
import { CustomizedCandle } from "../models/customModel.js";
import { CandleCustomization } from "../models/optionModel.js";
import { sendSMS } from "../services/otp_services.js";
import { config } from "../config/index.js";

const razorpay = new Razorpay({
    key_id: config.razor.k_id,
    key_secret: config.razor.k_secret
});

export const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("cart.product")
      .populate("cart.customCandle");

    const {
      address,
      city,
      state,
      pincode,
      phone,
      paymentMethod = "razorpay",

      //  BUY NOW
      productId,
      quantity = 1,
    } = req.body;

    let orderItems = [];

    // =========================
    //  BUY NOW (ONLY SIMPLE)
    // =========================
    if (productId) {
      const prod = await Product.findById(productId);

      if (!prod || prod.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: "Product out of stock",
        });
      }

      orderItems.push({
        type: prod.type,
        product: prod._id,
        name: prod.name,
        quantity,
        price: prod.discountPrice || prod.price,
        image: prod.images?.[0]?.url || "",
      });
    }

    // =========================
    //  CART FLOW (SIMPLE + CUSTOM)
    // =========================
    else {
      if (!user || user.cart.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      for (let item of user.cart) {
        //  SIMPLE PRODUCT
        if (item.type === "simpleCandle" || item.type === "simpleRaw") {
          const prod = item.product;

          if (!prod || prod.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `${prod?.name || "Item"} out of stock`,
            });
          }

          orderItems.push({
            type: prod.type,
            product: prod._id,
            name: prod.name,
            quantity: item.quantity,
            price: prod.discountPrice || prod.price,
            image: prod.images?.[0]?.url || "",
          });
        }

        // 🕯️ CUSTOM CANDLE
        if (item.type === "custom") {
          const candle = item.customCandle;

          if (!candle) {
            return res.status(400).json({
              success: false,
              message: "Custom candle not found",
            });
          }

          orderItems.push({
            type: "custom",
            customCandle: candle._id,
            name: `Custom Candle (${candle.snapshot.vesselName} - ${candle.snapshot.scentName})`,
            quantity: item.quantity,
            price: candle.totalPrice,
            image: "", // optional

            // 👉 FIX: ACTUALLY SAVE THE SNAPSHOT
            snapshot: {
              vesselName: candle.snapshot.vesselName,
              scentName: candle.snapshot.scentName,
              addOnNames: candle.snapshot.addOnNames || [],
              message: candle.message || "",
            },
          });
        }
      }
    }

    // =========================
    //  PRICING
    // =========================
    let itemsPrice = 0;

    orderItems.forEach((item) => {
      itemsPrice += item.price * item.quantity;
    });

    const shippingPrice = itemsPrice > 999 ? 0 : 99;
    const taxPrice = itemsPrice * 0.05;
    const totalAmount = Math.round(itemsPrice + shippingPrice + taxPrice);

    // =========================
    //  CREATE ORDER
    // =========================
    const order = await Order.create({
      user: user._id,
      orderItems,
      shippingAddress: {
        address,
        city,
        state,
        pincode,
        phone,
      },

      itemsPrice,
      shippingPrice,
      taxPrice,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "processing",
      paidAt: paymentMethod === "cod" ? null : Date.now(),
      statusHistory: [{ status: "processing" }],
    });

    // =========================
    //  FLOW A: RAZORPAY
    // =========================
    if (paymentMethod === "razorpay") {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // Razorpay works in paise
        currency: "INR",
        receipt: `order_${order._id}`,
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(200).json({
        success: true,
        razorpayOrder,
        orderId: order._id,
        amount: totalAmount,
      });
    }

    // =========================
    //  FLOW B: CASH ON DELIVERY
    // =========================
    if (paymentMethod === "cod") {
      const shortOrderId = order._id.toString().slice(-6).toUpperCase();

      // Awaiting the promise ensures we catch any SMS failures without crashing the order
      await sendSMS(user.phoneNumber, config.msg91.orderConfirmTemplateId, {
        NAME: user.firstName || "Customer",
        ORDER_ID: shortOrderId,
        AMOUNT: String(order.totalAmount),
      }).catch((err) => console.error("Failed to send COD SMS:", err.message));
      // =========================
      //  UPDATE STOCK
      // =========================
      const customization = await CandleCustomization.findOne();
      for (let item of order.orderItems) {
        // SIMPLE
        if (item.type === "simpleCandle" || item.type === "simpleRaw") {
          const prod = await Product.findById(item.product);
          if (prod) {
            prod.stock -= item.quantity;
            await prod.save();
          }
        }

        // CUSTOM
        if (item.type === "custom") {
          const candle = await CustomizedCandle.findById(item.customCandle);

          if (candle && customization) {
            const reduceStock = (stepType, optionId) => {
              if (!optionId) return;
              const step = customization.steps.find((s) => s.type === stepType);
              if (step) {
                const opt = step.options.find(
                  (i) => i._id.toString() === optionId.toString()
                );
                if (opt && opt.stock >= item.quantity) {
                  opt.stock -= item.quantity;
                }
              }
            };

            reduceStock("vessel", candle.vessel);
            reduceStock("scent", candle.scent);

            if (candle.addOns && candle.addOns.length > 0) {
              candle.addOns.forEach((id) => reduceStock("addon", id));
            }
          }
        }
      }

      if (customization) {
        // Signal Mongoose that the nested array changed before saving
        customization.markModified("steps");
        await customization.save();
      }
      // =========================
        //  CLEAR CART
        // =========================
        user.cart = [];
        await user.save();
    }


    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
