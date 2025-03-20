import { create } from "zustand";
import { getRegistrationPayment } from "../api/registrationPayment";

const useRegistrationPayment = create((set) => ({
  // State
  registrationPayment: null,
  loading: false,
  error: null,

  // Fetch registration payment data
  fetchRegistrationPayment: async (registrationId) => {
    try {
      set({ loading: true, error: null });
      const response = await getRegistrationPayment(registrationId);
      set({
        registrationPayment: response.data,
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: error.message || "Failed to fetch registration payment",
        loading: false,
      });
      throw error;
    }
  },

  // Reset state
  reset: () => {
    set({
      registrationPayment: null,
      loading: false,
      error: null,
    });
  },
}));

export default useRegistrationPayment;
