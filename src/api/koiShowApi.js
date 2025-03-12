import axiosClient from "../config/axiosClient";

const getKoiShowList = (page, size) => {
  return axiosClient.get("/koi-show/paged", {
    params: { page, size },
  });
};

const getKoiShowDetail = (id) => {
  return axiosClient.get(`/koi-show/${id}`);
};

const updateShow = (id, data) => {
  return axiosClient.put(`/koi-show/${id}`, data);
};
export { getKoiShowList, getKoiShowDetail, updateShow };
