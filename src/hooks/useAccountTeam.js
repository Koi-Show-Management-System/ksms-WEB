import { create } from "zustand";
import {
  accountTeam,
  createAccount,
  updateAccount,
  updateStatus,
} from "../api/accountManage";

const useAccountTeam = create((set, get) => ({
  accountManage: {
    managers: [],
    staff: [],
    referees: [],
    allAccounts: [],
    admin: [],
  },
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,

  fetchAccountTeam: async (page = 1, size = 10, role = "") => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      // Gọi API với role, page, size
      const res = await accountTeam(page, size, role);

      if (res && res.status === 200) {
        console.log("API Response:", res.data);

        let accounts = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          accounts = res.data.data.items;
          total = res.data.data.total || accounts.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          accounts = res.data.items;
          total = res.data.total || accounts.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          accounts = res.data;
          total = accounts.length;
        } else {
          console.error(
            "Không tìm thấy mảng dữ liệu trong phản hồi API:",
            res.data
          );
          accounts = [];
        }

        // Phân loại tài khoản theo vai trò
        const filteredAccounts = role
          ? accounts.filter(
              (account) => account.role.toLowerCase() === role.toLowerCase()
            )
          : accounts;

        set({
          accountManage: {
            admin: filteredAccounts.filter(
              (account) => account.role === "Admin"
            ),
            managers: filteredAccounts.filter(
              (account) => account.role === "Manager"
            ),
            staff: filteredAccounts.filter(
              (account) => account.role === "Staff"
            ),
            referees: filteredAccounts.filter(
              (account) => account.role === "Referee"
            ),
            allAccounts: accounts,
          },
          totalItems: total,
          totalPages,
          isLoading: false,
        });
      } else {
        set({ error: "Không thể lấy dữ liệu tài khoản", isLoading: false });
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu tài khoản:", err);
      set({ error: err.message || "Đã xảy ra lỗi", isLoading: false });
    }
  },

  createAccount: async (accountData) => {
    set({ isLoading: true, error: null });

    try {
      const data = {
        email: accountData.email,
        hashedPassword: accountData.hashedPassword || accountData.password,
        fullName: accountData.fullName || accountData.name,
        userName: accountData.userName || accountData.email.split("@")[0],
        phone: accountData.phone,
        role: accountData.role,
      };

      const res = await createAccount(data);

      if (res && res.status === 201) {
        console.log("Account created successfully:", res.data);
        await get().fetchAccountTeam(get().currentPage, get().pageSize);
        return { success: true, data: res.data };
      } else {
        set({ error: "Failed to create account", isLoading: false });
        return { success: false, error: "Failed to create account" };
      }
    } catch (err) {
      set({ error: err.message || "An error occurred", isLoading: false });
      return { success: false, error: err.message || "An error occurred" };
    } finally {
      set({ isLoading: false });
    }
  },
  updateStatusAccount: async (accountId, status) => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateStatus(accountId, status);

      if (res && res.status === 200) {
        console.log("Account status updated successfully:", res.data);
        await get().fetchAccountTeam(get().currentPage, get().pageSize);
        return { success: true, data: res.data };
      } else {
        set({ error: "Failed to update account status", isLoading: false });
        return { success: false, error: "Failed to update account status" };
      }
    } catch (err) {
      set({ error: err.message || "An error occurred", isLoading: false });
      return { success: false, error: err.message || "An error occurred" };
    } finally {
      set({ isLoading: false });
    }
  },
  updateAccountTeam: async (accountId, accountData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateAccount(accountId, accountData);

      if (res && res.status === 200) {
        console.log("Account updated successfully:", res.data);
        await get().fetchAccountTeam(get().currentPage, get().pageSize);
        return { success: true, data: res.data };
      } else {
        set({ error: "Failed to update account", isLoading: false });
        return { success: false, error: "Failed to update account" };
      }
    } catch (err) {
      set({ error: err.message || "An error occurred", isLoading: false });
      return { success: false, error: err.message || "An error occurred" };
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAccountTeam;
