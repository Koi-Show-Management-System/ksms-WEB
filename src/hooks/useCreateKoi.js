import { create } from "zustand";
import { createKoi } from "../api/createKoiApi";
import { notification } from "antd";

const useCreateKoi = create((set) => ({
  createKoiData: {},
  isLoading: false,
  error: null,

  fetchCreateKoi: async (formData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await createKoi(formData);
      console.log("res useCreate", res);

      // Kiểm tra statusCode từ res.data
      if (res?.data?.statusCode === 201) {
        console.log("res useCreate", res);
        set({ createKoiData: res.data ?? {}, isLoading: false });

        notification.success({
          message: "Thành công",
          description: res.data.message || "Koi Show đã được tạo thành công!",
          placement: "topRight",
        });

        return res.data; // Trả về res.data thay vì res
      }
    } catch (err) {
      console.error("Error fetching createKoi:", err);
      set({ error: err.message, isLoading: false });

      notification.error({
        message: "Lỗi hệ thống",
        description: err?.response?.data?.Error,
        placement: "topRight",
      });

      return { statusCode: 500, message: err.message };
    }
  },
}));

export default useCreateKoi;
