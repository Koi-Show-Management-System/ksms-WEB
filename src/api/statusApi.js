import axiosClient from "../config/axiosClient";

const updateStatus = (showId, status) => {
  return axiosClient.put(`/show-status/${showId}`, { status });
};

// Hàm cập nhật danh sách trạng thái triển lãm
const updateShowStatuses = (showId, statusList) => {
  return axiosClient.put(`/show-status/${showId}`, statusList);
};

export { updateStatus, updateShowStatuses };
