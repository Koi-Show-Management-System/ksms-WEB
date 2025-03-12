import { create } from "zustand";
import {
  getKoiShowList,
  getKoiShowDetail,
  updateShow,
} from "../api/koiShowApi"; // ✅ Import API mới

const useKoiShow = create((set, get) => ({
  koiShows: [],
  koiShowDetail: null, // ✅ Thêm state lưu chi tiết Koi Show
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  isLoading: false,
  error: null,

  fetchKoiShowList: async (page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getKoiShowList(page, size);
      if (res && res.status === 200) {
        const items = res.data?.data?.items || [];
        const total = res.data?.data?.total || items.length;
        const totalPages = res.data?.data?.totalPages || 1;
        // console.log("koi list", res);
        set({
          koiShows: items,
          totalItems: total,
          totalPages,
          isLoading: false,
        });
      } else {
        set({ error: res, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchKoiShowDetail: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const res = await getKoiShowDetail(id);
      if (res && res.status === 200) {
        set({ koiShowDetail: res.data, isLoading: false });
      } else {
        set({ error: res, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  updateKoiShow: async (id, updatedFields) => {
    set({ isLoading: true, error: null });

    try {
      // Log the data being sent to help debug
      console.log("Updating with data:", updatedFields);

      // Make the API call to update
      const res = await updateShow(id, updatedFields);

      if (res && res.status === 200) {
        // Update the local state directly with the updated fields
        set((state) => {
          // Make sure koiShowDetail exists before updating
          if (!state.koiShowDetail || !state.koiShowDetail.data) {
            return { isLoading: false };
          }

          return {
            koiShowDetail: {
              ...state.koiShowDetail,
              data: {
                ...state.koiShowDetail.data,
                ...updatedFields,
              },
            },
            isLoading: false,
          };
        });

        return { success: true, message: "Updated successfully" };
      } else {
        set({ error: res?.data?.message || "Update failed", isLoading: false });
        return {
          success: false,
          message: res?.data?.message || "Update failed",
          details: res?.data,
        };
      }
    } catch (error) {
      console.error("Update error:", error);
      set({ error: error.message, isLoading: false });
      return {
        success: false,
        message: error.message,
        details: error.response?.data,
      };
    }
  },
}));

export default useKoiShow;
