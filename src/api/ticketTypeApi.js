import axiosClient from "../config/axiosClient";

const getTicketTypes = (showId, page, size) => {
  return axiosClient.get(`/ticket-order/get-paging-orders`, {
    params: {
      koiShowId: showId,
      page: page,
      size: size,
    },
  });
};

const getTicketOrderDetails = (orderId) => {
  return axiosClient.get(`/ticket-order/get-order-details/${orderId}`);
};

const updateTicketRefund = (ticketOrderId) => {
  return axiosClient.put(`/ticket/mark-as-refunded/${ticketOrderId}`);
};

const createTicket = (showId, data) => {
  return axiosClient.post(`/ticket-type/create/${showId}`, data);
};

const updateTicket = (id, data) => {
  return axiosClient.put(`/ticket-type/${id}`, data);
};

const deleteTicket = (id) => {
  return axiosClient.delete(`/ticket-type/${id}`);
};

const updateTicketOrderStatus = (orderId, status) => {
  return axiosClient.patch(`/ticket-order/update-status/${orderId}`, {
    status,
  });
};

export {
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketTypes,
  getTicketOrderDetails,
  updateTicketOrderStatus,
  updateTicketRefund,
};
