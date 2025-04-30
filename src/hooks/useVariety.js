import { create } from "zustand";
import { createVariety, deleteVariety, getVarieties, updateVariety } from "../api/varietyApi";
import { notification } from "antd";

const useVariety = create((set, get) => ({
  variety: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  varietyList: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  fetchVariety: async (page = 1, size = 1000) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getVarieties(page, size);

      if (res && res.status === 200) {
        let varieties = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          varieties = res.data.data.items;
          total = res.data.data.total || varieties.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          varieties = res.data.items;
          total = res.data.total || varieties.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          varieties = res.data;
          total = varieties.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          variety: varieties,
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
  createVariety: async (variety) => {
    try {
      const res = await createVariety(variety);
      if (res && res.status === 200) {
        get().fetchVariety();
      }
    } catch (error) {
      console.error("API Error:", error);
      set({ error: error, isLoading: false });
    }
  },

  updateVariety: async (id, variety) => {
    try {
      const res = await updateVariety(id, variety);
      if (res && res.status === 200) {
        notification.success({
          message: "Thành công",
          description: res.data.message,
        });
        get().fetchVariety();
      }
    } catch (error) {
      console.error("API Error:", error);
      notification.error({
        message: "Lỗi",
        description:
          error.response?.data?.message || "Đã xảy ra lỗi khi cập nhật",
      });
      set({ error: error, isLoading: false });
    }
  },

  deleteVariety: async (id) => {
    try {
      const res = await deleteVariety(id);
      if (res && res.status === 200) {
        notification.success({
          message: "Thành công",
          description: res.data.message,
        });
        get().fetchVariety();
      }
    } catch (error) {
      console.error("API Error:", error);
      notification.error({
        message: "Lỗi",
        description: error.response?.data?.Error || "Đã xảy ra lỗi khi xóa",
      });
      set({ error: error, isLoading: false });
    }
  },

}));
export default useVariety;
