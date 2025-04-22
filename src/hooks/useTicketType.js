import { create } from "zustand";
import {
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketTypes,
  getTicketOrderDetails,
  updateTicketOrderStatus as updateOrderStatusApi,
  updateTicketRefund,
  getInfoByQrCode,
  updateTicketCheckIn,
} from "../api/ticketTypeApi";
import { notification } from "antd";

const useTicketType = create((set, get) => ({
  isLoading: false,
  error: null,
  ticketTypes: [],
  totalTicketTypes: 0,
  currentPage: 1,
  pageSize: 10,
  orderDetails: [],
  isLoadingDetails: false,

  fetchTicketTypes: async (showId, page, pageSize, status = null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getTicketTypes(showId, status, page, pageSize);
      if (response?.data?.statusCode === 200) {
        set({
          ticketTypes: response,
          totalTicketTypes: response.data.data.total,
          currentPage: response.data.data.page,
          pageSize: response.data.data.size,
          isLoading: false,
        });
        return { success: true, data: response.data };
      } else {
        set({
          error: response?.data?.message || "Failed to fetch ticket types",
          isLoading: false,
        });
        return {
          success: false,
          message: response?.data?.message || "Failed to fetch ticket types",
        };
      }
    } catch (error) {
      console.error("Error fetching ticket types:", error);
      set({ error: error.message || "An error occurred", isLoading: false });
      return { success: false, message: error.message || "An error occurred" };
    }
  },

  fetchInfoByQrCode: async (ticketId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getInfoByQrCode(ticketId);
      if (response?.data?.statusCode === 200) {
        set({ isLoading: false });
        notification.success({
          message: "Thành công",
          description: response.data?.message,
        });
        return { success: true, data: response.data };
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error?.response?.data?.Error || "Đã xảy ra lỗi",
      });
      notification.error({
        message: "Lỗi",
        description:
          error?.response?.data?.Error || "Đã xảy ra lỗi khi quét mã QR",
      });
      return {
        success: false,
        error: error?.response?.data?.Error || "Đã xảy ra lỗi",
      };
    }
  },

  fetchTicketOrderDetails: async (orderId) => {
    set({ isLoadingDetails: true, error: null });
    try {
      const response = await getTicketOrderDetails(orderId);
      if (response?.data?.statusCode === 200) {
        set({
          orderDetails: response.data.data,
          isLoadingDetails: false,
        });
        return { success: true, data: response.data.data };
      } else {
        set({
          error: response?.data?.message || "Failed to fetch order details",
          isLoadingDetails: false,
        });
        return {
          success: false,
          message: response?.data?.message || "Failed to fetch order details",
        };
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      set({
        error: error.message || "An error occurred",
        isLoadingDetails: false,
      });
      return { success: false, message: error.message || "An error occurred" };
    }
  },

  createTicketType: async (showId, ticketData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await createTicket(showId, ticketData);

      if (response?.data?.statusCode === 201) {
        set({ isLoading: false });
        return { success: true, data: response.data };
      } else {
        set({
          error: response?.data?.message || "Failed to create ticket",
          isLoading: false,
        });
        return {
          success: false,
          message: response?.data?.message || "Failed to create ticket",
        };
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      set({ error: error.message || "An error occurred", isLoading: false });
      return { success: false, message: error.message || "An error occurred" };
    }
  },

  updateTicketType: async (ticketId, ticketData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await updateTicket(ticketId, ticketData);

      if (response && response.status === 200) {
        set({ isLoading: false });
        return { success: true, data: response.data };
      } else {
        set({
          error: response?.data?.message || "Failed to update ticket",
          isLoading: false,
        });
        return {
          success: false,
          message: response?.data?.message || "Failed to update ticket",
        };
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      set({ error: error.message || "An error occurred", isLoading: false });
      return { success: false, message: error.message || "An error occurred" };
    }
  },

  fetchUpdateTicketCheckIn: async (ticketId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateTicketCheckIn(ticketId);
      if (response?.data?.statusCode === 200) {
        set({ isLoading: false });
        return { success: true, data: response.data };
      } else {
        set({
          error: response?.data?.message || "Failed to update ticket check in",
          isLoading: false,
        });
        return {
          success: false,
          message:
            response?.data?.message || "Failed to update ticket check in",
        };
      }
    } catch (error) {
      console.error("Error updating ticket check in:", error);
      set({ error: error.message || "An error occurred", isLoading: false });
      return { success: false, message: error.message || "An error occurred" };
    }
  },

  deleteTicketType: async (ticketId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await deleteTicket(ticketId);

      if (response && response.status === 200) {
        set({ isLoading: false });
        return { success: true };
      } else {
        set({
          error: response?.data?.message || "Failed to delete ticket",
          isLoading: false,
        });
        return {
          success: false,
          message: response?.data?.message || "Failed to delete ticket",
        };
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      set({ error: error.message || "An error occurred", isLoading: false });
      return { success: false, message: error.message || "An error occurred" };
    }
  },

  updateTicketOrderStatus: async (orderId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateOrderStatusApi(orderId, status);
      if (response?.data?.statusCode === 200) {
        set({ isLoading: false });
        return { success: true, data: response.data };
      } else {
        set({
          error: response?.data?.message || "Failed to update order status",
          isLoading: false,
        });
        return {
          success: false,
          message: response?.data?.message || "Failed to update order status",
        };
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      set({
        error: error.message || "An error occurred",
        isLoading: false,
      });
      return { success: false, message: error.message || "An error occurred" };
    }
  },
  updateTicketRefund: async (ticketOrderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateTicketRefund(ticketOrderId);
      if (response?.data?.statusCode === 200) {
        set({ isLoading: false });
        return { success: true, data: response.data };
      } else {
        console.log(response);
        set({ isLoading: false });
        return { success: false, message: "Failed to update ticket refund" };
      }
    } catch (error) {
      console.error("Error updating ticket refund:", error);
      set({ error: error.message || "An error occurred", isLoading: false });
      return { success: false, message: error.message || "An error occurred" };
    }
  },
  resetError: () => {
    set({ error: null });
  },
}));

export default useTicketType;
