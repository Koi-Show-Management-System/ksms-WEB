import axiosClient from "../config/axiosClient";

const createTicket = (showId, data) => {
  return axiosClient.post(`/ticket-type/create/${showId}`, data);
};
const updateTicket = (id, data) => {
  return axiosClient.put(`/ticket-type/${id}`, data);
};
const deleteTicket = (id) => {
  return axiosClient.delete(`/ticket-type/${id}`);
};

export { createTicket, updateTicket, deleteTicket };
