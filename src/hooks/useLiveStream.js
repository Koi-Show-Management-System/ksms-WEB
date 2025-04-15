import { create } from "zustand";
import {
  CreateLiveStream,
  EndLiveStream,
  StartLiveStream,
} from "../api/liveStreamApi";
import { message } from "antd";

const useLiveStream = create((get, set) => ({
  liveStream: null,
  loading: false,
  error: null,

  setLiveStream: (liveStream) => set({ liveStream }),

  createLiveStream: async (koiShowId) => {
    try {
      set({ loading: true, error: null });

      const response = await CreateLiveStream(koiShowId);

      // Lưu thông tin livestream vào state
      if (response?.data?.statusCode === 201 && response?.data?.data) {
        set({
          liveStream: response.data.data,
          loading: false,
        });

        return response.data;
      } else {
        set({
          error: response?.data?.message || "Không nhận được dữ liệu từ API",
          loading: false,
        });
        return null;
      }
    } catch (error) {
      console.error("Lỗi khi tạo livestream:", error);

      set({
        error: error.message || "Có lỗi xảy ra khi tạo livestream",
        loading: false,
      });

      message.error(
        "Không thể tạo livestream: " +
          (error.response?.data?.message ||
            error.message ||
            "Lỗi không xác định")
      );
      return null;
    }
  },

  endLiveStream: async (id) => {
    try {
      set({ loading: true, error: null });

      const response = await EndLiveStream(id);

      if (response?.data?.statusCode === 200) {
        set({
          liveStream: null,
          loading: false,
        });

        return true;
      } else {
        set({
          error: response?.data?.message || "Không thể kết thúc livestream",
          loading: false,
        });
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi kết thúc livestream:", error);

      set({
        error: error.message || "Có lỗi xảy ra khi kết thúc livestream",
        loading: false,
      });

      message.error(
        "Không thể kết thúc livestream: " +
          (error.response?.data?.message ||
            error.message ||
            "Lỗi không xác định")
      );
      return false;
    }
  },

  startLiveStream: async (id) => {
    try {
      set({ loading: true, error: null });

      const response = await StartLiveStream(id);
      if (response?.data?.statusCode === 200) {
        set({
          liveStream: response.data.data,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Lỗi khi bắt đầu livestream:", error);

      set({
        error: error.message || "Có lỗi xảy ra khi bắt đầu livestream",
        loading: false,
      });
    }
  },
}));

export default useLiveStream;
