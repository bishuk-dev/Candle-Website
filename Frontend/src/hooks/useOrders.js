import { useQuery } from '@tanstack/react-query';
import API from '../api';

export const useOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            // Matches router.get("/orders/my", getMyOrders)
            const { data } = await API.get('/orders/my');
            return data.orders;
        },
    });
};

export const useOrderDetails = (id) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            // Make sure this route matches your Express router!
            const { data } = await API.get(`/order/${id}`);
            return data;
        },
        enabled: !!id, // Only run the query if we have an ID
        retry: 1
    });
};