import { create } from "zustand";
import dashboardApi from "../api/dashboardApi";

const useDashBoard = create((set, get) => ({
  dashboardData: null,
  isLoading: false,
  error: null,
  selectedKoiShowId: null,
  fetchDashboardData: async (koiShowId = null) => {
    set({ isLoading: true, selectedKoiShowId: koiShowId });
    try {
      const response = await dashboardApi(koiShowId);
      if (response.status === 200) {
        console.log(response.data);
        set({
          dashboardData: response.data.data,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          error: response.data.message,
          isLoading: false,
        });
      }
    } catch (error) {
      console.log(error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },
}));

export default useDashBoard;
