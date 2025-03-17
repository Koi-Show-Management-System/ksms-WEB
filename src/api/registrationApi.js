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

const updateStatusRegistration = (id, status) => {
  return axiosClient.put(`/registration/${id}?status=${status}`);
};

const patchRound = (roundId, registrationIds) => {
  return axiosClient.post("/registration-round/assign-to-tank", {
    roundId: roundId,
    registrationIds: registrationIds,
  });
};

export { getRegistration, updateStatusRegistration, patchRound };
