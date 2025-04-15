import { create } from "zustand";
import { getRegistrationPayment } from "../api/registrationPayment";
import { notification } from "antd";

const useRegistrationPayment = create((set) => ({
  // State
  registrationPayment: null,
  loading: false,
  error: null,

  // Fetch registration payment data
  fetchRegistrationPayment: async (registrationId) => {
    try {
      set({ loading: true, error: null });
      const response = await getRegistrationPayment(registrationId);
      if (response.status === 200) {
        set({
          registrationPayment: response.data,
          loading: false,
        });
        notification.success({
          message: "Thành công",
          description:
            response.data?.message || "Lấy dữ liệu đăng ký thành công",
        });
        return response.data;
      } else {
        throw new Error("Failed to fetch registration payment");
      }
    } catch (error) {
      notification.error({
        message: "Lỗi khi lấy dữ liệu đăng ký",
        description:
          error?.response?.data?.Error ||
          "Failed to fetch registration payment",
      });
      set({
        error:
          error?.data?.message?.Error || "Failed to fetch registration payment",
        loading: false,
      });
      throw error;
    }
  },

  // Reset state
  reset: () => {
    set({
      registrationPayment: null,
      loading: false,
      error: null,
    });
  },
}));

export default useRegistrationPayment;
