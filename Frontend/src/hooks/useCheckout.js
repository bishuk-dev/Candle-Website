import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api';

export const useCheckout = () => {
    const queryClient = useQueryClient();

    // 1. Initial Order Placement (Handles COD success OR Razorpay initiation)
    const placeOrderMutation = useMutation({
        mutationFn: async (orderPayload) => {
            // Hits the unified /order route
            const { data } = await API.post('/order', orderPayload);
            return data;
        },
        onSuccess: (data, variables) => {
            // If it's COD, the process is finished here. Clear cart.
            if (variables.paymentMethod === 'cod') {
                queryClient.setQueryData(['cart'], []);
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                queryClient.invalidateQueries({ queryKey: ['user'] });
            }
            // If it's Razorpay, we don't clear the cart yet! 
            // We wait for the verifyPayment mutation to succeed.
        }
    });

    // 2. Razorpay Verification (Finalizes Razorpay orders)
    const verifyPaymentMutation = useMutation({
        mutationFn: async (paymentData) => {
            // Hits /verify
            const { data } = await API.post('/payment/verify', paymentData);
            return data;
        },
        onSuccess: () => {
            // Success! Clear cart and refresh orders
            queryClient.setQueryData(['cart'], []);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        }
    });

    return {
        // We export placeOrder as both 'createOrder' and 'initRazorpay' 
        // to keep your component logic from breaking.
        createOrder: placeOrderMutation.mutateAsync,
        initRazorpay: placeOrderMutation.mutateAsync, 
        
        verifyPayment: verifyPaymentMutation.mutateAsync,
        
        // Combined loading state for the "Pay Now" button
        isPlacingOrder: placeOrderMutation.isPending || verifyPaymentMutation.isPending,
    };
};