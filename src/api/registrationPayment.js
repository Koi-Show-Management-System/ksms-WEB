import axiosClient from "../config/axiosClient";

const getRegistrationPayment = (registrationId) => {
  return axiosClient.get(`/registration-payment/checkin-info/${registrationId}`);
};

export { getRegistrationPayment };
