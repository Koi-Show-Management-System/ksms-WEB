import { create } from "zustand";
import { getRound, getRoundTypeByReferee } from "../api/roundApi";

const useRound = create((set, get) => ({
  round: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  roundList: [],
  refereeRoundTypes: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  fetchRound: async (competitionCategoryId, roundType, page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getRound(competitionCategoryId, roundType, page, size);

      if (res && res.status === 200) {
        console.log("API Response:", res.data);

        let round = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          round = res.data.data.items;
          total = res.data.data.total || round.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          round = res.data.items;
          total = res.data.total || round.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          round = res.data;
          total = round.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          round: round,
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
  fetchRoundByReferee: async (competitionCategoryId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await getRoundTypeByReferee(competitionCategoryId);

      if (res && res.status === 200) {
        console.log("API Response (Referee Round Types):", res.data);

        let refereeRoundTypes = [];

        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          refereeRoundTypes = res.data.data;
        } else if (res.data && Array.isArray(res.data)) {
          refereeRoundTypes = res.data;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          refereeRoundTypes: refereeRoundTypes,
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

export default useRound;
