import { create } from "zustand";
import {
  getAllVote,
  updateEnableVote,
  updateDisableVote,
} from "../api/voteApi";

const useVote = create((set, get) => ({
  votes: [],
  loading: false,
  error: null,

  fetchVotes: async (showId) => {
    set({ loading: true, error: null });
    try {
      const response = await getAllVote(showId);
      set({ votes: response.data.data || [], loading: false });
      return response.data.data || [];
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateLocalVoteCount: (registrationId, newVoteCount) => {
    const currentVotes = [...get().votes];
    const voteIndex = currentVotes.findIndex(
      (vote) => vote.registrationId === registrationId
    );

    if (voteIndex !== -1) {
      currentVotes[voteIndex] = {
        ...currentVotes[voteIndex],
        voteCount: newVoteCount,
      };
      set({ votes: currentVotes });
      return true;
    }
    return false;
  },

  UpdateEnableVoting: async (showId, enable) => {
    set({ loading: true, error: null });
    try {
      const response = await updateEnableVote(showId, enable);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  UpdateDisableVoting: async (showId) => {
    set({ loading: true, error: null });
    try {
      const response = await updateDisableVote(showId);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

export default useVote;
