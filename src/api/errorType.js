import axiosClient from "../config/axiosClient";

const createErrorType = async (criteriaId, name) => {
  return axiosClient.post(`/error-type/create`, {
    criteriaId,
    name,
  });
};

export { createErrorType };
