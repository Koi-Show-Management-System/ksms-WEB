import axiosClient from "../config/axiosClient";

const getRule = (showId, page, size) => {
  return axiosClient.get(`show-rule/get-page/${showId}`, {
    params: {
      page: page,
      size: size,
    },
  });
};
const createRule = (showId, data) => {
  return axiosClient.post(`show-rule/create/${showId}`, data);
};
const updateRule = (id, data) => {
  return axiosClient.put(`show-rule/${id}`, data);
};
const deleteRule = (id) => {
  return axiosClient.delete(`show-rule/${id}`);
};
export { getRule, createRule, updateRule, deleteRule };
