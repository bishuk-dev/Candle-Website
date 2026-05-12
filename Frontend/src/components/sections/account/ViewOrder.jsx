import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom'; // 👉 1. IMPORT PORTAL
import { useParams, useNavigate } from 'react-router-dom';
import {
    Package, Truck, CheckCircle, ChevronLeft, MapPin, CreditCard, Clock, ExternalLink, Loader2, Star, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../../api';
import { useOrderDetails } from '../../../hooks/useOrders';

const formatOrderData = (data) => {
    if (!data?.order) return null;

    const { order, tracking } = data;

    const formatDate = (dateString) => {
        if (!dateString) return "Pending";
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const displayStatus = order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace(/_/g, ' ');

    const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    const currentStatusIndex = statuses.indexOf(order.orderStatus.toLowerCase());

    const statusSteps = [
        { name: "Order Placed", date: formatDate(order.createdAt), completed: true },
        { name: "Processing", date: currentStatusIndex >= 1 ? formatDate(order.updatedAt) : "Pending", completed: currentStatusIndex >= 1 },
        { name: "Shipped", date: order.shippedAt ? formatDate(order.shippedAt) : "Pending", completed: currentStatusIndex >= 2 },
        { name: "Delivered", date: currentStatusIndex === 3 ? formatDate(order.updatedAt) : "Expected soon", completed: currentStatusIndex === 3 },
    ];

    return {
        order,
        tracking,
        displayStatus,
        statusSteps,
        formattedCreatedAt: formatDate(order.createdAt),
        formattedPaidAt: order.paidAt ? formatDate(order.paidAt) : null
    };
};

const ViewOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    // REVIEW MODAL & HOVER STATES
    const [reviewModal, setReviewModal] = useState({
        isOpen: false,
        productId: null,
        productName: '',
        rating: 0,
        comment: ''
    });
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const { data, isLoading, isError } = useOrderDetails(orderId);
    const formattedData = useMemo(() => formatOrderData(data), [data]);

    const handleOpenReview = (productId, productName, initialRating) => {
        setReviewModal({
            isOpen: true,
            productId,
            productName,
            rating: initialRating,
            comment: ''
        });
        setHoverRating(0);
    };

    const handleCloseReview = () => {
        setReviewModal({ isOpen: false, productId: null, productName: '', rating: 0, comment: '' });
        setHoverRating(0);
    };

    const handleSubmitReview = async () => {
        if (reviewModal.rating === 0) {
            return toast.error("Please select a star rating.");
        }
        if (!reviewModal.comment.trim()) {
            return toast.error("Please add a comment for your review.");
        }

        setIsSubmittingReview(true);
        try {
            await API.post('/review', {
                orderId: orderId,
                productId: reviewModal.productId,
                rating: reviewModal.rating,
                comment: reviewModal.comment
            });

            toast.success("Review added successfully!");
            handleCloseReview();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit review.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="w-12 h-12 animate-spin text-stone-400" />
            </div>
        );
    }

    if (isError || !formattedData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
                <h2 className="text-xl font-bold text-stone-800">Order not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-stone-500 hover:text-stone-900 underline cursor-pointer">
                    Go Back
                </button>
            </div>
        );
    }

    const { order, displayStatus, statusSteps, formattedCreatedAt, formattedPaidAt } = formattedData;

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-12 relative">
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-xl font-medium">Order #ORD-{order._id.slice(-6).toUpperCase()}</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Status & Items */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-stone-500 text-sm">Status Update</p>
                                    <h2 className="text-2xl font-semibold mt-1">{displayStatus}</h2>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${order.orderStatus === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                                    order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                        'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                    {order.orderStatus}
                                </span>
                            </div>

                            <div className="relative">
                                <div className="absolute left-[15px] top-0 h-full w-0.5 bg-stone-100 sm:hidden"></div>
                                <div className="hidden sm:block absolute top-[15px] left-0 w-full h-0.5 bg-stone-100"></div>

                                <div className="flex flex-col sm:flex-row justify-between relative z-10 space-y-8 sm:space-y-0">
                                    {statusSteps.map((step, idx) => (
                                        <div key={idx} className="flex sm:flex-col items-start sm:items-center text-left sm:text-center group">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${step.completed ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'
                                                }`}>
                                                {step.completed ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                                            </div>
                                            <div className="ml-4 sm:ml-0 sm:mt-3">
                                                <p className={`text-sm font-semibold ${step.completed ? 'text-stone-900' : 'text-stone-400'}`}>
                                                    {step.name}
                                                </p>
                                                <p className="text-[11px] text-stone-500 mt-0.5">{step.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {order.awbCode && (
                            <div className="bg-stone-50 p-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                                <div className="flex items-center space-x-3">
                                    <Truck className="text-stone-400" size={20} />
                                    <div className="text-sm">
                                        <span className="text-stone-500">Tracking (AWB): </span>
                                        <span className="font-medium text-stone-900">{order.awbCode}</span>
                                    </div>
                                </div>
                                <button className="text-sm font-semibold text-stone-900 flex items-center space-x-1 hover:underline cursor-pointer">
                                    <span>Track Shipment</span>
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Items Card */}
                    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                        <div className="p-6 border-b border-stone-100">
                            <h3 className="font-semibold text-lg flex items-center">
                                <Package className="mr-2 text-stone-400" size={20} />
                                Order Items ({order.orderItems.length})
                            </h3>
                        </div>
                        <div className="divide-y divide-stone-100">
                            {order.orderItems.map((item, idx) => (
                                <div key={idx} className="p-6 flex flex-col group">
                                    <div className="flex items-center">
                                        <div className="h-20 w-20 flex-shrink-0 bg-stone-50 rounded-lg overflow-hidden border border-stone-100">
                                            <img
                                                src={item.product?.images?.[0]?.url || "/placeholder.jpg"}
                                                alt={item.product?.name || "Product"}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="ml-6 flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-stone-900">{item.product?.name || "Custom Candle"}</h4>
                                                    {item.type === "custom" && item.snapshot && (
                                                        <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                                                            Add-ons: {item.snapshot.addOnNames?.join(', ') || "None"}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center space-x-3 mt-2">
                                                        <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded capitalize">
                                                            {item.type?.replace(/([A-Z])/g, ' $1').trim() || "Item"}
                                                        </span>
                                                        <span className="text-sm text-stone-500">Qty: {item.quantity || 1}</span>
                                                    </div>
                                                </div>
                                                <p className="font-medium text-stone-900">
                                                    ₹{(item.price || (order.itemsPrice / order.orderItems.length)).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {order.orderStatus === 'delivered' && item.product?._id && (
                                        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                                            <span className="text-[13px] font-semibold text-stone-500 tracking-wide">Leave a Review:</span>

                                            {/* Initial stars below the product to OPEN the modal */}
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => handleOpenReview(item.product._id, item.product.name, star)}
                                                        className="text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
                                                        title={`Rate ${star} stars`}
                                                    >
                                                        <Star size={24} className="fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Order Details & Summary */}
                <div className="space-y-6">
                    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center">
                                <MapPin size={14} className="mr-1.5" />
                                Shipping Address
                            </h4>
                            <div className="text-sm text-stone-600 leading-relaxed">
                                <p className="font-semibold text-stone-900">{order.address || "Address details"}</p>
                                <p>{order.city || "City"}, {order.state || "State"} {order.pincode || "Zip"}</p>
                                <p>Phone: {order.phone || "N/A"}</p>
                            </div>
                        </div>

                        <hr className="border-stone-100" />

                        <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center">
                                <CreditCard size={14} className="mr-1.5" />
                                Payment Info
                            </h4>
                            <div className="flex items-center text-sm text-stone-600">
                                <div className="w-8 h-5 bg-stone-100 rounded mr-3 flex items-center justify-center">
                                    <div className={`w-4 h-4 rounded-full opacity-30 ${order.paymentStatus === 'paid' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                </div>
                                <div>
                                    <p className="capitalize">{order.paymentMethod} <span className="text-xs text-stone-400 ml-1">({order.paymentStatus})</span></p>
                                    {order.paymentId && <p className="text-[10px] text-stone-400 mt-0.5 break-all">{order.paymentId}</p>}
                                </div>
                            </div>
                        </div>

                        <hr className="border-stone-100" />

                        <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center">
                                <Clock size={14} className="mr-1.5" />
                                Order Timeline
                            </h4>
                            <p className="text-sm text-stone-600 mb-1">Placed: <span className="font-medium text-stone-900">{formattedCreatedAt}</span></p>
                            {formattedPaidAt && <p className="text-sm text-stone-600">Paid: <span className="font-medium text-stone-900">{formattedPaidAt}</span></p>}
                        </div>
                    </section>

                    <section className="bg-stone-900 text-white rounded-2xl shadow-lg p-6">
                        <h3 className="font-semibold text-lg mb-6">Order Summary</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between text-stone-400">
                                <span>Items Subtotal</span>
                                <span>₹{(order.itemsPrice || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-400">
                                <span>Shipping</span>
                                <span>₹{(order.shippingPrice || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-400">
                                <span>Estimated Tax</span>
                                <span>₹{(order.taxPrice || 0).toFixed(2)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-green-400">
                                    <span>Discount</span>
                                    <span>-₹{order.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-stone-800 flex justify-between items-end">
                                <span className="text-lg font-medium">Total Paid</span>
                                <span className="text-2xl font-bold text-[#D19D94]">₹{(order.totalAmount || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <button className="w-full mt-8 py-3 bg-white text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-100 transition-colors shadow-sm cursor-pointer">
                            Need Help with Order?
                        </button>
                    </section>
                </div>
            </main>

            {/* 👉 2. RENDER POPUP USING REACT PORTAL to escape parent constraints */}
            {reviewModal.isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">

                        <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">Write a Review</h3>
                                <p className="text-xs text-stone-500 mt-1 line-clamp-1">{reviewModal.productName}</p>
                            </div>
                            <button onClick={handleCloseReview} className="text-stone-400 hover:text-stone-800 transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-stone-700 mb-2 text-center">Tap a star to rate</label>

                            {/* 👉 3. FLAWLESS HOVER LOGIC */}
                            <div
                                className="flex justify-center gap-2"
                                onMouseLeave={() => setHoverRating(0)} // Reset on mouse leave container
                            >
                                {[1, 2, 3, 4, 5].map((star) => {
                                    // Golden if the current star is <= hoverRating (if hovering)
                                    // OR if not hovering, if it's <= the actually clicked rating.
                                    const isFilled = (hoverRating || reviewModal.rating) >= star;

                                    return (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewModal(p => ({ ...p, rating: star }))}
                                            onMouseEnter={() => setHoverRating(star)}
                                            className="transition-transform hover:scale-110 cursor-pointer p-1"
                                        >
                                            <Star
                                                size={36}
                                                className={`${isFilled ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'fill-stone-200 text-stone-200'} transition-colors duration-150`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="block text-sm font-semibold text-stone-700">Your Feedback</label>
                            <textarea
                                value={reviewModal.comment}
                                onChange={(e) => setReviewModal(p => ({ ...p, comment: e.target.value }))}
                                rows="4"
                                placeholder="What did you love about this product? (e.g., Scent was amazing, packaging was beautiful...)"
                                className="w-full border border-stone-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D19D94] resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseReview}
                                disabled={isSubmittingReview}
                                className="flex-1 py-3 px-4 border border-stone-200 text-stone-600 font-semibold rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview}
                                className="flex-1 py-3 px-4 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmittingReview ? (
                                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                ) : "Submit Review"}
                            </button>
                        </div>

                    </div>
                </div>,
                document.body // Appends the modal directly to the <body>
            )}
        </div>
    );
};

export default ViewOrder;