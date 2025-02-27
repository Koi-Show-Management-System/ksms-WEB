import axiosClient from "../config/axiosClient";

const accountTeam = (page, size) => {
  return axiosClient.get("/account/admin/get-all-user-account", {
    params: {
      page: page,
      size: size,
    },
  });
};
const createAccount = (data) => {
  return axiosClient.post("/account/create", data);
};
const updateAccount = (id, accountData) => {
  return axiosClient.put(`/account/${id}`, accountData);
};

const updateStatus = (accountId, status) => {
  return axiosClient.patch(`/account/${accountId}`, null, {
    params: {
      status: status,
    },
  });
};
export { accountTeam, createAccount, updateAccount, updateStatus };
