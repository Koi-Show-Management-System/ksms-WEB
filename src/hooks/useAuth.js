import Cookies from "js-cookie";
import { create } from "zustand";
import { getInfoUser } from "../api/authenApi";

const useAuth = create((set) => ({
  infoUser: {},
  fetchUserInfo: async (id) => {
    try {
      const res = await getInfoUser(id);
      if (res && res.status === 200) {
        set({ infoUser: res?.data || {} });
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

  isAuthenticated: !!Cookies.get("__token"),
  login: () => {
    set({ isAuthenticated: true });
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
