import axiosClient from "../config/axiosClient";

const dashboardApi = (koiShowId = null) => {
  if (koiShowId) {
    return axiosClient.get(`/dashboard?koiShowId=${koiShowId}`);
  }
  return axiosClient.get(`/dashboard`);
};

export default dashboardApi;
