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
// const assignTank = (roundId, registrationIds) => {
//   return axiosClient.patch("/registration/assign-to-tank", {
//     roundId: roundId,
//     registrationIds: registrationIds,
//   });
// };
const updateStatusRegistration = (id, status) => {
  return axiosClient.put(`/registration/${id}?status=${status}`);
};

const patchTank = (roundId, registrationIds) => {
  return axiosClient.post("/registration/assign-to-tank", {
    roundId: roundId,
    registrationIds: registrationIds,
  });
};
export { getRegistration, updateStatusRegistration, patchTank };
