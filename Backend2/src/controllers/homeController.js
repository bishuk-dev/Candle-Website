import { Product } from "../models/productModels.js";
import { Banner } from "../models/bannerModel.js";

export const getHomeData = async (req, res) => {
    try {
        const [
            banners,
            featured,
            trending,
            latest,
            bestSeller,
            discounted,
            rawProducts,
            
        ] = await Promise.all([

            // Fetch active banners
            Banner.find({ isActive: true }).sort({ createdAt: -1 }).limit(6),

            // Featured
            Product.find({ isFeatured: true, isActive: true }).limit(6),

            // Trending
            Product.find({ isTrending: true, isActive: true }).limit(6),

            // Latest
            Product.find({ isLatest: true, isActive: true }).limit(6),

            // Best Seller
            Product.find({ isBestSeller: true, isActive: true }).limit(6),

            // Discounted
            Product.find({ isDiscounted: true, isActive: true }).limit(6),

            // Raw products
            Product.find({ type: "simpleRaw" }).limit(6),

           
        ]);

        return res.status(200).json({
            success: true,
            banners,
            featured,
            trending,
            latest,
            rawProducts,
            bestSeller,
            discounted,
            
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


