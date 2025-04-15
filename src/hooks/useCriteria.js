import { create } from "zustand";
import {
  getCriterias,
  postCriteria,
  updateCriteria as updateCriteriaApi,
  getCriteriaCompetitionRound,
} from "../api/criteriaApi";

const useCriteria = create((set, get) => ({
  criteria: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  criteriaList: [],
  criteriaCompetitionRound: [],
  isLoading: false,
  error: null,
  totalPages: 1,

  // Add a function to reset criteria
  resetCriteriaCompetitionRound: () => {
    set({ criteriaCompetitionRound: [], error: null });
  },

  fetchCriteria: async (page = 1, size = 1000) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getCriterias(page, size);

      if (res && res.status === 200) {

        let criteria = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          criteria = res.data.data.items;
          total = res.data.data.total || criteria.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          criteria = res.data.items;
          total = res.data.total || criteria.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          criteria = res.data;
          total = criteria.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          criteria: criteria,
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
  createCriteria: async (data) => {
    try {
      const res = await postCriteria(data);
      console.log("API Response when creating criteria:", res);

      if (res && res.status === 201) {
        return res.data || { message: "Criterion created successfully" };
      } else {
        console.error("API Error:", res);
        return null;
      }
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  },
  updateCriteria: async (id, data) => {
    try {
      const res = await updateCriteriaApi(id, data);
      console.log("API Response when updating criteria:", res);

      if (res && (res.status === 200 || res.status === 204)) {
        // Refresh data after update
        await get().fetchCriteria(get().currentPage, get().pageSize);
        return res.data || { message: "Criterion updated successfully" };
      } else {
        console.error("API Error:", res);
        return null;
      }
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  },
  fetchCriteriaCompetitionRound: async (competitionCategoryId, roundId) => {
    if (!competitionCategoryId || !roundId) {
      console.warn(
        "Missing categoryId or roundId for fetchCriteriaCompetitionRound",
        { competitionCategoryId, roundId }
      );
      return [];
    }

    try {
      set({ isLoading: true, error: null });
      console.log(
        `Fetching criteria for category ${competitionCategoryId} and round ${roundId}`
      );

      const res = await getCriteriaCompetitionRound(
        competitionCategoryId,
        roundId
      );


      if (res?.status === 200) {
        // Handle different response formats
        let criteriaData = [];

        if (res.data?.data && Array.isArray(res.data.data)) {
          criteriaData = res.data.data;
        } else if (Array.isArray(res.data)) {
          criteriaData = res.data;
        } else {
          console.warn("Unexpected criteria response format:", res.data);
        }

        console.log("Processed criteria data:", criteriaData);
        set({ criteriaCompetitionRound: criteriaData, isLoading: false });
        return criteriaData;
      } else {
        console.error("Failed to fetch criteria:", res);
        set({
          error: res || "Unknown error",
          isLoading: false,
          criteriaCompetitionRound: [],
        });
        return [];
      }
    } catch (error) {
      console.error("API Error in fetchCriteriaCompetitionRound:", error);
      set({ error: error, isLoading: false, criteriaCompetitionRound: [] });
      return [];
    }
  },
}));

export default useCriteria;
