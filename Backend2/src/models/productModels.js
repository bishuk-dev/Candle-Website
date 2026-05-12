import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    discountPrice: {
        type: Number,
        default: 0
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    type: {
        type: String,
        enum: ["simpleCandle", "simpleRaw"],
        required: true
    },

    scent: {
        type: String, // e.g., lavender, vanilla
    },

    color: {
        type: String
    },

    size: {
        type: String, // small, medium, large
        enum: ["small", "medium", "large"]
    },

    burnTime: {
        type: Number, // in hours
    },

    stock: {
        type: Number,
        required: true,
        default: 0
    },

    images: [
        {
            url: String,
            public_id: String
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },

    isFeatured: {
        type: Boolean,
        default: false
    },
    isTrending: {
        type: Boolean,
        default: false
    },

    isBestSeller: {
        type: Boolean,
        default: false
    },

    isDiscounted: {
        type: Boolean,
        default: false
    },

    isLatest: {
        type: Boolean,
        default: false
    },

    ratings: {
        type: Number,
        default: 0
    },

    numOfReviews: {
        type: Number,
        default: 0
    },
    totalStar: {
        type: Number,
        default: 0
    },

    numOfPublishedReviews: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    

    // reviews: [
    //     {
    //         user: {
    //             type: mongoose.Schema.Types.ObjectId,
    //             ref: "User"
    //         },
    //         // showOnHome: {
    //         //     type: Boolean,
    //         //     default: false
    //         // },
    //         status: {
    //             type: String,
    //             enum: ["pending", "published"],
    //             default: "pending"
    //         },
    //         name: String,
    //         rating: Number,
    //         comment: String,
    //         createdAt: {
    //             type: Date,
    //             default: Date.now
    //         }
    //     }
    // ],

    // tags: [String], // "gift", "premium"
    weight: Number,
    material: String, // soy wax, beeswax
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // admin
    }

}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);