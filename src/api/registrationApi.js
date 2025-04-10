import axiosClient from "../config/axiosClient";

const getRegistration = (page, size, showIds, categoryIds, statuses) => {
  // Log để debug
  console.log("Input params:", { page, size, showIds, categoryIds, statuses });

  // Truyền tham số theo đúng cách mà Swagger đang sử dụng
  const params = {
    page,
    size,
  };

  // Thêm ShowIds nếu có
  if (showIds) {
    if (Array.isArray(showIds)) {
      params.ShowIds = showIds[0]; // Chỉ lấy phần tử đầu tiên của mảng
    } else {
      params.ShowIds = showIds;
    }
  }

  // Thêm CategoryIds nếu có
  if (categoryIds) {
    if (Array.isArray(categoryIds)) {
      params.CategoryIds = categoryIds[0]; // Chỉ lấy phần tử đầu tiên của mảng
    } else {
      params.CategoryIds = categoryIds;
    }
  }

  // Thêm Statuses nếu có
  if (statuses && statuses.length > 0) {
    // Sử dụng phương thức join để chuyển mảng thành chuỗi các giá trị cách nhau bởi dấu phẩy
    params.Status = statuses.join(",");
  }

  console.log("Request params:", params);

  return axiosClient.get(
    "/registration/get-paging-registration-for-current-account",
    { params }
  );
};

const updateStatusRegistration = (id, status, rejectedReason, refundType) => {
  let params = `status=${status}`;

  // Chỉ thêm rejectedReason khi status là rejected
  if (status === "rejected" && rejectedReason) {
    params += `&rejectedReason=${rejectedReason}`;
  }

  // Chỉ thêm refundType khi status là Refunded
  if (status === "Refunded" && refundType) {
    params += `&refundType=${refundType}`;
  }

  return axiosClient.put(`/registration/${id}?${params}`);
};

const patchRound = (roundId, registrationIds) => {
  return axiosClient.post("/registration-round/assign-to-tank", {
    roundId: roundId,
    registrationIds: registrationIds,
  });
};

export { getRegistration, updateStatusRegistration, patchRound };
