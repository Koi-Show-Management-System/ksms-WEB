import axiosClient from "../config/axiosClient";

const createScoreByReferee = (refereeAccountId, registrationRoundId, isPass) => {
  return axiosClient.post("/score/Preliminary", {
    refereeAccountId,
    registrationRoundId,
    isPass
  });
};

export { createScoreByReferee };
