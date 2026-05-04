import { useQuery, useMutation } from "@tanstack/react-query";
import { createCustomCandle } from '../api';
import API from "../api"; 
import toast from 'react-hot-toast';

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await API.get("/candles");
      return data.candles;
    },
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
};

export const useProductsByCategory = (categoryId) => {
  return useQuery({
    queryKey: ["products", categoryId],
    queryFn: async () => {
      // API call: GET /api/products/category/69f1...
      const { data } = await API.get(`/products/category/${categoryId}`);
      return data.products;
    },
    enabled: !!categoryId, // Only run if we have an ID
  });
};

// Fetch a single product by ID
export const useSingleProduct = (id) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await API.get(`/product/${id}`); // Adjust route to your backend
      return { product: data.product, similarProducts: data.similarProducts, reviews: data.reviews };
    },
    enabled: !!id,
  });
};

// 1. Hook to fetch options for Steps 1 (Vessel), 2 (Scent), and 3 (Add-ons)
export const useCustomizationOptions = (step) => {
  return useQuery({
    queryKey: ['customizationOptions', step],
    queryFn: async () => {
      // Step 4 is just a custom message string now, so we don't need to hit the DB!
      if (step === 4) return [];

      const { data } = await API.get(`/customization-options/${step}`);
      return data;
    },
    // Only trigger the API call if we are on steps 1, 2, or 3
    enabled: step >= 1 && step <= 3,

    // Cache the options for 30 minutes. This makes navigating "Back" and "Next" instant!
    staleTime: 1000 * 60 * 30,
  });
};

// 2. Hook to create the final Custom Candle
export const useCreateCustomCandle = () => {
  return useMutation({
    mutationFn: async (payload) => {
      /* 
         The payload perfectly matches your createCustomCandle controller:
         {
             vesselId: "...",
             scentId: "...",
             addOnIds: ["...", "..."],
             message: "HAPPY BIRTHDAY",
             quantity: 1
         }
      */
      // Double check this URL matches exactly where your customRoute.js is mounted!
      const { data } = await API.post('/custom-candle', payload);
      return data;
    }
  });
};