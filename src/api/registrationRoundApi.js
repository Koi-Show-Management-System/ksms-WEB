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

export { getRegistrationRound, updateFishTank, getRegistrationRoundByReferee };
