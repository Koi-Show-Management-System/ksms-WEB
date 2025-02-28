import { create } from "zustand";
import { getVarieties } from "../api/varietyApi";

const useVariety = create((set, get) => ({
  variety: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  varietyList: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  fetchVariety: async (page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getVarieties(page, size);

      if (res && res.status === 200) {
        console.log("API Response:", res.data);

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
}));
export default useVariety;
