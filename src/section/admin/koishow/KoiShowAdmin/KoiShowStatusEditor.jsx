import React, { useState, useEffect } from "react";
import { DatePicker, Button, message, TimePicker, Space } from "antd";
import dayjs from "dayjs";
import { SaveOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";

const KoiShowStatusEditor = ({
  showId,
  availableStatuses,
  showStartDate,
  showEndDate,
  statusOrder,
  statusUIConfig,
  updateShowStatus,
  fetchKoiShowDetail,
  translateStatus,
  onLoadingChange,
  disabled = false,
  canEdit = true,
  localShowStatus,
  setAvailableStatuses,
}) => {
  // State cho chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  // State cho các trạng thái đang chỉnh sửa
  const [editingStatuses, setEditingStatuses] = useState({});
  // State for errors
  const [errors, setErrors] = useState({});
  // Button loading state
  const [isLoading, setIsLoading] = useState(false);

  // Start edit with additional check for showStatus
  const startEdit = () => {
    // Don't allow editing for certain show statuses
    if (
      disabled ||
      (localShowStatus &&
        [
          "published",
          "upcoming",
          "inprogress",
          "finished",
          "cancelled",
        ].includes(localShowStatus))
    )
      return;

    // Khởi tạo state chỉnh sửa cho tất cả các trạng thái đã được chọn
    const initialEditingValues = {};
    availableStatuses
      .filter((status) => status.selected && status.statusName !== "Finished")
      .forEach((status) => {
        initialEditingValues[status.statusName] = {
          startDate: status.startDate,
          endDate: status.endDate,
        };
      });

    setEditingStatuses(initialEditingValues);
    setIsEditing(true);
  };

  // Hủy chỉnh sửa
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingStatuses({});
    setErrors({});
  };

  // Xử lý thay đổi ngày giờ
  const handleStatusDateChange = (statusName, field, value) => {
    // Thực hiện các kiểm tra phù hợp với loại trạng thái
    if (statusName === "RegistrationOpen") {
      // Kiểm tra cho trạng thái RegistrationOpen
      if (field === "startDate" && value) {
        // Kiểm tra với trạng thái tiếp theo
        const nextStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === statusOrder[statusName] + 1
        );

        if (nextStatusName && editingStatuses[nextStatusName]?.startDate) {
          const nextStatus = editingStatuses[nextStatusName];
          // Thời gian kết thúc RegistrationOpen phải trước thời gian bắt đầu của trạng thái tiếp theo
          if (value.isAfter(nextStatus.startDate)) {
            message.error(
              `Thời gian bắt đầu đăng ký phải trước thời gian bắt đầu của ${
                statusUIConfig[nextStatusName]?.label || nextStatusName
              }`
            );
            return;
          }
        }
      }

      if (field === "endDate" && value) {
        // Kiểm tra endDate với startDate của cùng trạng thái
        if (
          editingStatuses[statusName]?.startDate &&
          value.isBefore(editingStatuses[statusName].startDate)
        ) {
          message.error(
            "Thời gian kết thúc đăng ký phải sau thời gian bắt đầu đăng ký"
          );
          return;
        }

        // Kiểm tra với trạng thái tiếp theo
        const nextStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === statusOrder[statusName] + 1
        );

        if (nextStatusName && editingStatuses[nextStatusName]?.startDate) {
          const nextStatus = editingStatuses[nextStatusName];
          // Thời gian kết thúc RegistrationOpen phải trước thời gian bắt đầu của trạng thái tiếp theo
          if (value.isAfter(nextStatus.startDate)) {
            message.error(
              `Thời gian kết thúc đăng ký phải trước thời gian bắt đầu của ${
                statusUIConfig[nextStatusName]?.label || nextStatusName
              }`
            );
            return;
          }
        }

        // Nên kiểm tra với showStartDate nếu có
        if (showStartDate && dayjs(showStartDate).isValid()) {
          const exhibitionStartDay = dayjs(showStartDate).startOf("day");
          const selectedDay = value.startOf("day");

          if (!selectedDay.isBefore(exhibitionStartDay)) {
            message.error(
              "Ngày kết thúc đăng ký phải trước ngày bắt đầu triển lãm"
            );
            return;
          }
        }
      }
    } else if (statusName === "Finished") {
      // Bỏ logic xử lý đặc biệt cho trạng thái Finished
      // Trạng thái Finished sẽ được xử lý như một trạng thái cố định không cần chỉnh sửa
      return;
    } else {
      // Kiểm tra cho các trạng thái khác (giữ lại logic hiện tại)
      if (field === "startDate" && value) {
        // Kiểm tra với showStartDate nếu có
        if (showStartDate && dayjs(showStartDate).isValid()) {
          const exhibitionStartDay = dayjs(showStartDate);
          if (value.isBefore(exhibitionStartDay)) {
            message.error(
              `Thời gian bắt đầu của ${translateStatus(statusName)} không được trước ngày bắt đầu triển lãm`
            );
            return;
          }
        }

        // Kiểm tra với showEndDate nếu có
        if (showEndDate && dayjs(showEndDate).isValid()) {
          const exhibitionEndDay = dayjs(showEndDate);
          if (value.isAfter(exhibitionEndDay)) {
            message.error(
              `Thời gian bắt đầu của ${translateStatus(statusName)} không được sau ngày kết thúc triển lãm`
            );
            return;
          }
        }

        // Các kiểm tra như đã có
        const prevStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === statusOrder[statusName] - 1
        );

        if (prevStatusName && editingStatuses[prevStatusName]?.endDate) {
          const prevStatus = editingStatuses[prevStatusName];
          if (value.isBefore(prevStatus.endDate)) {
            message.error(
              `Thời gian bắt đầu phải sau hoặc bằng thời gian kết thúc của ${
                statusUIConfig[prevStatusName]?.label || prevStatusName
              }`
            );
            return;
          }
        }
      }

      if (field === "endDate" && value) {
        // Kiểm tra với showStartDate nếu có
        if (showStartDate && dayjs(showStartDate).isValid()) {
          const exhibitionStartDay = dayjs(showStartDate);
          if (value.isBefore(exhibitionStartDay)) {
            message.error(
              `Thời gian kết thúc của ${translateStatus(statusName)} không được trước ngày bắt đầu triển lãm`
            );
            return;
          }
        }

        // Kiểm tra với showEndDate nếu có
        if (showEndDate && dayjs(showEndDate).isValid()) {
          const exhibitionEndDay = dayjs(showEndDate);
          if (value.isAfter(exhibitionEndDay)) {
            message.error(
              `Thời gian kết thúc của ${translateStatus(statusName)} không được sau ngày kết thúc triển lãm`
            );
            return;
          }
        }

        // Kiểm tra endDate phải sau startDate
        if (
          editingStatuses[statusName]?.startDate &&
          value.isBefore(editingStatuses[statusName].startDate)
        ) {
          message.error("Thời gian kết thúc phải sau thời gian bắt đầu");
          return;
        }

        // Kiểm tra với trạng thái tiếp theo
        const nextStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === statusOrder[statusName] + 1
        );

        if (nextStatusName && editingStatuses[nextStatusName]?.startDate) {
          const nextStatus = editingStatuses[nextStatusName];
          if (value.isAfter(nextStatus.startDate)) {
            message.error(
              `Thời gian kết thúc phải trước hoặc bằng thời gian bắt đầu của ${
                statusUIConfig[nextStatusName]?.label || nextStatusName
              }`
            );
            return;
          }
        }
      }
    }

    setEditingStatuses((prev) => ({
      ...prev,
      [statusName]: {
        ...prev[statusName],
        [field]: value,
      },
    }));

    // Kiểm tra với trạng thái Finished
    if (statusName !== "Finished" && field === "startDate" && value) {
      const finishedStatus = editingStatuses["Finished"];
      if (
        finishedStatus?.startDate &&
        value.isAfter(finishedStatus.startDate)
      ) {
        setErrors((prev) => ({
          ...prev,
          [statusName]:
            "Thời gian không được vượt quá thời gian kết thúc sự kiện",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[statusName];
          return newErrors;
        });
      }
    }
  };

  // Lưu tất cả thay đổi
  const saveAllChanges = async () => {
    const validationErrors = [];

    // Tìm thời gian bắt đầu và kết thúc sự kiện từ trạng thái
    const eventStartTime = editingStatuses["RegistrationOpen"]?.startDate;

    // Kiểm tra các trạng thái từ KoiCheckIn đến Finished nằm trong khoảng thời gian triển lãm
    if (
      showStartDate &&
      showEndDate &&
      dayjs(showStartDate).isValid() &&
      dayjs(showEndDate).isValid()
    ) {
      const exhibitionStartDay = dayjs(showStartDate);
      const exhibitionEndDay = dayjs(showEndDate);

      Object.entries(editingStatuses).forEach(([statusName, status]) => {
        // Bỏ qua RegistrationOpen vì nó được phép nằm trước showStartDate
        if (statusName !== "RegistrationOpen") {
          // Kiểm tra startDate không được trước ngày bắt đầu triển lãm
          if (
            status.startDate &&
            status.startDate.isBefore(exhibitionStartDay)
          ) {
            validationErrors.push(
              `Thời gian bắt đầu của ${translateStatus(
                statusName
              )} không được trước ngày bắt đầu triển lãm`
            );
          }

          // Kiểm tra endDate không được sau ngày kết thúc triển lãm
          if (status.endDate && status.endDate.isAfter(exhibitionEndDay)) {
            validationErrors.push(
              `Thời gian kết thúc của ${translateStatus(
                statusName
              )} không được sau ngày kết thúc triển lãm`
            );
          }
        }
      });
    }

    // Kiểm tra logic thời gian
    Object.values(statusOrder).forEach((orderValue, index, arr) => {
      if (index < arr.length - 1) {
        const currentStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === orderValue
        );
        const nextStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === orderValue + 1
        );

        // Bỏ qua kiểm tra cho Finished
        if (
          currentStatusName &&
          nextStatusName &&
          nextStatusName !== "Finished" &&
          editingStatuses[currentStatusName]?.endDate &&
          editingStatuses[nextStatusName]?.startDate &&
          currentStatusName !== "Award" // Bỏ qua kiểm tra cho trạng thái Finished
        ) {
          const currentStatus = editingStatuses[currentStatusName];
          const nextStatus = editingStatuses[nextStatusName];

          // Kiểm tra nếu ngày bắt đầu của trạng thái tiếp theo trước ngày kết thúc của trạng thái hiện tại
          // Đã sửa: Cho phép ngày bắt đầu = ngày kết thúc (chỉ lỗi khi bắt đầu < kết thúc)
          if (nextStatus.startDate.isBefore(currentStatus.endDate)) {
            validationErrors.push(
              `Ngày bắt đầu của ${translateStatus(
                nextStatusName
              )} phải sau hoặc bằng ngày kết thúc của ${translateStatus(
                currentStatusName
              )}`
            );
          }
        }
      }
    });

    // Kiểm tra từng trạng thái riêng biệt
    Object.entries(editingStatuses).forEach(([statusName, status]) => {
      // Bỏ qua kiểm tra cho Finished
      if (statusName === "Finished") return;

      // Kiểm tra nếu startDate sau endDate
      if (
        status.startDate &&
        status.endDate &&
        status.startDate.isAfter(status.endDate)
      ) {
        validationErrors.push(
          `Ngày bắt đầu của ${translateStatus(
            statusName
          )} không thể sau ngày kết thúc`
        );
      }

      // Kiểm tra nếu startDate < eventStartTime
      if (
        status.startDate &&
        eventStartTime &&
        status.startDate.isBefore(eventStartTime) &&
        statusName !== "RegistrationOpen" // Bỏ qua kiểm tra này cho RegistrationOpen
      ) {
        validationErrors.push(
          `Ngày bắt đầu của ${translateStatus(
            statusName
          )} không thể trước ngày bắt đầu sự kiện (${eventStartTime.format(
            "DD/MM/YYYY HH:mm"
          )})`
        );
      }
    });

    if (validationErrors.length > 0) {
      // Hiển thị thông báo lỗi với định dạng dễ đọc hơn
      message.error(
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            Vui lòng sửa các lỗi sau:
          </div>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            {validationErrors.map((error, index) => (
              <li key={index} style={{ marginBottom: "4px" }}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    // Tiếp tục với việc lưu các thay đổi nếu không có lỗi
    setIsEditing(false);
    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    try {
      const statusesToUpdate = Object.keys(editingStatuses).map(
        (statusName) => {
          const editedStatus = editingStatuses[statusName];
          // Find the original status to keep the description
          const originalStatus = availableStatuses.find(
            (status) => status.statusName === statusName
          );

          return {
            statusName,
            // Keep the original description instead of using label
            description:
              originalStatus?.description || translateStatus(statusName),
            startDate: editedStatus.startDate,
            endDate: editedStatus.endDate,
          };
        }
      );

      // Add Finished status with fixed time (if needed)
      const finishedStatus = availableStatuses.find(
        (status) => status.statusName === "Finished" && status.selected
      );

      if (finishedStatus) {
        // Use showEndDate or default to the current time + 30 minutes
        const finishedTime = showEndDate
          ? dayjs(showEndDate)
          : dayjs().add(30, "minutes");

        statusesToUpdate.push({
          statusName: "Finished",
          description: finishedStatus.description || "Kết thúc sự kiện",
          startDate: finishedTime,
          endDate: finishedTime.clone().add(30, "minutes"),
        });
      }

      // Gọi API với một mảng các trạng thái thay vì gửi từng trạng thái riêng lẻ
      updateShowStatus(showId, statusesToUpdate)
        .then(() => {
          // Cập nhật state local với giá trị đã chỉnh sửa
          setAvailableStatuses((prevStatuses) =>
            prevStatuses.map((status) => {
              if (editingStatuses[status.statusName]) {
                return {
                  ...status,
                  startDate: editingStatuses[status.statusName].startDate,
                  endDate: editingStatuses[status.statusName].endDate,
                };
              }
              return status;
            })
          );

          // Sau khi cập nhật thành công, lấy dữ liệu mới từ server
          fetchKoiShowDetail(showId)
            .then((response) => {
              if (response && response.data) {
                console.log("Đã tải lại dữ liệu triển lãm sau khi cập nhật");
              }
            })
            .catch((fetchError) => {
              console.error("Không thể tải lại dữ liệu triển lãm:", fetchError);
            });
        })
        .catch((error) => {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          message.error("Có lỗi xảy ra khi cập nhật trạng thái");
        })
        .finally(() => {
          setIsLoading(false);
          if (onLoadingChange) onLoadingChange(false);
        });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      message.error("Có lỗi xảy ra khi cập nhật trạng thái");
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  // Render editor controls
  const renderDateTimePickers = (status) => {
    if (!isEditing) return null;

    // Không hiển thị phần chỉnh sửa cho trạng thái Finished
    if (status.statusName === "Finished") {
      return null;
    }

    if (status.statusName === "RegistrationOpen") {
      return (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div>
              <div className="mb-1">
                <label className="block text-xs mb-1">Ngày bắt đầu:</label>
                <DatePicker
                  showTime={{ defaultValue: null }}
                  className="w-full"
                  size="small"
                  value={editingStatuses[status.statusName]?.startDate}
                  onChange={(value) =>
                    handleStatusDateChange(
                      status.statusName,
                      "startDate",
                      value
                    )
                  }
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="Chọn ngày bắt đầu"
                  showNow={false}
                  popupClassName="timezone-popup"
                  renderExtraFooter={() => (
                    <div className="text-xs text-gray-500 text-right"></div>
                  )}
                  disabledDate={(current) => {
                    return false;
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1">
                <label className="block text-xs mb-1">Ngày kết thúc:</label>
                <DatePicker
                  showTime={{ defaultValue: null }}
                  className="w-full"
                  size="small"
                  value={editingStatuses[status.statusName]?.endDate}
                  onChange={(value) =>
                    handleStatusDateChange(status.statusName, "endDate", value)
                  }
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="Chọn ngày kết thúc"
                  showNow={false}
                  popupClassName="timezone-popup"
                  renderExtraFooter={() => (
                    <div className="text-xs text-gray-500 text-right"></div>
                  )}
                  disabledDate={(current) => {
                    if (
                      editingStatuses[status.statusName]?.startDate &&
                      current.isBefore(
                        editingStatuses[status.statusName].startDate,
                        "day"
                      )
                    ) {
                      return true;
                    }
                    return false;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div>
              <div className="mb-1">
                <label className="block text-xs mb-1">Ngày diễn ra:</label>
                <DatePicker
                  className="w-full"
                  size="small"
                  value={editingStatuses[status.statusName]?.startDate}
                  onChange={(value) => {
                    handleStatusDateChange(
                      status.statusName,
                      "startDate",
                      value
                    );
                  }}
                  format="YYYY-MM-DD"
                  placeholder="Chọn ngày"
                  disabledDate={(current) => {
                    return false;
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1">Giờ bắt đầu:</label>
                  <TimePicker
                    className="w-full"
                    size="small"
                    value={editingStatuses[status.statusName]?.startDate}
                    onChange={(value) => {
                      handleStatusDateChange(
                        status.statusName,
                        "startDate",
                        value
                      );
                    }}
                    format="HH:mm"
                    placeholder="Giờ bắt đầu"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Giờ kết thúc:</label>
                  <TimePicker
                    className="w-full"
                    size="small"
                    value={editingStatuses[status.statusName]?.endDate}
                    onChange={(value) => {
                      handleStatusDateChange(
                        status.statusName,
                        "endDate",
                        value
                      );
                    }}
                    format="HH:mm"
                    placeholder="Giờ kết thúc"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return {
    isEditing,
    renderDateTimePickers,
    renderEditButtons: () => {
      if (!canEdit) return null;

      return (
        <>
          {isEditing ? (
            <Space className="ml-2">
              <Button
                type="text"
                onClick={saveAllChanges}
                loading={isLoading}
                icon={<SaveOutlined />}
              ></Button>
              <Button
                type="text"
                onClick={cancelEdit}
                icon={<CloseOutlined />}
              ></Button>
            </Space>
          ) : (
            <Space className="ml-2">
              <Button
                type="text"
                onClick={startEdit}
                icon={<EditOutlined />}
                className="text-blue-500"
              ></Button>
            </Space>
          )}
        </>
      );
    },
  };
};

export default KoiShowStatusEditor;
