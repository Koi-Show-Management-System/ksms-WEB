import axiosClient from "../config/axiosClient";

const accountTeam = (page, size, role) => {
  return axiosClient.get("/account/admin/get-paging-account", {
    params: {
      roleName: role,
      page: page,
      size: size,
    },
  });
};
const createAccount = (data) => {
  return axiosClient.post("/account/create", data);
};
const updateAccount = (id, accountData) => {
  // Kiểm tra xem accountData có phải là FormData không
  const isFormData = accountData instanceof FormData;

  // Log cho phần debug
  console.log(`updateAccount API - id: ${id}, isFormData: ${isFormData}`);

  if (isFormData) {
    console.log("FormData content (from API function):");
    for (let pair of accountData.entries()) {
      if (pair[0] === "AvatarUrl" && pair[1] instanceof File) {
        console.log(
          `${pair[0]}: File (${pair[1].name}, ${pair[1].size} bytes)`
        );
      } else {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
    }
  }

  // Nếu là FormData, đảm bảo content-type được đặt đúng
  const headers = isFormData
    ? {
        "Content-Type": "multipart/form-data",
        // Thêm cấu hình để axios không tự động chuyển đổi FormData
        "X-Requested-With": "XMLHttpRequest",
      }
    : {};

  return axiosClient.put(`/account/${id}`, accountData, {
    headers,
    // Thêm tùy chọn để không chuyển đổi dữ liệu
    transformRequest: isFormData ? [(data) => data] : undefined,
  });
};

const updateStatus = (accountId, status) => {
  // Nếu trạng thái là 'blocked', thêm tham số forceLogout=true
  const params = {
    status: status,
  };

  // Nếu trạng thái là 'blocked', thêm tham số buộc đăng xuất
  if (status === "blocked") {
    params.forceLogout = true;
  }

  return axiosClient.patch(`/account/${accountId}`, null, {
    params: params,
  });
};
const updateAccountPassword = (data) => {
  return axiosClient.put(`/auth/change-password`, data);
};
export {
  accountTeam,
  createAccount,
  updateAccount,
  updateStatus,
  updateAccountPassword,
};
