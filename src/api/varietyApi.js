import axiosClient from "../config/axiosClient";

const getVarieties = (page, size) => {
  return axiosClient.get("/variety/get-page", {
    params: {
      page: page,
      size: size,
    },
  });
};
export { getVarieties };
