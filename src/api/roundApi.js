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

export { getRound };
