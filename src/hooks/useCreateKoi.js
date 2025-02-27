import { create } from "zustand";
import { createKoi } from "../api/createKoiApi";

const useCreateKoi = create((set) => ({
  createKoiData: {}, 
  isLoading: false, 
  error: null, 

  fetchCreateKoi: async (koiData) => {
    set({ isLoading: true, error: null });

    try {
      const res = await createKoi(koiData);

      if (res && res.status === 200) {
        set({ createKoiData: res.data, isLoading: false });
      } else {
        set({ error: "Failed to create Koi Show", isLoading: false });
      }
    } catch (err) {
      console.error("Error fetching createKoi:", err);
      set({ error: err.message, isLoading: false });
    }
  },
}));

export default useCreateKoi;
