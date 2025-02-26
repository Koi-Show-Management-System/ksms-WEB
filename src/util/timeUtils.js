export const formatTime = (timeString) => {
  const time = new Date(`1970-01-01T${timeString}Z`);
  const hours = time.getHours();
  const minutes = time.getMinutes();

  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  return formattedTime;
};
