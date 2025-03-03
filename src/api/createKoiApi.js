import axiosClient from "../config/axiosClient";

const createKoi = (formData) => {
  return axiosClient.post("/koi-show/create", formData);
};
export { createKoi };
