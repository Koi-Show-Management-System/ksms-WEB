import { create } from "zustand";
import { notification } from "antd";
import {
  getRegistration,
  updateStatusRegistration,
  patchRound,
  CheckOutKoi,
} from "../api/registrationApi";

const useRegistration = create((set, get) => ({
  registration: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  isLoading: false,
  error: null,
  totalPages: 1,
  showIds: [],
  assignLoading: false,

  fetchRegistration: async (
    page = 1,
    size = 10,
    showIds,
    categoryIds,
    statuses,
    registrationNumber
  ) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getRegistration(
        page,
        size,
        showIds,
        categoryIds,
        statuses,
        registrationNumber
      );

      if (res && res.status === 200) {
        let registration = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          registration = res.data.data.items;
          total = res.data.data.total || registration.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          registration = res.data.items;
          total = res.data.total || registration.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          registration = res.data;
          total = registration.length;
        } else {
          console.error("No data array found in API response:", res.data);
        }

        set({
          registration: registration,
          totalItems: total,
          totalPages: totalPages,
          isLoading: false,
        });

        return {
          registration,
          totalItems: total,
          totalPages,
        };
      } else {
        console.error("API Error:", res);
        set({ error: res, isLoading: false });
        return { registration: [], totalItems: 0, totalPages: 0 };
      }
    } catch (error) {
      console.error("API Error:", error);
      set({ error: error, isLoading: false });
      return { registration: [], totalItems: 0, totalPages: 0 };
    }
  },

  updateStatus: async (id, status, reason = null, refundType = null) => {
    try {
      const response = await updateStatusRegistration(
        id,
        status,
        status === "rejected" ? reason : null,
        status === "Refunded" ? refundType : null
      );

      if (response && response.status === 200) {
        // Không tự động gọi fetchRegistration ở đây nữa
        // const { currentPage, pageSize, showIds } = get();
        // get().fetchRegistration(currentPage, pageSize, showIds);

        // Display success notification with message from response if available
        notification.success({
          message: "Thành công",
          description:
            response.data?.message ||
            `${
              status === "confirmed"
                ? "Phê duyệt"
                : status === "rejected"
                  ? "Từ chối"
                  : status === "Refunded"
                    ? "Hoàn tiền"
                    : "Cập nhật"
            } đăng ký thành công`,
          placement: "topRight",
        });

        return { success: true, data: response.data };
      } else {
        // Display error notification
        notification.error({
          message: "Lỗi",
          description:
            response?.data?.message ||
            `${
              status === "confirmed"
                ? "Phê duyệt"
                : status === "rejected"
                  ? "Từ chối"
                  : status === "Refunded"
                    ? "Hoàn tiền"
                    : "Cập nhật"
            } đăng ký thất bại`,
          placement: "topRight",
        });

        return { success: false, error: response };
      }
    } catch (error) {
      console.error("Error updating status:", error);

      notification.error({
        message: "Lỗi",
        description:
          error.response?.data?.Error ||
          "Đã xảy ra lỗi khi cập nhật trạng thái",
        placement: "topRight",
      });

      return { success: false, error };
    }
  },

  assignToRound: async (
    targetRoundId,
    registrationIds,
    currentRoundId = "",
    page = 1,
    size = 10
  ) => {
    try {
      set({ assignLoading: true, error: null });

      // Sử dụng patchRound với currentRoundId, page và size
      const response = await patchRound(
        targetRoundId,
        registrationIds,
        currentRoundId,
        page,
        size
      );

      if (response && (response.status === 200 || response.status === 201)) {
        const { currentPage, pageSize, showIds } = get();
        await get().fetchRegistration(currentPage, pageSize, showIds);
        set({ assignLoading: false, selectedRegistrations: [] });

        notification.success({
          message: "Thành công",
          description:
            response.data?.message ||
            "Đã chuyển cá sang vòng tiếp theo thành công",
        });

        return { success: true, data: response.data };
      } else {
        set({ error: response, assignLoading: false });

        notification.error({
          message: "Lỗi",
          description:
            response?.data?.message ||
            "Không thể chuyển cá sang vòng tiếp theo",
        });

        return { success: false, error: response };
      }
    } catch (error) {
      console.error("Error assigning to round:", error);
      set({ error, assignLoading: false });

      let errorMsg = "Không thể chuyển cá sang vòng tiếp theo";

      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      if (errorMsg.includes("đã được phân vào vòng này")) {
        notification.warning({
          message: "Thông báo",
          description: errorMsg,
        });
      } else {
        notification.error({
          message: "Lỗi",
          description: errorMsg,
        });
      }

      return { success: false, error };
    }
  },

  setSelectedRegistrations: (registrationIds) => {
    set({ selectedRegistrations: registrationIds });
  },

  selectAllCheckedInRegistrations: () => {
    const { registration } = get();
    const checkedInIds = registration
      .filter((reg) => reg.status?.toLowerCase() === "checkin")
      .map((reg) => reg.id);

    set({ selectedRegistrations: checkedInIds });
    return checkedInIds;
  },

  // Thêm hàm để bỏ chọn tất cả
  clearSelectedRegistrations: () => {
    set({ selectedRegistrations: [] });
  },

  checkOutKoi: async (registrationId, imgCheckOut, notes) => {
    try {
      const response = await CheckOutKoi(registrationId, imgCheckOut, notes);
      if (response && response.status === 200) {
        notification.success({
          message: "Thành công",
          description: response.data?.message || "Đã xuất cá ra khỏi khu vực",
        });
        return true;
      } else {
        notification.error({
          message: "Lỗi",
          description:
            response?.data?.message || "Không thể xuất cá ra khỏi khu vực",
        });
        return false;
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Không thể xuất cá ra khỏi khu vực",
      });
      console.error("Error checking out koi:", error);
      return false;
    }
  },
}));

export default useRegistration;
