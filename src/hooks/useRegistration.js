import { create } from "zustand";
import {
  getRegistration,
  updateStatusRegistration,
  patchRound,
} from "../api/registrationApi";

const useRegistration = create((set, get) => ({
  registration: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  isLoading: false,
  error: null,
  totalPages: 1,
  showIds: [],
  assignLoading: false,

  fetchRegistration: async (page = 1, size = 10, showIds, categoryIds) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getRegistration(page, size, showIds, categoryIds);

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

  updateStatus: async (id, status) => {
    try {
      const response = await updateStatusRegistration(id, status);
      if (response && response.status === 200) {
        const { currentPage, pageSize, showIds } = get();
        get().fetchRegistration(currentPage, pageSize, showIds);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response };
      }
    } catch (error) {
      console.error("Error updating status:", error);
      return { success: false, error };
    }
  },

  assignToRound: async (roundId, registrationIds) => {
    set({ assignLoading: true, error: null });

    try {
      const response = await patchRound(roundId, registrationIds);

      if (response && response.status === 200) {
        const { currentPage, pageSize, showIds } = get();
        await get().fetchRegistration(currentPage, pageSize, showIds);
        set({ assignLoading: false, selectedRegistrations: [] });
        return { success: true, data: response.data };
      } else {
        set({ error: response, assignLoading: false });
        return { success: false, error: response };
      }
    } catch (error) {
      console.error("Error assigning to tank:", error);
      set({ error, assignLoading: false });
      return { success: false, error };
    }
  },

  setSelectedRegistrations: (registrationIds) => {
    set({ selectedRegistrations: registrationIds });
  },

  selectAllCheckedInRegistrations: () => {
    const { registration } = get();
    const checkedInIds = registration
      .filter((reg) => reg.status?.toLowerCase() === "checkin")
      .map((reg) => reg.id);

    set({ selectedRegistrations: checkedInIds });
    return checkedInIds;
  },

  // Thêm hàm để bỏ chọn tất cả
  clearSelectedRegistrations: () => {
    set({ selectedRegistrations: [] });
  },
}));

export default useRegistration;
