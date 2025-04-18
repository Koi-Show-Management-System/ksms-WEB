import { create } from "zustand";
import {
  getKoiShowList,
  getKoiShowDetail,
  updateShow,
  updateKoiShowStatus,
} from "../api/koiShowApi"; 

const useKoiShow = create((set, get) => ({
  koiShows: [],
  koiShowDetail: null, 
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
        // console.log("koi list", res);
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
  updateKoiShow: async (id, updatedFields) => {
    set({ isLoading: true, error: null });

    try {
      console.log("Updating with data:", updatedFields);

      const res = await updateShow(id, updatedFields);

      if (res && res.status === 200) {
        set((state) => {
          if (!state.koiShowDetail || !state.koiShowDetail.data) {
            return { isLoading: false };
          }

          return {
            koiShowDetail: {
              ...state.koiShowDetail,
              data: {
                ...state.koiShowDetail.data,
                ...updatedFields,
              },
            },
            isLoading: false,
          };
        });

        return { success: true, message: "Updated successfully" };
      } else {
        set({ error: res?.data?.message || "Update failed", isLoading: false });
        return {
          success: false,
          message: res?.data?.message || "Update failed",
          details: res?.data,
        };
      }
    } catch (error) {
      console.error("Update error:", error);
      set({ error: error.message, isLoading: false });
      return {
        success: false,
        message: error.message,
        details: error.response?.data,
      };
    }
  },
  updateKoiShowStatus: async (id, status, cancellationReason = "") => {
    set({ isLoading: true, error: null });

    try {
      const res = await updateKoiShowStatus(id, status, cancellationReason);

      if (res && res.status === 200) {
        const koiShowDetail = get().koiShowDetail;
        if (
          koiShowDetail &&
          koiShowDetail.data &&
          koiShowDetail.data.id === id
        ) {
          set((state) => ({
            koiShowDetail: {
              ...state.koiShowDetail,
              data: {
                ...state.koiShowDetail.data,
                status: status,
                cancellationReason:
                  status === "Cancelled" ? cancellationReason : null,
              },
            },
            isLoading: false,
          }));
        }

        set((state) => ({
          koiShows: state.koiShows.map((show) =>
            show.id === id ? { ...show, status: status } : show
          ),
          isLoading: false,
        }));

        return { success: true, message: "Status updated successfully" };
      } else {
        set({
          error: res?.data?.message || "Status update failed",
          isLoading: false,
        });
        return {
          success: false,
          message: res?.data?.message || "Status update failed",
          details: res?.data,
        };
      }
    } catch (error) {
      console.error("Status update error:", error);
      set({ error: error.message, isLoading: false });
      return {
        success: false,
        message: error.message,
        details: error.response?.data,
      };
    }
  },
}));

export default useKoiShow;
