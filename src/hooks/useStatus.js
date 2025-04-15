import { create } from "zustand";
import { notification } from "antd";
import { updateStatus, updateShowStatuses } from "../api/statusApi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Cài đặt plugins cho dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
// Thiết lập timezone mặc định là UTC+7
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const useStatus = create((set) => ({
  isLoading: false,
  error: null,

  // Cập nhật một trạng thái đơn lẻ
  updateStatus: async (showId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateStatus(showId, status);
      if (response.status === 200) {
        set({ status: response.data.status, isLoading: false });
        notification.success({
          message: "Thành công",
          description:
            response.data?.message || "Đã cập nhật trạng thái thành công",
        });
        return { success: true, data: response.data };
      } else {
        set({ error: response.data?.message, isLoading: false });
        notification.error({
          message: "Lỗi",
          description:
            response.data?.message || "Không thể cập nhật trạng thái",
        });
        return { success: false, message: response.data?.message };
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Không thể cập nhật trạng thái",
      });
      console.error("Error updating status:", error);
      return { success: false, message: error.message };
    }
  },

  // Cập nhật toàn bộ danh sách trạng thái của một triển lãm
  updateShowStatus: async (showId, statusList) => {
    set({ isLoading: true, error: null });
    try {
      // Chuẩn bị dữ liệu để gửi đi
      const formattedStatusList = statusList.map((status) => ({
        statusName: status.statusName,
        description: status.description,
        startDate: status.startDate
          ? dayjs(status.startDate)
              .tz("Asia/Ho_Chi_Minh")
              .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null,
        endDate: status.endDate
          ? dayjs(status.endDate)
              .tz("Asia/Ho_Chi_Minh")
              .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null,
        isActive: status.isActive,
      }));

      const response = await updateShowStatuses(showId, formattedStatusList);

      if (response.status === 200) {
        set({ isLoading: false });
        notification.success({
          message: "Thành công",
          description: "Đã cập nhật lịch trình triển lãm thành công",
        });
        return { success: true, data: response.data };
      } else {
        set({ error: response.data?.message, isLoading: false });
        notification.error({
          message: "Lỗi",
          description:
            response.data?.message || "Không thể cập nhật lịch trình triển lãm",
        });
        return { success: false, message: response.data?.message };
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error ||
          "Không thể cập nhật lịch trình triển lãm",
      });
      console.error("Error updating show status:", error);
      return { success: false, message: error.message };
    }
  },
}));

export default useStatus;
