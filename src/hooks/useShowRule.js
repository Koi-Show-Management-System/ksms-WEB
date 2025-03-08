import { create } from "zustand";
import {
  createRule,
  deleteRule,
  getRule,
  updateRule,
} from "../api/showRuleApi";

const useShowRule = create((set, get) => ({
  rules: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  criteriaList: [],
  isLoading: false,
  loading: false, // Added for consistency (some functions use loading, others use isLoading)
  error: null,
  totalPages: 1,

  fetchShowRule: async (showId, page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getRule(showId, page, size);

      if (res && res.status === 200) {
        console.log("API Response:", res.data);

        let rules = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          rules = res.data.data.items;
          total = res.data.data.total || rules.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          rules = res.data.items;
          total = res.data.total || rules.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          rules = res.data;
          total = rules.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          rules: rules,
          totalItems: total,
          totalPages: totalPages,
          isLoading: false,
        });
      } else {
        console.error("API Error:", res);
        set({ error: res, isLoading: false });
      }
    } catch (error) {
      console.error("API Error:", error);
      set({ error: error, isLoading: false });
    }
  },

  // Set rules
  setRules: (rules) => set({ rules }),

  // Create a new rule
  createRule: async (showId, data) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const response = await createRule(showId, data);

      // Refresh the rules list after creating a new rule
      const currentState = get();
      await get().fetchShowRule(
        showId,
        currentState.currentPage,
        currentState.pageSize
      );

      set({ loading: false, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create rule",
        loading: false,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update an existing rule
  updateRule: async (id, data) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const response = await updateRule(id, data);

      // Get the current showId from the API URL in the response
      // Or use a stored showId if available in your state
      const showId = get().showId; // Add showId to your state if not already there

      // Refresh the rules list after updating
      const currentState = get();
      if (showId) {
        await get().fetchShowRule(
          showId,
          currentState.currentPage,
          currentState.pageSize
        );
      } else {
        // If showId is not available, update the local state
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...response.data } : rule
          ),
        }));
      }

      set({ loading: false, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update rule",
        loading: false,
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete a rule
  deleteRule: async (id) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      await deleteRule(id);

      // Get the current showId from state
      const showId = get().showId; // Add showId to your state if not already there

      // Refresh the rules list after deleting
      const currentState = get();
      if (showId) {
        await get().fetchShowRule(
          showId,
          currentState.currentPage,
          currentState.pageSize
        );
      } else {
        // If showId is not available, update the local state
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        }));
      }

      set({ loading: false, isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete rule",
        loading: false,
        isLoading: false,
      });
      throw error;
    }
  },

  // Store the showId for later use
  setShowId: (showId) => set({ showId }),
}));

export default useShowRule;
