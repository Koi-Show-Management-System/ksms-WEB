import axiosClient from "../config/axiosClient";

const CreateLiveStream = (koiShowId) => {
  return axiosClient.post(`livestream/create/${koiShowId}`);
};

const EndLiveStream = (livestreamId) => {
  return axiosClient.post(`livestream/end/${livestreamId}`);
};

const GetHostToken = (livestreamId) => {
  return axiosClient.get(`livestream/token/${livestreamId}`);
};

const GetViewerToken = (livestreamId) => {
  return axiosClient.get(`livestream/viewer-token/${livestreamId}`);
};

export { CreateLiveStream, EndLiveStream, GetHostToken, GetViewerToken };
