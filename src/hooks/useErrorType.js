import { create } from "zustand";

const useErrorType = create((get, set) => ({
  isLoading: false,
  error: null,

  createErrorType: async (criteriaId, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await createErrorType(criteriaId, name);
      console.log("API Response when creating errorType:", res);

      if (res && res.statusCode === 201) {
        set({ isLoading: false });
        return res.data || { message: "Error type created successfully" };
      } else {
        set({ isLoading: false, error: "Failed to create error type" });
        console.error("API Error:", res);
        return null;
      }
    } catch (error) {
      set({ isLoading: false, error: error.message || "An error occurred" });
      console.error("API Error:", error);
      return null;
    }
  },
}));

export default useErrorType;
