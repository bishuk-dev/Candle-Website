import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import toast from 'react-hot-toast';

// Add this to your useOptions.js file
export const useInitCustomization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            // Sending your base schema to initialize the database
            const payload = {
                basePrice: 100, // Default base price, you can change this later
                steps: [
                    { stepNumber: 1, title: 'Choose Scent', type: 'scent', options: [] },
                    { stepNumber: 2, title: 'Choose Vessel', type: 'vessel', options: [] },
                    { stepNumber: 3, title: 'Add Toppings', type: 'addOn', options: [] }
                ]
            };
            const { data } = await api.post('/admin/customization/init-customization', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customization']);
            toast.success("Customization framework initialized!");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to initialize")
    });
};

// Get the master customization document
export const useGetCustomization = () => {
    return useQuery({
        queryKey: ['customization'],
        queryFn: async () => {
            const { data } = await api.get('/admin/customization');
            return data; // Returns { basePrice, totalSteps, steps: [...] }
        }
    });
};

export const useCreateOption = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ stepNumber, formData }) => {
            const { data } = await api.post(`/admin/customization/${stepNumber}`, formData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customization']);
            toast.success("Option added successfully!");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to add option")
    });
};

export const useUpdateOption = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ stepNumber, optionId, formData }) => {
            const { data } = await api.put(`/admin/customization/${stepNumber}/${optionId}`, formData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customization']);
            toast.success("Option updated successfully!");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to update option")
    });
};

export const useDeleteOption = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ stepNumber, optionId }) => {
            const { data } = await api.delete(`/admin/customization/${stepNumber}/${optionId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customization']);
            toast.success("Option deleted!");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to delete option")
    });
};

export const useToggleOptionStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ step, optionId }) => {
            // Backend expects step (e.g., 1, 2)
            const { data } = await api.patch(`/admin/customization/${step}/${optionId}/toggle`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customization']);
            toast.success("Status toggled!");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to toggle status")
    });
};