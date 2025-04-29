import axiosClient from "../config/axiosClient";

const getVarieties = (page, size) => {
  return axiosClient.get("/variety/get-page", {
    params: {
      page: page,
      size: size,
    },
  });
};

const createVariety = (variety) => {
  return axiosClient.post("/variety/create", variety);
};

const updateVariety = (id, variety) => {
  return axiosClient.put(`/variety/update/${id}`, variety);
};

export { getVarieties, createVariety, updateVariety };
