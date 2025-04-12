import axiosClient from "../config/axiosClient";

const dashboardApi = () => {
  return axiosClient.get(`/dashboard`);
};

export default dashboardApi;
