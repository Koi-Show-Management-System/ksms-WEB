import axiosClient from "../config/axiosClient";

const getRegistration = (
  page,
  size,
  showIds,
  categoryIds,
  statuses,
  registrationNumber
) => {
  const params = {
    page,
    size,
  };

  // Thêm ShowIds nếu có
  if (showIds) {
    if (Array.isArray(showIds)) {
      params.ShowIds = showIds[0];
    } else {
      params.ShowIds = showIds;
    }
  }

  // Thêm CategoryIds nếu có
  if (categoryIds) {
    if (Array.isArray(categoryIds)) {
      params.CategoryIds = categoryIds[0];
    } else {
      params.CategoryIds = categoryIds;
    }
  }

  if (statuses && statuses.length > 0) {
    params.Status = statuses.join(",");
  }

  // Thêm registrationNumber nếu có
  if (registrationNumber) {
    params.RegistrationNumber = registrationNumber;
  }

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

const patchRound = (
  roundId,
  registrationIds,
  currentRoundId = null,
  page = 1,
  size = 10
) => {
  return axiosClient.post(
    `/registration-round/assign-to-tank?currentRoundId=${currentRoundId}`,
    {
      roundId: roundId,
      registrationIds: registrationIds,
      page: page,
      size: size,
    }
  );
};

const CheckOutKoi = (registrationId, imgCheckOut, notes) => {
  const data = {};

  if (imgCheckOut) {
    data.imgCheckOut = imgCheckOut;
  }

  if (notes) {
    data.notes = notes;
  }

  return axiosClient.post(
    `/registration/check-out-koi/${registrationId}`,
    data
  );
};

const getRegistrationByNumber = (registrationNumber) => {
  return axiosClient.get(`/registration/by-number/${registrationNumber}`);
};

export {
  getRegistration,
  updateStatusRegistration,
  patchRound,
  CheckOutKoi,
  getRegistrationByNumber,
};
