import axiosClient from "../config/axiosClient";

const getRegistration = (page, size, showIds) => {
  return axiosClient.get(
    "/registration/get-paging-registration-for-current-account",
    {
      params: {
        page: page,
        size: size,
        showIds: showIds,
      },
    }
  );
};
const assignTank = (data) => {
  return axiosClient.patch("/registration/assign-to-tank", data);
};
const updateStatusRegistration = (id, status) => {
  return axiosClient.put(`/registration/${id}?status=${status}`);
};
export { getRegistration, updateStatusRegistration, assignTank };
