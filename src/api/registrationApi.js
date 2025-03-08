import axiosClient from "../config/axiosClient";

const getRegistration = (page, size, showIds ) => {
  return axiosClient.get(
    "/registration/get-paging-registration-for-current-account",
    {
      params: {
        page: page,
        size: size,
        showIds: showIds
      },
    }
  );
};
export { getRegistration };