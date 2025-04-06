// useShowStaff.js
import { create } from "zustand";
import {
  showStaff,
  createShowStaff,
  deleteShowStaff,
} from "../api/showStaffApi";
import { notification } from "antd";

const useShowStaff = create((set, get) => ({
  accountManage: {
    managers: [],
    staff: [],
    allAccounts: [],
  },
  managerData: {
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    isLoading: false,
    error: null,
  },
  staffData: {
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    isLoading: false,
    error: null,
  },

  fetchShowStaff: async (page = 1, size = 10, role = "", showId) => {
    if (role === "Manager") {
      set((state) => ({
        managerData: {
          ...state.managerData,
          isLoading: true,
          error: null,
          currentPage: page,
          pageSize: size,
        },
      }));
    } else if (role === "Staff") {
      set((state) => ({
        staffData: {
          ...state.staffData,
          isLoading: true,
          error: null,
          currentPage: page,
          pageSize: size,
        },
      }));
    }

    try {
      const res = await showStaff(page, size, role, showId);

      if (res && res.status === 200) {
        const items = res.data?.data?.items || [];
        const total = res.data?.data?.total || items.length;
        const totalPages = res.data?.data?.totalPages || 1;

        // Map items to maintain both the showStaffId (outer id) and account properties
        const mappedItems = items
          .filter((item) => item.account)
          .map((item) => ({
            showStaffId: item.id, // Keep the outer ID for deletion
            accountId: item.account.id, // Store account ID separately
            ...item.account, // Spread account properties
          }));

        // Update the specific role data
        if (role === "Manager") {
          set((state) => ({
            managerData: {
              ...state.managerData,
              items: mappedItems,
              totalItems: total,
              totalPages,
              isLoading: false,
            },
            accountManage: {
              ...state.accountManage,
              managers: mappedItems,
            },
          }));
        } else if (role === "Staff") {
          set((state) => ({
            staffData: {
              ...state.staffData,
              items: mappedItems,
              totalItems: total,
              totalPages,
              isLoading: false,
            },
            accountManage: {
              ...state.accountManage,
              staff: mappedItems,
            },
          }));
        }
      } else {
        const errorMsg = "Không thể lấy dữ liệu tài khoản";
        if (role === "Manager") {
          set((state) => ({
            managerData: {
              ...state.managerData,
              error: errorMsg,
              isLoading: false,
            },
          }));
        } else if (role === "Staff") {
          set((state) => ({
            staffData: {
              ...state.staffData,
              error: errorMsg,
              isLoading: false,
            },
          }));
        }
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu tài khoản:", err);
      const errorMsg = err.message || "Đã xảy ra lỗi";
      if (role === "Manager") {
        set((state) => ({
          managerData: {
            ...state.managerData,
            error: errorMsg,
            isLoading: false,
          },
        }));
      } else if (role === "Staff") {
        set((state) => ({
          staffData: { ...state.staffData, error: errorMsg, isLoading: false },
        }));
      }
    }
  },

  createShowStaffMember: async (showId, accountId, role) => {
    try {
      const response = await createShowStaff(showId, accountId);

      // Check for HTTP success status (201) OR check the response data structure's statusCode
      if (
        response.status === 201 ||
        (response.data && response.data.statusCode === 201)
      ) {
        notification.success({
          message: "Thành công",
          description:
            response.data?.message ||
            `Thêm ${role === "Manager" ? "quản lý" : "nhân viên"} thành công`,
          placement: "topRight",
        });

        // Refresh the list after adding
        const { pageSize } =
          role === "Manager" ? get().managerData : get().staffData;
        await get().fetchShowStaff(1, pageSize, role, showId);

        return true;
      } else {
        notification.error({
          message: "Lỗi",
          description:
            response.data?.message ||
            `Không thể thêm ${role === "Manager" ? "quản lý" : "nhân viên"}`,
          placement: "topRight",
        });
        return false;
      }
    } catch (err) {
      console.error(
        `Lỗi khi thêm ${role === "Manager" ? "quản lý" : "nhân viên"}:`,
        err
      );
      notification.error({
        message: "Lỗi",
        description:
          err.response?.data?.message ||
          err.message ||
          `Không thể thêm ${role === "Manager" ? "quản lý" : "nhân viên"}`,
        placement: "topRight",
      });
      return false;
    }
  },

  deleteShowStaffMember: async (showStaffId, role, showId) => {
    try {
      // Use the showStaffId (outer ID) for deletion
      const response = await deleteShowStaff(showStaffId);

      // Check for HTTP success status (200 or 204) OR check the response data structure's statusCode
      if (
        response.status === 200 ||
        response.status === 204 ||
        (response.data &&
          (response.data.statusCode === 200 ||
            response.data.statusCode === 204))
      ) {
        notification.success({
          message: "Thành công",
          description:
            response.data?.message ||
            `Xóa ${role === "Manager" ? "quản lý" : "nhân viên"} thành công`,
          placement: "topRight",
        });

        // Refresh the list after deleting
        const { currentPage, pageSize } =
          role === "Manager" ? get().managerData : get().staffData;
        await get().fetchShowStaff(currentPage, pageSize, role, showId);

        return true;
      } else {
        notification.error({
          message: "Lỗi",
          description:
            response.data?.message ||
            `Không thể xóa ${role === "Manager" ? "quản lý" : "nhân viên"}`,
          placement: "topRight",
        });
        return false;
      }
    } catch (err) {
      console.error(
        `Lỗi khi xóa ${role === "Manager" ? "quản lý" : "nhân viên"}:`,
        err
      );
      notification.error({
        message: "Lỗi",
        description:
          err.response?.data?.message ||
          err.message ||
          `Không thể xóa ${role === "Manager" ? "quản lý" : "nhân viên"}`,
        placement: "topRight",
      });
      return false;
    }
  },
}));

export default useShowStaff;
