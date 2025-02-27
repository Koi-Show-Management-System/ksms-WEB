import { create } from "zustand";
import { accountTeam, createAccount, updateAccount, updateStatus } from "../api/accountManage";

const useAccountTeam = create((set, get) => ({
  accountManage: {
    managers: [],
    staff: [],
    referees: [],
    allAccounts: [],
  },
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,

  fetchAccountTeam: async (page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await accountTeam(page, size);

      if (res && res.status === 200) {
        console.log("API Response:", res.data);

        // Kiểm tra cấu trúc dữ liệu và lấy mảng items
        let accounts = [];
        let total = 0;
        let totalPages = 1;

        if (
          res.data &&
          res.data.data &&
          res.data.data.items &&
          Array.isArray(res.data.data.items)
        ) {
          // Cấu trúc: res.data.data.items
          accounts = res.data.data.items;
          total = res.data.data.total || accounts.length;
          totalPages = res.data.data.totalPages || 1;
        } else if (
          res.data &&
          res.data.items &&
          Array.isArray(res.data.items)
        ) {
          // Cấu trúc: res.data.items
          accounts = res.data.items;
          total = res.data.total || accounts.length;
          totalPages = res.data.totalPages || 1;
        } else if (res.data && Array.isArray(res.data)) {
          // Cấu trúc: res.data là mảng
          accounts = res.data;
          total = accounts.length;
        } else {
          console.error(
            "Không tìm thấy mảng dữ liệu trong phản hồi API:",
            res.data
          );
          accounts = [];
        }

        console.log("Accounts array:", accounts);

        // Phân loại tài khoản theo vai trò
        const managers = accounts.filter(
          (account) => account.role === "MANAGER" || account.role === "Manager"
        );

        const staff = accounts.filter(
          (account) => account.role === "STAFF" || account.role === "Staff"
        );

        const referees = accounts.filter(
          (account) => account.role === "REFEREE" || account.role === "Referee"
        );

        set({
          accountManage: {
            managers,
            staff,
            referees,
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
  getAccountsByRole: (role) => {
    const { accountManage } = get();

    switch (role.toLowerCase()) {
      case "manager":
        return accountManage.managers;
      case "staff":
        return accountManage.staff;
      case "referee":
        return accountManage.referees;
      default:
        return accountManage.allAccounts;
    }
  },

  createAccount: async (accountData) => {
    set({ isLoading: true, error: null });

    try {
      // Prepare the data object with all required fields
      const data = {
        email: accountData.email,
        hashedPassword: accountData.hashedPassword || accountData.password,
        fullName: accountData.fullName || accountData.name,
        userName: accountData.userName || accountData.email.split("@")[0],
        phone: accountData.phone,
        role: accountData.role,
        avatar: accountData.avatar || null,
      };

      const res = await createAccount(data);

      if (res && res.status === 201) {
        console.log("Account created successfully:", res.data);

        // Refresh the account list after creation
        await get().fetchAccountTeam(get().currentPage, get().pageSize);

        return { success: true, data: res.data };
      } else {
        const errorMsg = "Failed to create account";
        set({ error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error("Error creating account:", err);
      const errorMsg = err.message || "An error occurred";
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    } finally {
      set({ isLoading: false });
    }
  },
  updateStatusAccount: async (accountId, status) => {
    set({ isLoading: true, error: null });

    try {
      console.log(`Updating account ${accountId} status to ${status}`);
      const res = await updateStatus(accountId, status);

      if (res && res.status === 200) {
        console.log("Account status updated successfully:", res.data);

        // Refresh the account list after update
        await get().fetchAccountTeam(get().currentPage, get().pageSize);

        return { success: true, data: res.data };
      } else {
        const errorMsg = "Failed to update account status";
        set({ error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error("Error updating account status:", err);
      const errorMsg = err.message || "An error occurred";
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    } finally {
      set({ isLoading: false });
    }
  },
  updateAccountTeam: async (accountId, accountData) => {
    set({ isLoading: true, error: null });

    try {
      console.log(`Updating account ${accountId} with data:`, accountData);
      const res = await updateAccount(accountId, accountData);

      if (res && res.status === 200) {
        console.log("Account updated successfully:", res.data);

        await get().fetchAccountTeam(get().currentPage, get().pageSize);

        return { success: true, data: res.data };
      } else {
        const errorMsg = "Failed to update account";
        set({ error: errorMsg, isLoading: false });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error("Error updating account:", err);
      const errorMsg = err.message || "An error occurred";
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAccountTeam;
