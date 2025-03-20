import { create } from "zustand";
import { getTank, createTank, updateTank } from "../api/tankApi";

const useTank = create((set, get) => ({
  tanks: [], // Cho Tank.jsx component
  competitionRoundTanks: [], // Mới, cho CompetitionRound.jsx
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  isLoading: false,
  error: null,
  totalPages: 1,
  selectedTank: null,
  isModalVisible: false,

  // Sửa để hỗ trợ cả hai component
  fetchTanks: async (categoryId, page = 1, size = 10, forCompetitionRound = false) => {
    if (forCompetitionRound) {
      // Chỉ cập nhật loading cho CompetitionRound
      set({ isLoading: true, error: null });
    } else {
      // Cho Tank.jsx, cập nhật cả pagination
      set({ isLoading: true, error: null, currentPage: page, pageSize: size });
    }

    try {
      const res = await getTank(categoryId, page, size);

      if (res && res.status === 200) {
        console.log("API Response:", res.data);

        let tanks = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          tanks = res.data.data.items;
          total = res.data.data.total || tanks.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          tanks = res.data.items;
          total = res.data.total || tanks.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          tanks = res.data;
          total = tanks.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        // Cập nhật state khác nhau tùy theo component gọi
        if (forCompetitionRound) {
          // Cho CompetitionRound component
          set({
            competitionRoundTanks: tanks,
            isLoading: false,
          });
        } else {
          // Cho Tank.jsx component
          set({
            tanks: tanks,
            totalItems: total,
            totalPages: totalPages,
            isLoading: false,
          });
        }
      } else {
        console.error("API Error:", res);
        set({ error: res, isLoading: false });
      }
    } catch (error) {
      console.error("API Error:", error);
      set({ error: error, isLoading: false });
    }
  },

  // Thêm các hàm còn thiếu
  createNewTank: async (tankData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await createTank(tankData);

      if (res?.data?.statusCode === 200) {
        // Refresh tank list after creation
        const showId = tankData.showId;
        get().fetchTanks(
          competitionCategoryId,
          get().currentPage,
          get().pageSize
        );
        set({ isModalVisible: false });
        return { success: true, data: res.data };
      } else {
        console.error("API Error:", res);
        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("API Error:", error);
      set({ error, isLoading: false });
      return { success: false, error };
    }
  },

  updateExistingTank: async (id, tankData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateTank(id, tankData);

      if (res && res.status === 200) {
        // Refresh tank list after update
        const showId = tankData.showId;
        get().fetchTanks(showId, get().currentPage, get().pageSize);
        set({ isModalVisible: false, selectedTank: null });
        return { success: true, data: res.data };
      } else {
        console.error("API Error:", res);
        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("API Error:", error);
      set({ error, isLoading: false });
      return { success: false, error };
    }
  },

  setSelectedTank: (tank) => set({ selectedTank: tank, isModalVisible: true }),

  clearSelectedTank: () => set({ selectedTank: null }),

  setModalVisible: (visible) => set({ isModalVisible: visible }),
}));

export default useTank;
