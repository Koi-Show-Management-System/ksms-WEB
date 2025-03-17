import axiosClient from "../config/axiosClient";

const getRegistrationRound = (roundId, page, size) => {
  return axiosClient.get(`/registration-round/${roundId}`, {
    params: {
      page: page,
      size: size,
    },
  });
};
export { getRegistrationRound };
