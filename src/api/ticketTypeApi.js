import axiosClient from "../config/axiosClient";

const getTicketTypes = (showId, status, page, size) => {
  return axiosClient.get(`/ticket-order/get-paging-orders`, {
    params: {
      koiShowId: showId,
      orderStatus: status,
      page: page,
      size: size,
    },
  });
};

const getInfoByQrCode = (ticketId) => {
  return axiosClient.get(`/ticket/get-info-by-qr-code?ticketId=${ticketId}`);
};

const updateTicketCheckIn = (ticketId) => {
  return axiosClient.put(`/ticket/check-in/${ticketId}`);
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
  getInfoByQrCode,
  updateTicketCheckIn,
};
