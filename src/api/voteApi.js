import axiosClient from "../config/axiosClient";

const getAllVote = (showId) => {
  return axiosClient.get(`/vote/staff/get-registration-for-voting/${showId}`);
};

const updateEnableVote = (showId, enable) => {
  return axiosClient.put(`/vote/enable-voting/${showId}`, {
    enable,
  });
};

const updateDisableVote = (showId) => {
  return axiosClient.put(`/vote/disable-voting/${showId}`);
};

export { getAllVote, updateEnableVote, updateDisableVote };
