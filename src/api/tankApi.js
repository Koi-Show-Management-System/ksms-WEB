import axiosClient from "../config/axiosClient";

const getTank = (id, page, size) => {
  return axiosClient.get(`/tank/${id}/paged`, {
    params: {
      page: page,
      size: size,
    },
  });
};

const createTank = (tankData) => {
  return axiosClient.post("/tank/create", tankData);
};

const updateTank = (id, data) => {
  return axiosClient.put(`/tank/${id}`, data);
};

export { getTank, createTank, updateTank };
