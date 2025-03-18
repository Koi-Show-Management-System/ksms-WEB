import { create } from "zustand";
import {
  createCategory,
  getCategory,
  getDetail,
  updateCategory,
} from "../api/categoryApi";
import { notification } from "antd";

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
        // console.log("Category API Response:", res.data);

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

  createCategory: async (categoryData) => {
    set({ isLoading: true, error: null, createSuccess: false });

    try {
      const res = await createCategory(categoryData);

      if (res?.data?.statusCode === 201) {
        console.log("Category created successfully:", res.data);

        // Optionally refresh the categories list
        const currentShowId =
          get().categories.length > 0 ? get().categories[0].showId : null;
        if (currentShowId) {
          await get().fetchCategories(
            currentShowId,
            get().currentPage,
            get().pageSize
          );
        }

        set({
          isLoading: false,
          createSuccess: true,
        });

        notification.success({
          message: "Thành công",
          description: res.data.message || "Danh mục đã được tạo thành công!",
          placement: "topRight",
        });

        return res.data;
      } else {
        console.error("API Error when creating category:", res);
        set({
          error: res?.data?.message || "Không thể tạo danh mục.",
          isLoading: false,
          createSuccess: false,
        });

        notification.error({
          message: "Lỗi",
          description:
            res?.data?.message || "Không thể tạo danh mục. Vui lòng thử lại.",
          placement: "topRight",
        });

        return res.data;
      }
    } catch (error) {
      console.error("API Error when creating category:", error);
      set({
        error: error.message || "Đã xảy ra lỗi khi tạo danh mục.",
        isLoading: false,
        createSuccess: false,
      });

      notification.error({
        message: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tạo danh mục.",
        placement: "topRight",
      });

      return null;
    }
  },

  // Reset create status
  resetCreateStatus: () => {
    set({ createSuccess: false, error: null });
  },
  updateCategory: async (categoryId, updateData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateCategory(categoryId, updateData);

      if (res?.data?.statusCode === 200) {
        notification.success({
          message: "Thành công",
          description: "Danh mục đã cập nhật thành công!",
          placement: "topRight",
        });

        // Refresh danh sách
        const currentShowId =
          get().categories.length > 0 ? get().categories[0].koiShowId : null;

        if (currentShowId) {
          await get().fetchCategories(
            currentShowId,
            get().currentPage,
            get().pageSize
          );
        }

        set({ isLoading: false });

        return res.data;
      } else {
        throw new Error(res?.data?.message || "Cập nhật không thành công");
      }
    } catch (error) {
      notification.error({
        message: "Lỗi cập nhật",
        description: error.message,
        placement: "topRight",
      });

      set({ error, isLoading: false });
      return null;
    }
  },
}));

export default useCategory;
