import axiosClient from "../config/axiosClient";

const getRegistrationRound = (roundId, page, size) => {
  return axiosClient.get(`/registration-round/${roundId}`, {
    params: {
      page: page,
      size: size,
    },
  });
};

const updateFishTank = (registrationRoundId, tankId) => {
  return axiosClient.put("/registration-round/update-fish-tank", [
    {
      registrationRoundId: registrationRoundId,
      tankId: tankId,
    },
  ]);
};
const getRegistrationRoundByReferee = (registrationId, roundId) => {
  return axiosClient.get(
    "/registration-round/get-registration-round-for-referee",
    {
      params: {
        registrationId: registrationId,
        roundId: roundId,
      },
    }
  );
};
const getAssignedRound = (categoryId, roundId) => {
  return axiosClient.get("/registration-round/get-assigned-round", {
    params: {
      categoryId: categoryId,
      roundId: roundId,
    },
  });
};

// Add new API function to assign registrations to first round
const assignToFirstRound = (categoryId, registrationIds) => {
  return axiosClient.post("/registration-round/assign-to-first-round", {
    categoryId: categoryId,
    registrationIds: registrationIds,
  });
};

export {
  getRegistrationRound,
  updateFishTank,
  getRegistrationRoundByReferee,
  getAssignedRound,
  assignToFirstRound,
};
