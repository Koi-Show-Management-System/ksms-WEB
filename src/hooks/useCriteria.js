import { create } from "zustand";
import {
  getCriterias,
  postCriteria,
  updateCriteria as updateCriteriaApi,
} from "../api/criteriaApi";

const useCriteria = create((set, get) => ({
  criteria: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  criteriaList: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  fetchCriteria: async (page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getCriterias(page, size);

      if (res && res.status === 200) {
        console.log("API Responseee:", res.data);

        let criteria = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          criteria = res.data.data.items;
          total = res.data.data.total || criteria.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          criteria = res.data.items;
          total = res.data.total || criteria.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          criteria = res.data;
          total = criteria.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          criteria: criteria,
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
  createCriteria: async (data) => {
    try {
      const res = await postCriteria(data);
      console.log("API Response when creating criteria:", res);

      if (res && res.status === 201) {
        return res.data || { message: "Criterion created successfully" };
      } else {
        console.error("API Error:", res);
        return null;
      }
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  },
  updateCriteria: async (id, data) => {
    try {
      const res = await updateCriteriaApi(id, data);
      console.log("API Response when updating criteria:", res);

      if (res && (res.status === 200 || res.status === 204)) {
        // Refresh data after update
        await get().fetchCriteria(get().currentPage, get().pageSize);
        return res.data || { message: "Criterion updated successfully" };
      } else {
        console.error("API Error:", res);
        return null;
      }
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  },
}));

export default useCriteria;
