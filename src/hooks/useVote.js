import { create } from "zustand";
import {
  getAllVote,
  updateEnableVote,
  updateDisableVote,
} from "../api/voteApi";
import { notification } from "antd";

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

      notification.success({
        message: "Thành công",
        description: response.data.message,
        placement: "topRight",
      });

      set({ loading: false });
      return response.data;
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error?.response?.data?.Error || "Lỗi khi bật bình chọn",
        placement: "topRight",
      });

      set({ error: error.message, loading: false });
      throw error;
    }
  },

  UpdateDisableVoting: async (showId, isTimeout = false) => {
    set({ loading: true, error: null });
    try {
      const response = await updateDisableVote(showId);

      notification.success({
        message: "Thành công",
        description: response.data.message,
        placement: "topRight",
      });

      set({ loading: false });
      return response.data;
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error?.response?.data?.Error || "Lỗi khi tắt bình chọn",
        placement: "topRight",
      });

      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

export default useVote;
