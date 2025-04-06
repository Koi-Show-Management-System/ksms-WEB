import axiosClient from "../config/axiosClient";

const showStaff = (page, size, role, showId) => {
  return axiosClient.get(`/show-staff-manager/get-page/${showId}`, {
    params: {
      role: role,
      page: page,
      size: size,
    },
  });
};
const createShowStaff = (showId, accountId) => {
  return axiosClient.post(
    `/show-staff-manager/add-staff-or-manager/${showId}/${accountId}`
  );
};
const deleteShowStaff = (id) => {
  return axiosClient.delete(`/show-staff-manager/${id}`);
};

export { showStaff, createShowStaff, deleteShowStaff };
