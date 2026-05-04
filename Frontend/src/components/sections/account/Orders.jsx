import React, { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import MainBtn from '../../ui/Buttons/MainBtn';
import { Loader2 } from 'lucide-react';

// Import your custom hook
import { useOrders } from '../../../hooks/useOrders';

// 👉 1. PURE HELPER FUNCTION AT THE TOP
// This handles all data transformation cleanly outside the React render cycle
const formatOrderData = (dbOrders) => {
    if (!dbOrders || dbOrders.length === 0) return [];

    return dbOrders.map(order => ({
        id: `#ORD-${order._id.slice(-6).toUpperCase()}`,
        rawId: order._id,
        date: new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        }),
        status: order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace(/_/g, ' '),
        total: `₹${(order.totalAmount || 0).toFixed(2)}`,
        items: order.orderItems?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0
    }));
};

const Orders = () => {
    const ordersRef = useRef();
    const navigate = useNavigate();

    // Fetch dynamic orders data
    const { data: dbOrders, isLoading } = useOrders();

    // 👉 2. USE MEMO FOR PERFORMANCE
    // This guarantees the mapping logic only runs once when the backend data arrives
    const orders = useMemo(() => formatOrderData(dbOrders), [dbOrders]);

    // GSAP Animation Logic 
    useEffect(() => {
        if (isLoading || !ordersRef.current) return;

        const ctx = gsap.context(() => {
            const q = gsap.utils.selector(ordersRef);

            gsap.fromTo(q(".orders-head"),
                { y: -40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
            );

            gsap.fromTo(q(".orders-th"),
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power3.out", delay: 0.2 }
            );

            gsap.fromTo(q(".order-item"),
                { y: 55, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power3.out", delay: 0.3 }
            );
        }, ordersRef);

        return () => ctx.revert();
    }, [isLoading, orders.length]);

    // Loading State
    if (isLoading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={48} />
            </div>
        );
    }

    return (
        <div ref={ordersRef} className="container mx-auto py-[8%] px-4 orders-section">

            {orders.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 border border-gray-200 order-item">
                    <p className="text-lg text-paragraph mb-6">You haven't placed any orders yet.</p>
                    <Link to="/collections">
                        <MainBtn type="button" text="Start Shopping" className="bg-primary! text-white! rounded-sm! shadow-none!" />
                    </Link>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto hide-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-black text-white orders-head opacity-0">
                                <tr>
                                    <th className="p-4 font-medium orders-th opacity-0">Order ID</th>
                                    <th className="p-4 font-medium orders-th opacity-0">Date</th>
                                    <th className="p-4 font-medium orders-th opacity-0">Items</th>
                                    <th className="p-4 font-medium orders-th opacity-0">Total</th>
                                    <th className="p-4 font-medium orders-th opacity-0">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => navigate(`/account/orders/${order.rawId}`)}
                                        className="border-b border-gray-200 order-item opacity-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="p-4 font-semibold text-heading border-r border-gray-100">{order.id}</td>
                                        <td className="p-4 text-paragraph border-r border-gray-100">{order.date}</td>
                                        <td className="p-4 text-paragraph border-r border-gray-100">{order.items} items</td>
                                        <td className="p-4 text-heading font-medium border-r border-gray-100">{order.total}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs rounded-sm ${order.status.toLowerCase() === 'delivered'
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : order.status.toLowerCase() === 'cancelled'
                                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="lg:hidden space-y-6">
                        {orders.map((order, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/account/orders/${order.rawId}`)}
                                className="border border-gray-200 p-4 rounded-sm order-item opacity-0 bg-white cursor-pointer active:scale-[0.99] hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                                    <span className="font-semibold text-heading">{order.id}</span>
                                    <span className={`px-3 py-1 text-xs rounded-sm ${order.status.toLowerCase() === 'delivered'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : order.status.toLowerCase() === 'cancelled'
                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="space-y-3 text-sm text-paragraph">
                                    <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span className="text-heading font-medium">{order.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Items:</span>
                                        <span className="text-heading font-medium">{order.items}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span className="text-heading font-medium">{order.total}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Orders;