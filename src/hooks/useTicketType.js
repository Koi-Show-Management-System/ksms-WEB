import { create } from "zustand";
import { createTicket, updateTicket, deleteTicket } from "../api/ticketTypeApi";

const useTicketType = create((set, get) => ({
  isLoading: false,
  error: null,

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
}));

export default useTicketType;
