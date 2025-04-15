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
        let registrationRound = [];
        let total = 0;
        let totalPages = 1;
        let currentPage = page;
        let pageSize = size;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          registrationRound = res.data.data.items;
          total = res.data.data.total || registrationRound.length;
          totalPages = res.data.data.totalPages || 1;
          currentPage = res.data.data.page || page;
          pageSize = res.data.data.size || size;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          registrationRound = res.data.items;
          total = res.data.total || registrationRound.length;
          totalPages = res.data.totalPages || 1;
          currentPage = res.data.page || page;
          pageSize = res.data.size || size;
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
          currentPage: currentPage,
          pageSize: pageSize,
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
        notification.success({
          message: "Thành công",
          description: res.data?.message || "Đã công khai vòng thi",
        });
        return { success: true, data: res.data };
      } else {
        set({ error: res, isLoading: false });
        return { success: false, error: res };
      }
    } catch (error) {
      console.error("Update Publish Round Error:", error);
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Không thể công khai vòng thi",
      });
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

      let errorMessage = error.message || "Lỗi không xác định";
      let statusCode = error.response?.status || 500;

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

  // Thêm hàm mới để lấy tất cả cá có status nhất định (Pass/Fail) từ một vòng, bất kể phân trang
  fetchAllRegistrationRoundByStatus: async (roundId, status = "Pass") => {
    set({ isLoading: true, error: null });

    try {
      // Gọi API với size lớn để lấy tất cả trong một lần
      const res = await getRegistrationRound(roundId, 1, 1000);

      if (res && (res.status === 200 || res.status === 201)) {
        let allRegistrations = [];

        // Xử lý các dạng response khác nhau
        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          allRegistrations = res.data.data.items;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          allRegistrations = res.data.items;
        } else if (res.data && Array.isArray(res.data)) {
          allRegistrations = res.data;
        } else {
          console.error("No valid array data found in API response:", res.data);
          set({ isLoading: false });
          return [];
        }

        // Lọc các cá có status tương ứng
        const filteredRegistrations = allRegistrations.filter(
          (item) =>
            item.roundResults &&
            item.roundResults.length > 0 &&
            item.roundResults[0]?.status === status
        );

        console.log(
          `Found ${filteredRegistrations.length} fish with status ${status}`
        );
        set({ isLoading: false });
        return filteredRegistrations;
      } else {
        console.error("API Error:", res);
        set({ error: res, isLoading: false });
        return [];
      }
    } catch (error) {
      console.error("Fetch All Registrations Error:", error);
      set({ error: error, isLoading: false });
      return [];
    }
  },
}));

export default useRegistrationRound;
