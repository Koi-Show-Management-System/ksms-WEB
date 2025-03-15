import axiosClient from "../config/axiosClient";

const getCategory = (id, page, size) => {
  return axiosClient.get(`/competition-category/get-page`, {
    params: {
      showId: id,
      page: page,
      size: size,
    },
  });
};

const getDetail = (id) => {
  return axiosClient.get(`/competition-category/${id}`);
};
const createCategory = (categoryData) => {
  return axiosClient.post("/competition-category/create", categoryData);
};
const updateCategory = (id, data) => {
  return axiosClient.put(`/competition-category/${id}`, data);
};

export { getCategory, getDetail, createCategory, updateCategory };
