import { create } from "zustand";
import {
  accountTeam,
  createAccount,
  updateAccount,
  updateStatus,
  updateAccountPassword,
} from "../api/accountManage";
import { notification } from "antd";

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

  fetchAccountTeam: async (
    page = 1,
    size = 10,
    role = "",
    status = null,
    search = ""
  ) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      // Call API with role, page, size, status (but not search)
      const res = await accountTeam(page, size, role, status);

      if (res && res.status === 200) {
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

        // Filter accounts by search term (client-side filtering)
        let filteredAccounts = accounts;
        if (search && search.trim() !== "") {
          const searchTerm = search.toLowerCase().trim();
          filteredAccounts = accounts.filter(
            (account) =>
              (account.fullName &&
                account.fullName.toLowerCase().includes(searchTerm)) ||
              (account.email &&
                account.email.toLowerCase().includes(searchTerm)) ||
              (account.username &&
                account.username.toLowerCase().includes(searchTerm)) ||
              (account.phone && account.phone.includes(searchTerm))
          );
        }

        // Filter accounts by role
        const roleFilteredAccounts = role
          ? filteredAccounts.filter(
              (account) => account.role.toLowerCase() === role.toLowerCase()
            )
          : filteredAccounts;

        set({
          accountManage: {
            member: roleFilteredAccounts.filter(
              (account) => account.role === "Member"
            ),
            admin: roleFilteredAccounts.filter(
              (account) => account.role === "Admin"
            ),
            managers: roleFilteredAccounts.filter(
              (account) => account.role === "Manager"
            ),
            staff: roleFilteredAccounts.filter(
              (account) => account.role === "Staff"
            ),
            referees: roleFilteredAccounts.filter(
              (account) => account.role === "Referee"
            ),
            allAccounts: filteredAccounts,
          },
          totalItems: search ? filteredAccounts.length : total,
          totalPages: search
            ? Math.ceil(filteredAccounts.length / size)
            : totalPages,
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
      // Kiểm tra xem accountData đã là FormData chưa
      const formData =
        accountData instanceof FormData ? accountData : new FormData();

      // Nếu accountData không phải FormData, thì tạo mới
      if (!(accountData instanceof FormData)) {
        // Thêm các trường vào FormData với đúng tên trường
        formData.append("Email", accountData.email);
        formData.append(
          "FullName",
          accountData.fullName || accountData.name || ""
        );
        formData.append(
          "Username",
          accountData.userName ||
            (accountData.email && accountData.email.split("@")[0]) ||
            ""
        );
        formData.append("Phone", accountData.phone || "");
        formData.append("Role", accountData.role || "");

        // Nếu có AvatarUrl, thêm vào (có thể để trống)
        if (accountData.AvatarUrl) {
          formData.append("AvatarUrl", accountData.AvatarUrl);
        } else {
          formData.append("AvatarUrl", "");
        }
      }

      // Log dữ liệu gửi đi để debug
      console.log("Dữ liệu gửi lên API (trong useAccountTeam):");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Gọi API với FormData
      const res = await createAccount(formData);

      if (res && res.status === 201) {
        console.log("Account created successfully:", res.data);

        notification.success({
          message: "Thành công",
          description: res?.data?.message || "Tạo tài khoản thành công!",
          placement: "topRight",
        });

        await get().fetchAccountTeam(get().currentPage, get().pageSize);
        return { success: true, data: res.data };
      } else {
        set({ error: "Failed to create account", isLoading: false });

        notification.error({
          message: "Lỗi",
          description: res?.data?.error || "Không thể tạo tài khoản.",
          placement: "topRight",
        });

        return {
          success: false,
          error: res?.data?.error || "Failed to create account",
        };
      }
    } catch (err) {
      console.error("Error creating account:", err);
      set({ error: err.message || "An error occurred", isLoading: false });

      notification.error({
        message: "Lỗi",
        description:
          err?.response?.data?.Error ||
          err.message ||
          "Đã xảy ra lỗi khi tạo tài khoản.",
        placement: "topRight",
      });

      return {
        success: false,
        error: err?.response?.data?.Error || err.message || "An error occurred",
      };
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

        notification.success({
          message: "Thành công",
          description:
            res?.data?.message ||
            `Trạng thái tài khoản đã được cập nhật thành ${status}`,
          placement: "topRight",
        });

        await get().fetchAccountTeam(get().currentPage, get().pageSize);
        return { success: true, data: res.data };
      } else {
        set({ error: "Failed to update account status", isLoading: false });

        notification.error({
          message: "Lỗi",
          description:
            res?.data?.error || "Không thể cập nhật trạng thái tài khoản.",
          placement: "topRight",
        });

        return {
          success: false,
          error: res?.data?.error || "Failed to update account status",
        };
      }
    } catch (err) {
      set({ error: err.message || "An error occurred", isLoading: false });

      notification.error({
        message: "Lỗi",
        description:
          err?.response?.data?.Error ||
          err.message ||
          "Đã xảy ra lỗi khi cập nhật trạng thái tài khoản.",
        placement: "topRight",
      });

      return {
        success: false,
        error: err?.response?.data?.Error || err.message || "An error occurred",
      };
    } finally {
      set({ isLoading: false });
    }
  },
  updateAccountTeam: async (accountId, accountData) => {
    set({ isLoading: true, error: null });

    try {
      // Kiểm tra xem accountData có phải là FormData không
      const isFormData = accountData instanceof FormData;

      // Log để debug
      console.log(
        "updateAccountTeam - Loại dữ liệu:",
        isFormData ? "FormData" : typeof accountData
      );

      if (isFormData) {
        // Log nội dung FormData
        for (let pair of accountData.entries()) {
          console.log(pair[0], pair[1]);
        }
      } else {
        // Nếu dữ liệu không phải FormData, chuyển đổi thành FormData
        const formData = new FormData();
        if (accountData.FullName)
          formData.append("FullName", accountData.FullName);
        if (accountData.Username)
          formData.append("Username", accountData.Username);
        if (accountData.Phone) formData.append("Phone", accountData.Phone);
        if (accountData.AvatarUrl)
          formData.append("AvatarUrl", accountData.AvatarUrl);

        // Gán lại accountData để sử dụng FormData
        accountData = formData;

        console.log("Đã chuyển đổi sang FormData:");
        for (let pair of accountData.entries()) {
          console.log(pair[0], pair[1]);
        }
      }

      const res = await updateAccount(accountId, accountData);

      if (res && res.status === 200) {
        console.log("Account updated successfully:", res.data);

        notification.success({
          message: "Thành công",
          description: res?.data?.message,
          placement: "topRight",
        });

        await get().fetchAccountTeam(get().currentPage, get().pageSize);
        return { success: true, data: res.data, message: res?.data?.message };
      } else {
        set({ error: "Failed to update account", isLoading: false });

        notification.error({
          message: "Lỗi",
          description: res?.data?.Error || "Không thể cập nhật tài khoản.",
          placement: "topRight",
        });

        return {
          success: false,
          error: res?.data?.error || "Failed to update account",
        };
      }
    } catch (err) {
      console.error("Error updating account:", err);

      notification.error({
        message: "Lỗi",
        description:
          err?.response?.data?.Error ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Đã xảy ra lỗi khi cập nhật tài khoản.",
        placement: "topRight",
      });

      return {
        success: false,
        error:
          err?.response?.data?.Error ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "An error occurred",
      };
    } finally {
      set({ isLoading: false });
    }
  },
  updateAccountPassword: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateAccountPassword(data);
      if (res && res.status === 200) {
        console.log("Account password updated successfully:", res.data);

        notification.success({
          message: "Thành công",
          description:
            res?.data?.message || "Mật khẩu đã được cập nhật thành công!",
          placement: "topRight",
        });

        return { success: true, data: res.data };
      } else {
        set({ error: "Failed to update account password", isLoading: false });

        notification.error({
          message: "Lỗi",
          description: res?.data?.error || "Không thể cập nhật mật khẩu.",
          placement: "topRight",
        });

        return {
          success: false,
          error: res?.data?.error || "Failed to update account password",
        };
      }
    } catch (err) {
      console.error("Error updating password:", err);
      set({ error: err.message || "An error occurred", isLoading: false });

      notification.error({
        message: "Lỗi",
        description:
          err?.response?.data?.Error ||
          err.message ||
          "Đã xảy ra lỗi khi cập nhật mật khẩu.",
        placement: "topRight",
      });

      return {
        success: false,
        error: err?.response?.data?.Error || err.message || "An error occurred",
      };
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAccountTeam;
