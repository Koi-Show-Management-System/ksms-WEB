import axiosClient from "../config/axiosClient";

const getCriterias = (page, size) => {
  return axiosClient.get("/criteria/get-page", {
    params: {
      page: page,
      size: size,
    },
  });
};
const postCriteria = (data) => {
  return axiosClient.post("/criteria/create", data);
};
const updateCriteria = (id, data) => {
  return axiosClient.put(`/criteria/${id}`, data);
};
export { getCriterias, postCriteria, updateCriteria };
