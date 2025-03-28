import { create } from "zustand";
import {
  getRegistrationRound,
  updateFishTank,
  getRegistrationRoundByReferee,
} from "../api/registrationRoundApi";
import { updatePublishRound } from "../api/roundApi";
import { notification } from "antd";

const useRegistrationRound = create((set, get) => ({
  registrationRound: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  registrationRoundList: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  refereeRoundData: null,
  resetRefereeRoundData: () => set({ refereeRoundData: null }),
  fetchRegistrationRound: async (roundId, page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getRegistrationRound(roundId, page, size);

      if (res && res.status === 200) {
        console.log("API Responseee:", res.data);

        let registrationRound = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          registrationRound = res.data.data.items;
          total = res.data.data.total || registrationRound.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          registrationRound = res.data.items;
          total = res.data.total || registrationRound.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          registrationRound = res.data;
          total = registrationRound.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          registrationRound: registrationRound,
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

  updateFishTankInRound: async (registrationRoundId, tankId) => {
    set({ isLoading: true, error: null });

    if (!registrationRoundId || !tankId) {
      notification.error({
        message: "Lỗi gán bể",
        description: "Thiếu thông tin cần thiết để gán bể",
        placement: "topRight",
      });
      set({ isLoading: false });
      return { success: false, error: "Missing required information" };
    }

    try {
      const res = await updateFishTank(registrationRoundId, tankId);
      console.log("Update response:", res.data);

      if (res && res.status === 200) {
        // Show success notification with the API message
        notification.success({
          message: "Gán bể thành công",
          description: res.data?.message || "Cá Koi đã được gán bể thành công",
          placement: "topRight",
        });

        // Don't auto-refetch - let the component handle this
        set({ isLoading: false });
        return { success: true, data: res.data };
      } else {
        // Show error notification
        notification.error({
          message: "Lỗi gán bể",
          description: "Không thể gán bể. Vui lòng thử lại sau.",
          placement: "topRight",
        });

        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("Update Fish Tank Error:", error);

      // Show error notification
      notification.error({
        message: "Lỗi gán bể",
        description:
          error.response?.data?.message || "Đã xảy ra lỗi khi gán bể",
        placement: "topRight",
      });

      set({ error: error, isLoading: false });
      return { success: false, error };
    }
  },
  updatePublishRound: async (roundId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await updatePublishRound(roundId);
      console.log("Update response:", res.data);
      if (res && res.status === 200) {
        set({ isLoading: false });
        return { success: true, data: res.data };
      } else {
        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("Update Publish Round Error:", error);
      set({ error: error, isLoading: false });
    }
  },

  fetchRegistrationRoundByReferee: async (registrationId, roundId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await getRegistrationRoundByReferee(registrationId, roundId);

      if (res && res.status === 200) {
        console.log("Referee Round Data:", res.data);

        let roundData = null;

        if (res.data && res.data.data) {
          roundData = res.data.data;
        } else if (res.data) {
          roundData = res.data;
        } else {
          console.error("No data found in API response:", res.data);
        }

        set({
          refereeRoundData: roundData,
          isLoading: false,
        });

        return { success: true, data: roundData };
      } else {
        // Extract error information from response body
        let errorMessage = "Lỗi không xác định";
        let statusCode = res?.status || 404; // Default to 404 if no status is provided

        if (res?.data?.Error) {
          // Case where error info is in res.data.Error
          errorMessage = res.data.Error;
        } else if (res?.data?.error) {
          // Alternative field name
          errorMessage = res.data.error;
        } else if (typeof res?.data === "string") {
          // Case where error might be the entire data string
          errorMessage = res.data;
        }

        // If the response contains a StatusCode, use that instead
        if (res?.data?.StatusCode) {
          statusCode = res.data.StatusCode;
        }

        console.error(
          "API Error:",
          res,
          errorMessage,
          `Status Code: ${statusCode}`
        );

        // Set the error with the extracted message and status code
        set({
          error: {
            message: errorMessage,
            statusCode: statusCode,
            data: res?.data,
          },
          isLoading: false,
        });

        return {
          success: false,
          error: {
            message: errorMessage,
            statusCode: statusCode,
            data: res?.data,
          },
        };
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error("Fetch Referee Round Error:", error);
      notification.error({
        message: "Lỗi",
        description:
          error.response?.data?.Error || "Đã xảy ra lỗi khi tải dữ liệu",
        placement: "topRight",
      });

      set({
        error: {
          message: errorMessage,
          statusCode: statusCode,
          data: error.response?.data,
        },
        isLoading: false,
      });

      return {
        success: false,
        error: {
          message: errorMessage,
          statusCode: statusCode,
          data: error.response?.data,
        },
      };
    }
  },
}));

export default useRegistrationRound;
