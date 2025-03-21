import axiosClient from "../config/axiosClient";

const getRound = (competitionCategoryId, roundType, page, size) => {
  return axiosClient.get(`/round/${competitionCategoryId}`, {
    params: {
      roundType: roundType,
      page: page,
      size: size,
    },
  });
};
const updatePublishRound = (roundId) => {
  return axiosClient.put(
    `/registration-round/publish-registration-round/${roundId}`
  );
};

const getRoundTypeByReferee = (competitionCategoryId) => {
  return axiosClient.get(
    `/round/get-round-type-for-referee/${competitionCategoryId}`
  );
};

export { getRound, getRoundTypeByReferee, updatePublishRound };
