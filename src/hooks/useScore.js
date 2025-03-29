import { create } from "zustand";
import {
  createScoreByReferee,
  createScoreEvaluationByReferee,
  getScoreDetail,
} from "../api/scoreApi";
import { notification } from "antd";

const useScore = create((set, get) => ({
  createScore: async (registrationId, roundId, isPass) => {
    try {
      const res = await createScoreByReferee(registrationId, roundId, isPass);
      console.log("API Response when creating score:", res);

      if (res?.status === 200) {
        notification.success({
          message: "Chấm điểm thành công",
          description: res?.data?.message || "Đã chấm điểm",
          duration: 3,
        });

        return { success: true, data: res.data };
      } else {
        const errorMessage = res?.data?.Error || "Lỗi không xác định từ API";

        notification.error({
          message: "Lỗi",
          description: errorMessage,
        });

        console.error("API Error:", res);
        return { success: false, error: errorMessage, status: res?.status };
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.Error || error.message || "Lỗi không xác định";

      notification.error({
        message: "Lỗi",
        description: errorMessage,
      });

      console.error("API Error:", error);
      return {
        success: false,
        error: errorMessage,
        status: error?.response?.status || 500,
      };
    }
  },

  createScoreEvaluation: async (scoreData) => {
    try {
      const res = await createScoreEvaluationByReferee(scoreData);
      console.log("API Response when creating score evaluation:", res);

      if (
        res?.statusCode === 201 ||
        res?.status === 201 ||
        res?.statusCode === 200 ||
        res?.status === 200
      ) {
        notification.success({
          message: "Chấm điểm đánh giá thành công",
          description: res?.message || "Đã lưu kết quả đánh giá",
          duration: 3,
        });

        return {
          success: true,
          data: res,
          status: res?.statusCode || res?.status,
        };
      }
      if (!res?.error && !res?.data?.Error) {
        notification.success({
          message: "Chấm điểm đánh giá thành công",
          description: "Đã lưu kết quả đánh giá",
          duration: 3,
        });

        return { success: true, data: res, status: res?.statusCode || 200 };
      } else {
        const errorMessage =
          res?.message ||
          res?.error ||
          res?.data?.Error ||
          "Lỗi không xác định từ API";

        notification.error({
          message: "Lỗi",
          description: errorMessage,
        });

        console.error("API Error:", res);
        return {
          success: false,
          error: errorMessage,
          status: res?.statusCode || res?.status,
        };
      }
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 201 || error.response.status === 200)
      ) {
        notification.success({
          message: "Chấm điểm đánh giá thành công",
          description: "Đã lưu kết quả đánh giá",
          duration: 3,
        });

        return { success: true, status: error.response.status };
      }

      const errorMessage =
        error?.response?.data?.Error || error.message || "Lỗi không xác định";

      notification.error({
        message: "Lỗi",
        description: errorMessage,
      });

      console.error("API Error:", error);
      return {
        success: false,
        error: errorMessage,
        status: error?.response?.status || 500,
      };
    }
  },
  fetchScoreDetail: async (registrationRoundId) => {
    set({ isLoading: true, scoreDataDetail: null });
    try {
      const res = await getScoreDetail(registrationRoundId);
      if (res?.status === 200 && res?.data) {
        console.log("Score detail fetched successfully:", res);
        set({ isLoading: false, scoreDataDetail: res.data });
        return { success: true, data: res.data };
      } else {
        const errorMsg = res?.message || "Không thể lấy thông tin điểm";
        console.error("Error fetching score detail:", errorMsg);
        set({ isLoading: false, scoreDataDetail: null });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error.message || "Đã xảy ra lỗi khi lấy thông tin điểm";
      console.error("Exception in fetchScoreDetail:", error);
      set({ isLoading: false, scoreDataDetail: null });
      return { success: false, error: errorMsg };
    }
  },
}));

export default useScore;
