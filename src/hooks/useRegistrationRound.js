import { create } from "zustand";
import {
  getRegistrationRound,
  updateFishTank,
  getRegistrationRoundByReferee,
} from "../api/registrationRoundApi";
import { updatePublishRound } from "../api/roundApi";

const useRegistrationRound = create((set, get) => ({
  registrationRound: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  registrationRoundList: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  refereeRoundData: null,
  resetRefereeRoundData: () => set({ refereeRoundData: null }),
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
  updatePublishRound: async (roundId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await updatePublishRound(roundId);
      console.log("Update response:", res.data);
      if (res && res.status === 200) {
        set({ isLoading: false });
        return { success: true, data: res.data };
      } else {
        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("Update Publish Round Error:", error);
      set({ error: error, isLoading: false });
    }
  },

  fetchRegistrationRoundByReferee: async (registrationId, roundId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await getRegistrationRoundByReferee(registrationId, roundId);

      if (res && res.status === 200) {
        console.log("Referee Round Data:", res.data);

        let roundData = null;

        if (res.data && res.data.data) {
          roundData = res.data.data;
        } else if (res.data) {
          roundData = res.data;
        } else {
          console.error("No data found in API response:", res.data);
        }

        set({
          refereeRoundData: roundData,
          isLoading: false,
        });

        return { success: true, data: roundData };
      } else {
        console.error("API Error:", res);
        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("Fetch Referee Round Error:", error);
      set({ error: error, isLoading: false });
      return { success: false, error };
    }
  },
}));

export default useRegistrationRound;
