import  Review  from "../models/reviewModel.js";

export const getAllReviewsAdmin = async (req, res) => {
    try {
        let { page = 1, limit = 10, rating, status } = req.query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        // Filter by rating
        if (rating) {
            filter.rating = Number(rating);
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Aggregation pipeline
        const result = await Review.aggregate([
            { $match: filter },

            {
                $lookup: {
                    from: "products", // collection name in MongoDB
                    localField: "product",
                    foreignField: "_id",
                    as: "productData"
                }
            },
            { $unwind: "$productData" },

            {
                $facet: {
                    // ✅ Reviews Data (Pagination)
                    reviews: [
                        {
                            $project: {
                                userId: "$user",
                                productId: "$product",
                                productName: "$productData.name",
                                userName: "$name",
                                rating: 1,
                                comment: 1,
                                status: 1,
                                createdAt: 1
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ],

                    // ✅ Total Count
                    totalCount: [
                        { $count: "count" }
                    ],

                    // ✅ Average Rating
                    avgRating: [
                        {
                            $group: {
                                _id: null,
                                average: { $avg: "$rating" }
                            }
                        }
                    ]
                }
            }
        ]);

        const reviews = result[0]?.reviews || [];
        const totalReviews = result[0]?.totalCount[0]?.count || 0;
        const averageRating = result[0]?.avgRating[0]?.average || 0;

        res.status(200).json({
            success: true,
            currentPage: page,
            totalReviews,
            averageRating: Number(averageRating.toFixed(1)),
            reviews
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};