import { create } from "zustand";
import { getRegistration } from "../api/registrationApi";

const useRegistration = create((set, get) => ({
  registration: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  isLoading: false,
  error: null,
  totalPages: 1,
  showIds: [], // Thêm state mới

  setShowIds: (ids) => set({ showIds }), // Thêm hàm để cập nhật showIds

  fetchRegistration: async (page = 1, size = 10, showIds) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getRegistration(page, size, showIds);

      if (res && res.status === 200) {
        console.log("Registration API Response:", res.data);

        let registration = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          registration = res.data.data.items;
          total = res.data.data.total || registration.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          registration = res.data.items;
          total = res.data.total || registration.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          registration = res.data;
          total = registration.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          registration: registration,
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
}));

export default useRegistration;
