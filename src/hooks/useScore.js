import { create } from "zustand";
import { createScoreByReferee } from "../api/scoreApi";
import { notification } from "antd";

const useScore = create((set, get) => ({
  createScore: async (registrationId, roundId, isPass) => {
    try {
      const res = await createScoreByReferee(registrationId, roundId, isPass);
      console.log("API Response when creating score:", res);

      if (res?.status === 200) {
        notification.success({
          message: "Chấm điểm thành công",
          description: `Đã ${isPass ? "Pass" : "Fail"}`,
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
}));

export default useScore;
