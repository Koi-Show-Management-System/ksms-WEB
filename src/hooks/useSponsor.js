import { create } from "zustand";
import {
  getSponsor,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from "../api/sponsorApi";

const useSponsor = create((set, get) => ({
  sponsors: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  isLoading: false,
  error: null,
  totalPages: 1,

  // Fetch sponsors for a specific show
  fetchSponsors: async (koiShowId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await getSponsor(koiShowId);

      if (res && res.status === 200) {
        const data = res.data;
        let sponsors = [];
        let total = 0;
        let totalPages = 1;

        if (
          data &&
          data.data &&
          data.data.items &&
          Array.isArray(data.data.items)
        ) {
          sponsors = data.data.items;
          total = data.data.total || sponsors.length;
          totalPages = data.data.totalPages || 1;
        } else if (data && data.items && Array.isArray(data.items)) {
          sponsors = data.items;
          total = data.total || sponsors.length;
          totalPages = data.totalPages || 1;
        } else if (data && Array.isArray(data)) {
          sponsors = data;
          total = sponsors.length;
        }

        set({
          sponsors,
          totalItems: total,
          totalPages,
          isLoading: false,
        });

        return sponsors;
      } else {
        set({ error: "Failed to fetch sponsors", isLoading: false });
        return [];
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  // Create a new sponsor
  addSponsor: async (showId, sponsorData) => {
    set({ isLoading: true, error: null });

    // Ensure the data has the required fields
    const formattedData = {
      name: sponsorData.name || "",
      logoUrl: sponsorData.logoUrl || "",
      investMoney: sponsorData.investMoney || 0,
    };

    try {
      const res = await createSponsor(showId, formattedData);

      if (res?.data?.statusCode === 201) {
        // Refresh the sponsor list after adding
        get().fetchSponsors(showId);
        return true;
      } else {
        set({ error: "Failed to create sponsor", isLoading: false });
        return false;
      }
    } catch (error) {
      console.error("Error creating sponsor:", error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Update a sponsor
  updateSponsor: async (id, sponsorData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateSponsor(id, sponsorData);

      if (res && res.status === 200) {
        // Update the sponsor in the local state
        set((state) => ({
          sponsors: state.sponsors.map((sponsor) =>
            sponsor.id === id ? { ...sponsor, ...sponsorData } : sponsor
          ),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: "Failed to update sponsor", isLoading: false });
        return false;
      }
    } catch (error) {
      console.error("Error updating sponsor:", error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Delete a sponsor
  deleteSponsor: async (id, showId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await deleteSponsor(id);

      if (res && res.status === 200) {
        // Refresh the sponsor list after deleting
        get().fetchSponsors(showId);
        return true;
      } else {
        set({ error: "Failed to delete sponsor", isLoading: false });
        return false;
      }
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },
}));

export default useSponsor;
