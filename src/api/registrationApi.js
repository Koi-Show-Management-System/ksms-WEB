import axiosClient from "../config/axiosClient";

const getRegistration = (page, size, showIds, categoryIds) => {
  return axiosClient.get(
    "/registration/get-paging-registration-for-current-account",
    {
      params: {
        page: page,
        size: size,
        showIds: showIds,
        categoryIds: categoryIds,
      },
    }
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
