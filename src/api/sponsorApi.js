import axiosClient from "../config/axiosClient";

const getSponsor = (koiShowId) => {
  return axiosClient.get(`/sponsor/get-page/${koiShowId}`);
};
const createSponsor = (showId, sponsorData) => {
  return axiosClient.post(`/sponsor/create/${showId}`, sponsorData);
};
const updateSponsor = (id, sponsorData) => {
  return axiosClient.put(`/sponsor/${id}`, sponsorData);
};
const deleteSponsor = (id) => {
  return axiosClient.delete(`/sponsor/${id}`);
};

export { getSponsor, createSponsor, updateSponsor, deleteSponsor };
