import axiosClient from "../config/axiosClient";

const createScoreByReferee = (
  refereeAccountId,
  registrationRoundId,
  isPass
) => {
  return axiosClient.post("/score/Preliminary", {
    refereeAccountId,
    registrationRoundId,
    isPass,
  });
};

const createScoreEvaluationByReferee = (scoreData) => {
  return axiosClient.post("/score/create-score", scoreData);
};

const getScoreDetail = (registrationRoundId) => {
  return axiosClient.get(`/score/get-score-detail/${registrationRoundId}`);
};

export { createScoreByReferee, createScoreEvaluationByReferee, getScoreDetail };
