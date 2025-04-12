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
        description: response.data?.message || "Bật bình chọn thành công",
        placement: "topRight",
      });

      set({ loading: false });
      return response.data;
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi bật bình chọn: " + error.message,
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

      // Hiển thị thông báo dựa trên nguyên nhân tắt bình chọn
      notification.success({
        message: "Thành công",
        description: isTimeout
          ? "Đã tự động tắt bình chọn do hết thời gian"
          : response.data?.message,
        placement: "topRight",
      });

      set({ loading: false });
      return response.data;
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: isTimeout
          ? "Lỗi khi tự động tắt bình chọn: " + error.message
          : "Lỗi khi tắt bình chọn: " + error.message,
        placement: "topRight",
      });

      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

export default useVote;
