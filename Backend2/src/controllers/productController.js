import { Product } from "../models/productModels.js";
import  Review  from "../models/reviewModel.js";

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    //  1. Get product with reviews
    const prod = await Product.findById({ _id: id, isActive: true })
      .populate("category", "name");

    if (!prod) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    //  2. Get similar products (same category, exclude current)
    const similarProducts = await Product.find({
      category: prod.category._id,
      _id: { $ne: id }, // exclude current product
    })
      .limit(6)
      .select("name price discountPrice images ratings");

    

    // Fetch reviews for a product
    const productReviews = await Review.find({
      product: prod._id,
      status: "published", // optional filter
    }).sort({ createdAt: -1 });

    // Format reviews
    const reviews = productReviews.map((r) => ({
      user: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      product: prod,
      reviews,
      similarProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllCandles = async (req, res) => {
  try {
    const { page = 1, limit = 10, minPrice, maxPrice } = req.query;

    const query = {
      type: "simpleCandle",
      isActive: true,
    };

    const candles = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("name price discountPrice images ratings stock");

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      candles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
