import { create } from "zustand";
import {
  getRegistrationRound,
  updateFishTank,
} from "../api/registrationRoundApi";

const useRegistrationRound = create((set, get) => ({
  registrationRound: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  registrationRoundList: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  fetchRegistrationRound: async (roundId, page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getRegistrationRound(roundId, page, size);

      if (res && res.status === 200) {
        console.log("API Responseee:", res.data);

        let registrationRound = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          registrationRound = res.data.data.items;
          total = res.data.data.total || registrationRound.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          registrationRound = res.data.items;
          total = res.data.total || registrationRound.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          registrationRound = res.data;
          total = registrationRound.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          registrationRound: registrationRound,
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

  updateFishTankInRound: async (registrationRoundId, tankId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateFishTank(registrationRoundId, tankId);
      console.log("Update response:", res.data);

      if (res && res.status === 200) {
        // Don't auto-refetch - let the component handle this
        set({ isLoading: false });
        return { success: true, data: res.data };
      } else {
        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("Update Fish Tank Error:", error);
      set({ error: error, isLoading: false });
      return { success: false, error };
    }
  },
}));

export default useRegistrationRound;
