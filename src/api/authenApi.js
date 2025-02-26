import axiosClient from "../config/axiosClient";

const login = (email, password) => {
  return axiosClient.post("/auth/login", { email, password });
};

const getInfoUser = (id) => {
  return axiosClient.get(`/account/${id}`);
};

export { login, getInfoUser };
