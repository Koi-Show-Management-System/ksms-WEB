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

const getNextRound = (roundId) => {
  return axiosClient.get(`/round/get-next-round/${roundId}`);
};

const unpublishRound = async (roundId) => {
  try {
    const response = await axiosClient.put(`/rounds/${roundId}/unpublish`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getRound,
  getRoundTypeByReferee,
  updatePublishRound,
  getNextRound,
  unpublishRound,
};
