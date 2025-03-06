import { create } from "zustand";
import { getKoiShowList, getKoiShowDetail } from "../api/koiShowApi"; // ✅ Import API mới

const useKoiShow = create((set) => ({
  koiShows: [],
  koiShowDetail: null, // ✅ Thêm state lưu chi tiết Koi Show
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  isLoading: false,
  error: null,

  fetchKoiShowList: async (page = 1, size = 10) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize: size });

    try {
      const res = await getKoiShowList(page, size);
      if (res && res.status === 200) {
        const items = res.data?.data?.items || [];
        const total = res.data?.data?.total || items.length;
        const totalPages = res.data?.data?.totalPages || 1;

        set({
          koiShows: items,
          totalItems: total,
          totalPages,
          isLoading: false,
        });
      } else {
        set({ error: res, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchKoiShowDetail: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const res = await getKoiShowDetail(id);
      if (res && res.status === 200) {
        set({ koiShowDetail: res.data, isLoading: false });
      } else {
        set({ error: res, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));

export default useKoiShow;
