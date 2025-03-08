// useShowStaff.js
import { create } from "zustand";
import { showStaff } from "../api/showStaffApi";

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

        const accounts = items
          .filter((item) => item.account)
          .map((item) => ({
            id: item.id,
            ...item.account,
          }));

        // Update the specific role data
        if (role === "Manager") {
          set((state) => ({
            managerData: {
              ...state.managerData,
              items: accounts,
              totalItems: total,
              totalPages,
              isLoading: false,
            },
            accountManage: {
              ...state.accountManage,
              managers: accounts,
            },
          }));
        } else if (role === "Staff") {
          set((state) => ({
            staffData: {
              ...state.staffData,
              items: accounts,
              totalItems: total,
              totalPages,
              isLoading: false,
            },
            accountManage: {
              ...state.accountManage,
              staff: accounts,
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
}));

export default useShowStaff;
