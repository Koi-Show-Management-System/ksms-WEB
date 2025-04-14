/**
 * Định dạng ngày tháng từ chuỗi ISO thành định dạng ngày/tháng/năm
 * @param {string} dateString - Chuỗi ngày tháng theo định dạng ISO
 * @returns {string} - Ngày tháng đã được định dạng
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Kiểm tra nếu date không hợp lệ
    if (isNaN(date.getTime())) {
      return "";
    }

    const day = date.getDate();
    const month = date.getMonth() + 1; // Tháng bắt đầu từ 0
    const year = date.getFullYear();

    // Định dạng DD/MM/YYYY
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
  } catch (error) {
    console.error("Lỗi khi định dạng ngày:", error);
    return "";
  }
};

/**
 * Định dạng ngày tháng và giờ từ chuỗi ISO
 * @param {string} dateString - Chuỗi ngày tháng theo định dạng ISO
 * @returns {string} - Ngày tháng và giờ đã được định dạng
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Kiểm tra nếu date không hợp lệ
    if (isNaN(date.getTime())) {
      return "";
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Định dạng DD/MM/YYYY HH:MM
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } catch (error) {
    console.error("Lỗi khi định dạng ngày giờ:", error);
    return "";
  }
};
