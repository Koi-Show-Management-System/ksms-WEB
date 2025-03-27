import { create } from "zustand";
import { createRoundResult } from "../api/roundResultApi";

const useRoundResult = create((set, get) => ({
  isLoading: false,
  error: null,
  createRoundResultFinalize: async (roundId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await createRoundResult(roundId);
      console.log("API Response when creating round result:", res);

      if (res && (res.statusCode === 201 || res.statusCode === 200)) {
        set({ isLoading: false });
        return res;
      } else {
        set({
          isLoading: false,
          error: res?.message || "Failed to create round result",
        });
        console.error("API Error:", res);
        return res;
      }
    } catch (error) {
      set({ isLoading: false, error: error.message || "An error occurred" });
      console.error("API Error in catch:", error);

      if (error.response && error.response.status === 201) {
        return {
          statusCode: 201,
          message:
            error.response.data?.message ||
            "Final scores calculated successfully!",
          data: error.response.data,
        };
      }

      if (error.response && error.response.status === 500) {
        return {
          statusCode: 500,
          message:
            "Chưa đủ thông tin điểm của các trọng tài. Vui lòng đảm bảo tất cả trọng tài đã chấm điểm trước khi tổng hợp.",
          error: true,
          notificationType: "warning",
        };
      }

      return {
        statusCode: error.response?.status || 500,
        message: error.message || "An error occurred",
        error: true,
      };
    }
  },
}));

export default useRoundResult;
