import Cookies from "js-cookie";
import { create } from "zustand";
import { getInfoUser } from "../api/authenApi";
import { notification } from "antd";

const useAuth = create((set) => ({
  infoUser: {},
  fetchUserInfo: async (id) => {
    try {
      const res = await getInfoUser(id);
      if (res && res.status === 200) {
        set({ infoUser: res?.data || {} });

        // Kiểm tra xem tài khoản có bị block không
        if (res?.data?.data?.status === "blocked") {
          // Hiển thị thông báo
          notification.error({
            message: "Tài khoản đã bị khóa",
            description:
              "Tài khoản của bạn đã bị khóa bởi quản trị viên. Bạn sẽ bị đăng xuất.",
            placement: "topRight",
            duration: 3,
          });

          // Đăng xuất sau 3 giây
          setTimeout(() => {
            set({ isAuthenticated: false });
            Cookies.remove("__token");
            Cookies.remove("__role");
            Cookies.remove("__id");
            sessionStorage.removeItem("keys");
            window.location.href = "/";
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Error fetching userInfo", err);
      // Nếu lỗi 401 (Unauthorized), đăng xuất người dùng
      if (err.response && err.response.status === 401) {
        set({ isAuthenticated: false });
        Cookies.remove("__token");
        Cookies.remove("__role");
        Cookies.remove("__id");
        sessionStorage.removeItem("keys");
      }
    }
  },

  // Hàm kiểm tra trạng thái tài khoản định kỳ
  checkAccountStatus: () => {
    const id = Cookies.get("__id");
    if (id) {
      // Gọi fetchUserInfo để kiểm tra trạng thái tài khoản
      useAuth.getState().fetchUserInfo(id);
    }
  },

  isAuthenticated: !!Cookies.get("__token"),
  login: () => {
    const role = Cookies.get("__role");
    if (role?.toLowerCase() === "member") {
      // Nếu vai trò là Member, hiển thị thông báo và đăng xuất
      notification.error({
        message: "Không có quyền truy cập",
        description: "Bạn không có quyền đăng nhập vào hệ thống quản trị.",
        placement: "topRight",
        duration: 5,
      });

      // Đăng xuất
      Cookies.remove("__token");
      Cookies.remove("__role");
      Cookies.remove("__id");
      sessionStorage.removeItem("keys");
      set({ isAuthenticated: false });
      return false;
    }

    set({ isAuthenticated: true });
    return true;
  },
  logout: () => {
    Cookies.remove("__token");
    Cookies.remove("__role");
    Cookies.remove("__id");
    sessionStorage.removeItem("keys");
    set({ isAuthenticated: false });
  },

  checkRole: (requiredRole) => {
    const userRole = Cookies.get("__role");
    return userRole?.toLowerCase() === requiredRole?.toLowerCase();
  },
}));

export default useAuth;
