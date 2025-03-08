import axiosClient from "../config/axiosClient";

const showStaff = (page, size, role, showId) => {
  return axiosClient.get(`/show-staff-manager/get-page/${showId}`, {
    params: {
      role: role,
      page: page,
      size: size,
    },
  });
  const createShowStaff = (data) => {
    return axiosClient.post("/show-staff-manager/create", data);
  };
};

export { showStaff };
