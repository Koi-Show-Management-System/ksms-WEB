import { create } from "zustand";
import {
  getCategory,
  getDetail,
} from "../api/categoryApi";

const useCategory = create((set, get) => ({
  categories: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  isLoading: false,
  error: null,
  totalPages: 1,
  currentCategory: null,

  fetchCategories: async (id, page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getCategory(id, page, size);

      if (res && res.status === 200) {
        console.log("Category API Response:", res.data);

        let categories = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          categories = res.data.data.items;
          total = res.data.data.total || categories.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          categories = res.data.items;
          total = res.data.total || categories.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          categories = res.data;
          total = categories.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          categories: categories,
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

  getCategoryDetail: async (categoryId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await getDetail(categoryId);

      if (res && res.status === 200) {
        console.log("Category detail response:", res.data);

        let categoryDetail = null;

        if (res.data && res.data.data) {
          categoryDetail = res.data.data;
        } else if (res.data) {
          categoryDetail = res.data;
        }

        set({
          currentCategory: categoryDetail,
          isLoading: false,
        });

        return categoryDetail;
      } else {
        console.error("API Error when fetching category detail:", res);
        set({
          error: res,
          isLoading: false,
          currentCategory: null,
        });
        return null;
      }
    } catch (error) {
      console.error("API Error when fetching category detail:", error);
      set({
        error: error,
        isLoading: false,
        currentCategory: null,
      });
      return null;
    }
  },

  // Reset current category
  resetCurrentCategory: () => {
    set({ currentCategory: null });
  },
}));

export default useCategory;
