import axiosClient from "../config/axiosClient";

const createRoundResult = (roundId) => {
  return axiosClient.post(`/round-result/finalize-round/${roundId}`);
};
const publishRoundResult = (roundId) => {
  return axiosClient.put(`/round-result/publish-round-result/${roundId}`);
};
const getRoundResult = (categoryId) => {
  return axiosClient.get(`/round-result/final-result/${categoryId}`);
};
export { createRoundResult, publishRoundResult, getRoundResult };
