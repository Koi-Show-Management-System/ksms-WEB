import axiosClient from "../config/axiosClient";

const createRoundResult = (roundId) => {
  return axiosClient.post(`/round-result/finalize-round/${roundId}`);
};

export { createRoundResult };
