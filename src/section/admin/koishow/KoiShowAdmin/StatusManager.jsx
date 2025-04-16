import React, { useState, useEffect } from "react";
import {
  Timeline,
  Card,
  DatePicker,
  Button,
  notification,
  TimePicker,
  message,
  Checkbox,
  Tooltip,
  Table,
  Typography,
  Popconfirm,
  Input,
  Form,
  Space,
  Modal,
  Select,
} from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import useStatus from "../../../../hooks/useStatus";
import useKoiShow from "../../../../hooks/useKoiShow";

// Cài đặt plugins cho dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
// Thiết lập timezone mặc định là UTC+7
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const StatusManager = ({ showId, showStatuses, disabled = false }) => {
  // Sử dụng hook useStatus để update trạng thái
  const { updateShowStatus, isLoading } = useStatus();
  const { fetchKoiShowDetail } = useKoiShow();

  // State cho danh sách trạng thái
  const [availableStatuses, setAvailableStatuses] = useState([]);
  // State cho chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  // State cho các trạng thái đang chỉnh sửa
  const [editingStatuses, setEditingStatuses] = useState({});
  // State for errors
  const [errors, setErrors] = useState({});
  // State cho hiển thị modal JSON
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  const [statusJson, setStatusJson] = useState("");
  // State cho trạng thái loading
  const [loading, setLoading] = useState(false);

  // Thứ tự các trạng thái
  const statusOrder = {
    RegistrationOpen: 1,
    KoiCheckIn: 2,
    TicketCheckIn: 3,
    Preliminary: 4,
    Evaluation: 5,
    Final: 6,
    Exhibition: 7,
    PublicResult: 8,
    Award: 9,
    Finished: 10,
  };

  // Các trạng thái của triển lãm
  const statusMapping = {
    RegistrationOpen: {
      label: "Mở Đăng Ký",
      description: "Giai đoạn đăng ký",
      color: "blue",
    },
    KoiCheckIn: {
      label: "Điểm Danh",
      description: "Giai đoạn check-in cá koi",
      color: "cyan",
    },
    TicketCheckIn: {
      label: "Vé vào",
      description: "Giai đoạn check-in vé",
      color: "red",
    },
    Preliminary: {
      label: "Vòng Sơ Khảo",
      description: "Vòng sơ khảo",
      color: "green",
    },
    Evaluation: {
      label: "Vòng Đánh Giá",
      description: "Vòng đánh giá chính",
      color: "purple",
    },
    Final: {
      label: "Vòng Chung Kết",
      description: "Vòng chung kết",
      color: "orange",
    },
    Exhibition: {
      label: "Triển Lãm",
      description: "Triển lãm cá koi",
      color: "teal",
    },
    PublicResult: {
      label: "Công bố kết quả",
      description: "Công bố kết quả",
      color: "yellow",
    },
    Award: { label: "Trao giải", description: "Lễ trao giải", color: "black" },
    Finished: {
      label: "Kết thúc sự kiện",
      description: "Kết thúc sự kiện",
      color: "brown",
    },
  };

  // Hàm dịch tên trạng thái
  const translateStatus = (statusName) => {
    return statusMapping[statusName]?.label || statusName;
  };

  // Hàm format date
  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

  // Khởi tạo trạng thái từ dữ liệu triển lãm
  useEffect(() => {
    if (showStatuses && showStatuses.length > 0) {
      // Tạo đối tượng chứa tất cả các trạng thái có sẵn
      const initialStatuses = Object.entries(statusMapping).map(
        ([statusName, { label, description }]) => ({
          statusName,
          label,
          description,
          startDate: null,
          endDate: null,
          isActive: false,
          selected: false,
        })
      );

      // Cập nhật trạng thái từ dữ liệu hiện có
      const updatedStatuses = initialStatuses.map((status) => {
        const existingStatus = showStatuses.find(
          (s) => s.statusName === status.statusName
        );
        if (existingStatus) {
          return {
            ...status,
            startDate: existingStatus.startDate
              ? dayjs(existingStatus.startDate)
              : null,
            endDate: existingStatus.endDate
              ? dayjs(existingStatus.endDate)
              : null,
            isActive: existingStatus.isActive,
            selected: true,
          };
        }
        return status;
      });

      setAvailableStatuses(updatedStatuses);
    }
  }, [showStatuses]);

  // Bắt đầu chỉnh sửa
  const startEdit = () => {
    if (disabled) return;

    // Khởi tạo state chỉnh sửa cho tất cả các trạng thái đã được chọn
    const initialEditingValues = {};
    availableStatuses
      .filter((status) => status.selected)
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
    const errors = [];

    // Tìm thời gian bắt đầu và kết thúc sự kiện từ trạng thái
    const eventStartTime = editingStatuses["RegistrationOpen"]?.startDate;
    const eventEndTime = editingStatuses["Finished"]?.startDate;

    // Kiểm tra logic thời gian
    Object.values(statusOrder).forEach((orderValue, index, arr) => {
      if (index < arr.length - 1) {
        const currentStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === orderValue
        );
        const nextStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === orderValue + 1
        );

        if (
          currentStatusName &&
          nextStatusName &&
          editingStatuses[currentStatusName]?.endDate &&
          editingStatuses[nextStatusName]?.startDate
        ) {
          const currentStatus = editingStatuses[currentStatusName];
          const nextStatus = editingStatuses[nextStatusName];

          // Kiểm tra nếu ngày bắt đầu của trạng thái tiếp theo trước hoặc bằng ngày kết thúc của trạng thái hiện tại
          if (
            nextStatus.startDate.isBefore(currentStatus.endDate) ||
            nextStatus.startDate.isSame(currentStatus.endDate)
          ) {
            errors.push(
              `Ngày bắt đầu của ${translateStatus(
                nextStatusName
              )} phải sau ngày kết thúc của ${translateStatus(
                currentStatusName
              )}`
            );
          }
        }
      }
    });

    // Kiểm tra từng trạng thái riêng biệt
    Object.entries(editingStatuses).forEach(([statusName, status]) => {
      // Kiểm tra nếu startDate sau endDate
      if (
        status.startDate &&
        status.endDate &&
        status.startDate.isAfter(status.endDate)
      ) {
        errors.push(
          `Ngày bắt đầu của ${translateStatus(
            statusName
          )} không thể sau ngày kết thúc`
        );
      }

      // Kiểm tra nếu endDate > eventEndTime
      if (
        status.endDate &&
        eventEndTime &&
        status.endDate.isAfter(eventEndTime)
      ) {
        errors.push(
          `Ngày kết thúc của ${translateStatus(
            statusName
          )} không thể sau ngày kết thúc sự kiện (${eventEndTime.format(
            "DD/MM/YYYY HH:mm"
          )})`
        );
      }

      // Kiểm tra nếu startDate < eventStartTime
      if (
        status.startDate &&
        eventStartTime &&
        status.startDate.isBefore(eventStartTime)
      ) {
        errors.push(
          `Ngày bắt đầu của ${translateStatus(
            statusName
          )} không thể trước ngày bắt đầu sự kiện (${eventStartTime.format(
            "DD/MM/YYYY HH:mm"
          )})`
        );
      }
    });

    if (errors.length > 0) {
      message.error(errors.join("\n"));
      return;
    }

    // Tiếp tục với việc lưu các thay đổi nếu không có lỗi
    setIsEditing(false);
    setLoading(true);

    try {
      const statusesToUpdate = Object.keys(editingStatuses).map(
        (statusName) => {
          const editedStatus = editingStatuses[statusName];
          // Tìm trạng thái hiện tại để lấy giá trị isActive
          const currentStatus = availableStatuses.find(
            (status) => status.statusName === statusName
          );
          return {
            statusName,
            description: statusMapping[statusName]?.description,
            startDate: editedStatus.startDate,
            endDate: editedStatus.endDate,
            isActive: currentStatus ? currentStatus.isActive : false,
          };
        }
      );

      // Gọi API với một mảng các trạng thái thay vì gửi từng trạng thái riêng lẻ
      updateShowStatus(showId, statusesToUpdate)
        .then(() => {
          fetchKoiShowDetail(showId);
        })
        .catch((error) => {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          message.error("Có lỗi xảy ra khi cập nhật trạng thái");
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      message.error("Có lỗi xảy ra khi cập nhật trạng thái");
      setLoading(false);
    }
  };

  // Hiển thị modal JSON
  const showJsonModal = () => {
    // Chuẩn bị dữ liệu để hiển thị
    const statusesToDisplay = availableStatuses
      .filter((status) => status.selected)
      .map((status) => ({
        statusName: status.statusName,
        description: status.description,
        startDate: status.startDate
          ? status.startDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null,
        endDate: status.endDate
          ? status.endDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null,
        isActive: status.isActive,
      }));

    setStatusJson(JSON.stringify(statusesToDisplay, null, 2));
    setJsonModalVisible(true);
  };

  // Hàm để xác định giờ nào bị vô hiệu hóa dựa trên ngày đã chọn
  const disabledHours = (date, type, statusName) => {
    if (!date || !prevStatusEndDate) return [];

    // Nếu ngày được chọn trước ngày kết thúc của trạng thái trước, vô hiệu hóa tất cả giờ
    if (date.isBefore(prevStatusEndDate, "day")) {
      return Array.from({ length: 24 }, (_, i) => i);
    }

    // Nếu ngày được chọn trùng với ngày kết thúc của trạng thái trước
    if (date.isSame(prevStatusEndDate, "day")) {
      const endHour = prevStatusEndDate.hour();
      // Chỉ vô hiệu hóa các giờ trước giờ kết thúc (không vô hiệu hóa giờ kết thúc)
      return Array.from({ length: endHour }, (_, i) => i);
    }

    return [];
  };

  // Hàm để xác định phút nào bị vô hiệu hóa dựa trên ngày và giờ đã chọn
  const disabledMinutes = (date, type, statusName) => {
    if (!date || !prevStatusEndDate) return [];

    // Nếu ngày và giờ trùng với ngày và giờ kết thúc của trạng thái trước
    if (
      date.isSame(prevStatusEndDate, "day") &&
      date.hour() === prevStatusEndDate.hour()
    ) {
      const endMinute = prevStatusEndDate.minute();
      // Chỉ vô hiệu hóa các phút trước phút kết thúc (không vô hiệu hóa phút kết thúc)
      return Array.from({ length: endMinute }, (_, i) => i);
    }

    return [];
  };

  return (
    <div>
      <Card
        className="mb-4 shadow-sm"
        title={
          <div className="flex justify-between items-center">
            <span className="font-bold text-base md:text-lg">
              Trạng thái triển lãm
            </span>
            {!disabled && (
              <div>
                {isEditing ? (
                  <Space>
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
                  <Space>
                    <Button
                      type="text"
                      onClick={startEdit}
                      icon={<EditOutlined />}
                      className="text-blue-500"
                    ></Button>
                    {/* <Button
                      type="text"
                      onClick={showJsonModal}
                      className="text-gray-500"
                    >
                      JSON
                    </Button> */}
                  </Space>
                )}
              </div>
            )}
          </div>
        }
      >
        <Timeline
          className={isEditing ? "mb-4 pb-4" : ""}
          items={availableStatuses
            .filter((status) => status.selected)
            .sort((a, b) => {
              // Define the order of status display
              const statusOrder = {
                RegistrationOpen: 1,
                KoiCheckIn: 2,
                TicketCheckIn: 3,
                Preliminary: 4,
                Evaluation: 5,
                Final: 6,
                Exhibition: 7,
                PublicResult: 8,
                Award: 9,
                Finished: 10,
              };
              return statusOrder[a.statusName] - statusOrder[b.statusName];
            })
            .map((status) => {
              const { color } = statusMapping[status.statusName] || {
                color: "gray",
              };

              // Check if dates are the same
              const sameDay =
                status.startDate &&
                status.endDate &&
                dayjs(status.startDate).format("YYYY-MM-DD") ===
                  dayjs(status.endDate).format("YYYY-MM-DD");

              return {
                key: status.statusName,
                color: color,
                dot: status.isActive ? (
                  <div className="absolute w-5 h-5 -top-1 -left-1 rounded-full bg-green-500 border-2 border-white"></div>
                ) : undefined,
                children: (
                  <div className="pb-4">
                    <div className={`text-${color}-500 font-medium`}>
                      <div
                        className={`text-xs md:text-sm ${
                          status.isActive
                            ? "text-blue-700 font-bold"
                            : "text-gray-400"
                        } mb-1`}
                      >
                        {status.description}
                      </div>

                      {/* Hiển thị chế độ xem */}
                      {!isEditing && status.startDate && (
                        <div className="text-[10px] md:text-xs text-gray-500">
                          {sameDay ? (
                            // If same date, show one date with start and end times
                            <>
                              {formatDate(status.startDate)},{" "}
                              {formatTime(status.startDate)} -{" "}
                              {formatTime(status.endDate)}
                            </>
                          ) : (
                            // If different dates, show full range
                            <>
                              {formatDate(status.startDate)}{" "}
                              {formatTime(status.startDate)} -{" "}
                              {formatDate(status.endDate)}{" "}
                              {formatTime(status.endDate)}
                            </>
                          )}
                        </div>
                      )}

                      {/* Hiển thị chế độ chỉnh sửa */}
                      {isEditing && (
                        <div className="mt-2 space-y-2">
                          {status.statusName === "RegistrationOpen" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <div className="mb-1">
                                  <label className="block text-xs mb-1">
                                    Ngày bắt đầu:
                                  </label>
                                  <DatePicker
                                    className="w-full"
                                    size="small"
                                    value={
                                      editingStatuses[status.statusName]
                                        ?.startDate
                                    }
                                    onChange={(value) =>
                                      handleStatusDateChange(
                                        status.statusName,
                                        "startDate",
                                        value
                                      )
                                    }
                                    format="YYYY-MM-DD"
                                    placeholder="Chọn ngày bắt đầu"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1">
                                    Giờ bắt đầu:
                                  </label>
                                  <TimePicker
                                    className="w-full"
                                    size="small"
                                    value={
                                      editingStatuses[status.statusName]
                                        ?.startDate
                                    }
                                    onChange={(value) => {
                                      if (value) {
                                        handleStatusDateChange(
                                          status.statusName,
                                          "startDate",
                                          value
                                        );
                                      }
                                    }}
                                    format="HH:mm"
                                    placeholder="Giờ bắt đầu"
                                    disabledTime={() => {
                                      const disabledHours = [];
                                      const disabledMinutes = (
                                        selectedHour
                                      ) => {
                                        const minutesDisabled = [];
                                        const selectedDate =
                                          editingStatuses[status.statusName]
                                            ?.startDate;

                                        if (!selectedDate)
                                          return minutesDisabled;

                                        // Tìm vị trí của trạng thái hiện tại
                                        const statusOrder = {
                                          RegistrationOpen: 1,
                                          KoiCheckIn: 2,
                                          TicketCheckIn: 3,
                                          Preliminary: 4,
                                          Evaluation: 5,
                                          Final: 6,
                                          Exhibition: 7,
                                          PublicResult: 8,
                                          Award: 9,
                                          Finished: 10,
                                        };
                                        const currentStatusOrder =
                                          statusOrder[status.statusName] || 0;

                                        // Tìm trạng thái trước đó
                                        const prevStatusName = Object.keys(
                                          statusOrder
                                        ).find(
                                          (key) =>
                                            statusOrder[key] ===
                                            currentStatusOrder - 1
                                        );

                                        if (
                                          prevStatusName &&
                                          editingStatuses[prevStatusName]
                                            ?.endDate
                                        ) {
                                          const prevStatus =
                                            editingStatuses[prevStatusName];

                                          // Nếu cùng ngày và cùng giờ với giờ kết thúc của trạng thái trước
                                          if (
                                            selectedDate.format("YYYYMMDD") ===
                                              prevStatus.endDate.format(
                                                "YYYYMMDD"
                                              ) &&
                                            selectedHour ===
                                              prevStatus.endDate.hour()
                                          ) {
                                            // Vô hiệu hóa tất cả các phút TRƯỚC VÀ BẰNG phút kết thúc của trạng thái trước
                                            for (
                                              let i = 0;
                                              i <= prevStatus.endDate.minute();
                                              i++
                                            ) {
                                              minutesDisabled.push(i);
                                            }
                                          }
                                        }

                                        return minutesDisabled;
                                      };

                                      const selectedDate =
                                        editingStatuses[status.statusName]
                                          ?.startDate;

                                      if (!selectedDate)
                                        return {
                                          disabledHours: () => disabledHours,
                                        };

                                      // Tìm vị trí của trạng thái hiện tại
                                      const statusOrder = {
                                        RegistrationOpen: 1,
                                        KoiCheckIn: 2,
                                        TicketCheckIn: 3,
                                        Preliminary: 4,
                                        Evaluation: 5,
                                        Final: 6,
                                        Exhibition: 7,
                                        PublicResult: 8,
                                        Award: 9,
                                        Finished: 10,
                                      };
                                      const currentStatusOrder =
                                        statusOrder[status.statusName] || 0;

                                      // Tìm trạng thái trước đó
                                      const prevStatusName = Object.keys(
                                        statusOrder
                                      ).find(
                                        (key) =>
                                          statusOrder[key] ===
                                          currentStatusOrder - 1
                                      );

                                      if (
                                        prevStatusName &&
                                        editingStatuses[prevStatusName]?.endDate
                                      ) {
                                        const prevStatus =
                                          editingStatuses[prevStatusName];

                                        // Nếu trạng thái hiện tại có ngày trước ngày kết thúc của trạng thái trước, vô hiệu hóa tất cả các giờ
                                        if (
                                          selectedDate.format("YYYYMMDD") <
                                          prevStatus.endDate.format("YYYYMMDD")
                                        ) {
                                          for (let i = 0; i < 24; i++) {
                                            disabledHours.push(i);
                                          }
                                        }
                                        // Nếu cùng ngày với trạng thái trước
                                        else if (
                                          selectedDate.format("YYYYMMDD") ===
                                          prevStatus.endDate.format("YYYYMMDD")
                                        ) {
                                          // Vô hiệu hóa tất cả các giờ TRƯỚC giờ kết thúc của trạng thái trước
                                          for (
                                            let i = 0;
                                            i < prevStatus.endDate.hour();
                                            i++
                                          ) {
                                            disabledHours.push(i);
                                          }
                                        }
                                      }

                                      return {
                                        disabledHours: () => disabledHours,
                                        disabledMinutes,
                                      };
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="mb-1">
                                  <label className="block text-xs mb-1">
                                    Ngày kết thúc:
                                  </label>
                                  <DatePicker
                                    className="w-full"
                                    size="small"
                                    value={
                                      editingStatuses[status.statusName]
                                        ?.endDate
                                    }
                                    onChange={(value) =>
                                      handleStatusDateChange(
                                        status.statusName,
                                        "endDate",
                                        value
                                      )
                                    }
                                    format="YYYY-MM-DD"
                                    placeholder="Chọn ngày kết thúc"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1">
                                    Giờ kết thúc:
                                  </label>
                                  <TimePicker
                                    className="w-full"
                                    size="small"
                                    value={
                                      editingStatuses[status.statusName]
                                        ?.endDate
                                    }
                                    onChange={(value) => {
                                      if (
                                        value &&
                                        editingStatuses[status.statusName]
                                          ?.startDate
                                      ) {
                                        const newDate = editingStatuses[
                                          status.statusName
                                        ].startDate
                                          .hour(value.hour())
                                          .minute(value.minute())
                                          .second(0);

                                        // Kiểm tra với trạng thái trước đó
                                        const statusOrder = {
                                          RegistrationOpen: 1,
                                          KoiCheckIn: 2,
                                          TicketCheckIn: 3,
                                          Preliminary: 4,
                                          Evaluation: 5,
                                          Final: 6,
                                          Exhibition: 7,
                                          PublicResult: 8,
                                          Award: 9,
                                          Finished: 10,
                                        };
                                        const currentStatusOrder =
                                          statusOrder[status.statusName] || 0;
                                        const prevStatusName = Object.keys(
                                          statusOrder
                                        ).find(
                                          (key) =>
                                            statusOrder[key] ===
                                            currentStatusOrder - 1
                                        );

                                        if (
                                          prevStatusName &&
                                          editingStatuses[prevStatusName]
                                            ?.endDate
                                        ) {
                                          const prevStatus =
                                            editingStatuses[prevStatusName];
                                          // Thời gian bắt đầu không được sớm hơn thời gian kết thúc của trạng thái trước đó
                                          if (
                                            newDate.isBefore(prevStatus.endDate)
                                          ) {
                                            message.error(
                                              `Thời gian bắt đầu phải từ thời gian kết thúc của ${
                                                statusMapping[prevStatusName]
                                                  ?.label || prevStatusName
                                              } trở đi`
                                            );
                                            return;
                                          }
                                        }

                                        handleStatusDateChange(
                                          status.statusName,
                                          "endDate",
                                          newDate
                                        );
                                      }
                                    }}
                                    format="HH:mm"
                                    placeholder="Giờ kết thúc"
                                    disabledTime={() => {
                                      const disabledHours = [];
                                      const disabledMinutes = (
                                        selectedHour
                                      ) => {
                                        const minutesDisabled = [];
                                        const selectedDate =
                                          editingStatuses[status.statusName]
                                            ?.startDate;

                                        if (!selectedDate)
                                          return minutesDisabled;

                                        // Kiểm tra không được sớm hơn thời gian bắt đầu
                                        if (
                                          selectedHour === selectedDate.hour()
                                        ) {
                                          for (
                                            let i = 0;
                                            i < selectedDate.minute();
                                            i++
                                          ) {
                                            minutesDisabled.push(i);
                                          }
                                        }

                                        // Kiểm tra với trạng thái tiếp theo
                                        const statusOrder = {
                                          RegistrationOpen: 1,
                                          KoiCheckIn: 2,
                                          TicketCheckIn: 3,
                                          Preliminary: 4,
                                          Evaluation: 5,
                                          Final: 6,
                                          Exhibition: 7,
                                          PublicResult: 8,
                                          Award: 9,
                                          Finished: 10,
                                        };
                                        const currentStatusOrder =
                                          statusOrder[status.statusName] || 0;

                                        const nextStatusName = Object.keys(
                                          statusOrder
                                        ).find(
                                          (key) =>
                                            statusOrder[key] ===
                                            currentStatusOrder + 1
                                        );

                                        if (
                                          nextStatusName &&
                                          editingStatuses[nextStatusName]
                                            ?.startDate
                                        ) {
                                          const nextStatus =
                                            editingStatuses[nextStatusName];

                                          // Nếu cùng ngày và cùng giờ với giờ bắt đầu của trạng thái tiếp theo
                                          if (
                                            selectedDate.format("YYYYMMDD") ===
                                              nextStatus.startDate.format(
                                                "YYYYMMDD"
                                              ) &&
                                            selectedHour ===
                                              nextStatus.startDate.hour()
                                          ) {
                                            // Vô hiệu hóa tất cả các phút SAU VÀ BẰNG phút bắt đầu của trạng thái tiếp theo
                                            for (
                                              let i =
                                                nextStatus.startDate.minute();
                                              i < 60;
                                              i++
                                            ) {
                                              minutesDisabled.push(i);
                                            }
                                          }
                                        }

                                        return minutesDisabled;
                                      };

                                      const selectedDate =
                                        editingStatuses[status.statusName]
                                          ?.startDate;

                                      if (!selectedDate)
                                        return {
                                          disabledHours: () => disabledHours,
                                        };

                                      // Kiểm tra không được sớm hơn thời gian bắt đầu
                                      for (
                                        let i = 0;
                                        i < selectedDate.hour();
                                        i++
                                      ) {
                                        disabledHours.push(i);
                                      }

                                      // Kiểm tra với trạng thái tiếp theo
                                      const statusOrder = {
                                        RegistrationOpen: 1,
                                        KoiCheckIn: 2,
                                        TicketCheckIn: 3,
                                        Preliminary: 4,
                                        Evaluation: 5,
                                        Final: 6,
                                        Exhibition: 7,
                                        PublicResult: 8,
                                        Award: 9,
                                        Finished: 10,
                                      };
                                      const currentStatusOrder =
                                        statusOrder[status.statusName] || 0;

                                      const nextStatusName = Object.keys(
                                        statusOrder
                                      ).find(
                                        (key) =>
                                          statusOrder[key] ===
                                          currentStatusOrder + 1
                                      );

                                      if (
                                        nextStatusName &&
                                        editingStatuses[nextStatusName]
                                          ?.startDate
                                      ) {
                                        const nextStatus =
                                          editingStatuses[nextStatusName];

                                        // Nếu trạng thái hiện tại có ngày sau ngày bắt đầu của trạng thái tiếp theo, vô hiệu hóa tất cả các giờ
                                        if (
                                          selectedDate.format("YYYYMMDD") >
                                          nextStatus.startDate.format(
                                            "YYYYMMDD"
                                          )
                                        ) {
                                          for (let i = 0; i < 24; i++) {
                                            disabledHours.push(i);
                                          }
                                        }
                                        // Nếu cùng ngày với trạng thái tiếp theo
                                        else if (
                                          selectedDate.format("YYYYMMDD") ===
                                          nextStatus.startDate.format(
                                            "YYYYMMDD"
                                          )
                                        ) {
                                          // Vô hiệu hóa tất cả các giờ SAU giờ bắt đầu của trạng thái tiếp theo
                                          for (
                                            let i =
                                              nextStatus.startDate.hour() + 1;
                                            i < 24;
                                            i++
                                          ) {
                                            disabledHours.push(i);
                                          }
                                        }
                                      }

                                      return {
                                        disabledHours: () => disabledHours,
                                        disabledMinutes,
                                      };
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {status.statusName === "Finished" && (
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <div className="mb-1">
                                  <label className="block text-xs mb-1">
                                    Thời gian kết thúc sự kiện:
                                  </label>
                                  <DatePicker
                                    className="w-full"
                                    size="small"
                                    value={
                                      editingStatuses[status.statusName]
                                        ?.startDate
                                    }
                                    onChange={(value) => {
                                      handleStatusDateChange(
                                        status.statusName,
                                        "startDate",
                                        value
                                      );
                                      handleStatusDateChange(
                                        status.statusName,
                                        "endDate",
                                        value
                                      );
                                    }}
                                    format="YYYY-MM-DD"
                                    placeholder="Chọn ngày kết thúc sự kiện"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1">
                                    Giờ kết thúc:
                                  </label>
                                  <TimePicker
                                    className="w-full"
                                    size="small"
                                    value={
                                      editingStatuses[status.statusName]
                                        ?.startDate
                                    }
                                    onChange={(value) => {
                                      if (
                                        value &&
                                        editingStatuses[status.statusName]
                                          ?.startDate
                                      ) {
                                        const newDate = editingStatuses[
                                          status.statusName
                                        ].startDate
                                          .hour(value.hour())
                                          .minute(value.minute())
                                          .second(0);

                                        // Kiểm tra với trạng thái trước đó
                                        const statusOrder = {
                                          RegistrationOpen: 1,
                                          KoiCheckIn: 2,
                                          TicketCheckIn: 3,
                                          Preliminary: 4,
                                          Evaluation: 5,
                                          Final: 6,
                                          Exhibition: 7,
                                          PublicResult: 8,
                                          Award: 9,
                                          Finished: 10,
                                        };
                                        const currentStatusOrder =
                                          statusOrder[status.statusName] || 0;
                                        const prevStatusName = Object.keys(
                                          statusOrder
                                        ).find(
                                          (key) =>
                                            statusOrder[key] ===
                                            currentStatusOrder - 1
                                        );

                                        if (
                                          prevStatusName &&
                                          editingStatuses[prevStatusName]
                                            ?.endDate
                                        ) {
                                          const prevStatus =
                                            editingStatuses[prevStatusName];
                                          // Thời gian bắt đầu không được sớm hơn thời gian kết thúc của trạng thái trước đó
                                          if (
                                            newDate.isBefore(prevStatus.endDate)
                                          ) {
                                            message.error(
                                              `Thời gian bắt đầu phải từ thời gian kết thúc của ${
                                                statusMapping[prevStatusName]
                                                  ?.label || prevStatusName
                                              } trở đi`
                                            );
                                            return;
                                          }
                                        }

                                        handleStatusDateChange(
                                          status.statusName,
                                          "startDate",
                                          newDate
                                        );
                                      }
                                    }}
                                    format="HH:mm"
                                    placeholder="Giờ kết thúc sự kiện"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {status.statusName !== "RegistrationOpen" &&
                            status.statusName !== "Finished" && (
                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <div className="mb-1">
                                    <label className="block text-xs mb-1">
                                      Ngày diễn ra:
                                    </label>
                                    <DatePicker
                                      className="w-full"
                                      size="small"
                                      value={
                                        editingStatuses[status.statusName]
                                          ?.startDate
                                      }
                                      onChange={(value) => {
                                        handleStatusDateChange(
                                          status.statusName,
                                          "startDate",
                                          value
                                        );
                                        // Đồng bộ ngày cho endDate
                                        if (
                                          editingStatuses[status.statusName]
                                            ?.endDate
                                        ) {
                                          const newEndDate = value
                                            .hour(
                                              editingStatuses[
                                                status.statusName
                                              ].endDate.hour()
                                            )
                                            .minute(
                                              editingStatuses[
                                                status.statusName
                                              ].endDate.minute()
                                            );
                                          handleStatusDateChange(
                                            status.statusName,
                                            "endDate",
                                            newEndDate
                                          );
                                        }
                                      }}
                                      format="YYYY-MM-DD"
                                      placeholder="Chọn ngày"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs mb-1">
                                        Giờ bắt đầu:
                                      </label>
                                      <TimePicker
                                        className="w-full"
                                        size="small"
                                        value={
                                          editingStatuses[status.statusName]
                                            ?.startDate
                                        }
                                        onChange={(value) => {
                                          if (value) {
                                            handleStatusDateChange(
                                              status.statusName,
                                              "startDate",
                                              value
                                            );
                                          }
                                        }}
                                        format="HH:mm"
                                        placeholder="Giờ bắt đầu"
                                        disabledTime={() => {
                                          const disabledHours = [];
                                          const disabledMinutes = (
                                            selectedHour
                                          ) => {
                                            const minutesDisabled = [];
                                            const selectedDate =
                                              editingStatuses[status.statusName]
                                                ?.startDate;

                                            if (!selectedDate)
                                              return minutesDisabled;

                                            // Tìm vị trí của trạng thái hiện tại
                                            const statusOrder = {
                                              RegistrationOpen: 1,
                                              KoiCheckIn: 2,
                                              TicketCheckIn: 3,
                                              Preliminary: 4,
                                              Evaluation: 5,
                                              Final: 6,
                                              Exhibition: 7,
                                              PublicResult: 8,
                                              Award: 9,
                                              Finished: 10,
                                            };
                                            const currentStatusOrder =
                                              statusOrder[status.statusName] ||
                                              0;

                                            // Tìm trạng thái trước đó
                                            const prevStatusName = Object.keys(
                                              statusOrder
                                            ).find(
                                              (key) =>
                                                statusOrder[key] ===
                                                currentStatusOrder - 1
                                            );

                                            if (
                                              prevStatusName &&
                                              editingStatuses[prevStatusName]
                                                ?.endDate
                                            ) {
                                              const prevStatus =
                                                editingStatuses[prevStatusName];

                                              // Nếu cùng ngày và cùng giờ với giờ kết thúc của trạng thái trước
                                              if (
                                                selectedDate.format(
                                                  "YYYYMMDD"
                                                ) ===
                                                  prevStatus.endDate.format(
                                                    "YYYYMMDD"
                                                  ) &&
                                                selectedHour ===
                                                  prevStatus.endDate.hour()
                                              ) {
                                                // Vô hiệu hóa tất cả các phút TRƯỚC VÀ BẰNG phút kết thúc của trạng thái trước
                                                for (
                                                  let i = 0;
                                                  i <=
                                                  prevStatus.endDate.minute();
                                                  i++
                                                ) {
                                                  minutesDisabled.push(i);
                                                }
                                              }
                                            }

                                            return minutesDisabled;
                                          };

                                          const selectedDate =
                                            editingStatuses[status.statusName]
                                              ?.startDate;

                                          if (!selectedDate)
                                            return {
                                              disabledHours: () =>
                                                disabledHours,
                                            };

                                          // Tìm vị trí của trạng thái hiện tại
                                          const statusOrder = {
                                            RegistrationOpen: 1,
                                            KoiCheckIn: 2,
                                            TicketCheckIn: 3,
                                            Preliminary: 4,
                                            Evaluation: 5,
                                            Final: 6,
                                            Exhibition: 7,
                                            PublicResult: 8,
                                            Award: 9,
                                            Finished: 10,
                                          };
                                          const currentStatusOrder =
                                            statusOrder[status.statusName] || 0;

                                          // Tìm trạng thái trước đó
                                          const prevStatusName = Object.keys(
                                            statusOrder
                                          ).find(
                                            (key) =>
                                              statusOrder[key] ===
                                              currentStatusOrder - 1
                                          );

                                          if (
                                            prevStatusName &&
                                            editingStatuses[prevStatusName]
                                              ?.endDate
                                          ) {
                                            const prevStatus =
                                              editingStatuses[prevStatusName];

                                            // Nếu trạng thái hiện tại có ngày trước ngày kết thúc của trạng thái trước, vô hiệu hóa tất cả các giờ
                                            if (
                                              selectedDate.format("YYYYMMDD") <
                                              prevStatus.endDate.format(
                                                "YYYYMMDD"
                                              )
                                            ) {
                                              for (let i = 0; i < 24; i++) {
                                                disabledHours.push(i);
                                              }
                                            }
                                            // Nếu cùng ngày với trạng thái trước
                                            else if (
                                              selectedDate.format(
                                                "YYYYMMDD"
                                              ) ===
                                              prevStatus.endDate.format(
                                                "YYYYMMDD"
                                              )
                                            ) {
                                              // Vô hiệu hóa tất cả các giờ TRƯỚC giờ kết thúc của trạng thái trước
                                              for (
                                                let i = 0;
                                                i < prevStatus.endDate.hour();
                                                i++
                                              ) {
                                                disabledHours.push(i);
                                              }
                                            }
                                          }

                                          return {
                                            disabledHours: () => disabledHours,
                                            disabledMinutes,
                                          };
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1">
                                        Giờ kết thúc:
                                      </label>
                                      <TimePicker
                                        className="w-full"
                                        size="small"
                                        value={
                                          editingStatuses[status.statusName]
                                            ?.endDate
                                        }
                                        onChange={(value) => {
                                          if (
                                            value &&
                                            editingStatuses[status.statusName]
                                              ?.startDate
                                          ) {
                                            const newDate = editingStatuses[
                                              status.statusName
                                            ].startDate
                                              .hour(value.hour())
                                              .minute(value.minute())
                                              .second(0);

                                            // Kiểm tra với trạng thái trước đó
                                            const statusOrder = {
                                              RegistrationOpen: 1,
                                              KoiCheckIn: 2,
                                              TicketCheckIn: 3,
                                              Preliminary: 4,
                                              Evaluation: 5,
                                              Final: 6,
                                              Exhibition: 7,
                                              PublicResult: 8,
                                              Award: 9,
                                              Finished: 10,
                                            };
                                            const currentStatusOrder =
                                              statusOrder[status.statusName] ||
                                              0;

                                            // Kiểm tra với trạng thái tiếp theo
                                            const nextStatusName = Object.keys(
                                              statusOrder
                                            ).find(
                                              (key) =>
                                                statusOrder[key] ===
                                                currentStatusOrder + 1
                                            );

                                            // Kiểm tra thời gian kết thúc không được sớm hơn thời gian bắt đầu
                                            if (
                                              newDate.isBefore(
                                                editingStatuses[
                                                  status.statusName
                                                ].startDate
                                              )
                                            ) {
                                              message.error(
                                                `Thời gian kết thúc không được sớm hơn thời gian bắt đầu`
                                              );
                                              return;
                                            }

                                            // Kiểm tra với trạng thái tiếp theo nếu có
                                            if (
                                              nextStatusName &&
                                              editingStatuses[nextStatusName]
                                                ?.startDate
                                            ) {
                                              const nextStatus =
                                                editingStatuses[nextStatusName];
                                              // Thời gian kết thúc không được muộn hơn thời gian bắt đầu của trạng thái tiếp theo
                                              if (
                                                newDate.isAfter(
                                                  nextStatus.startDate
                                                )
                                              ) {
                                                message.error(
                                                  `Thời gian kết thúc phải trước thời gian bắt đầu của ${
                                                    statusMapping[
                                                      nextStatusName
                                                    ]?.label || nextStatusName
                                                  }`
                                                );
                                                return;
                                              }
                                            }

                                            handleStatusDateChange(
                                              status.statusName,
                                              "endDate",
                                              newDate
                                            );
                                          }
                                        }}
                                        format="HH:mm"
                                        placeholder="Giờ kết thúc"
                                        disabledTime={() => {
                                          const disabledHours = [];
                                          const disabledMinutes = (
                                            selectedHour
                                          ) => {
                                            const minutesDisabled = [];
                                            const selectedDate =
                                              editingStatuses[status.statusName]
                                                ?.startDate;

                                            if (!selectedDate)
                                              return minutesDisabled;

                                            // Kiểm tra không được sớm hơn thời gian bắt đầu
                                            if (
                                              selectedHour ===
                                              selectedDate.hour()
                                            ) {
                                              for (
                                                let i = 0;
                                                i < selectedDate.minute();
                                                i++
                                              ) {
                                                minutesDisabled.push(i);
                                              }
                                            }

                                            // Kiểm tra với trạng thái tiếp theo
                                            const statusOrder = {
                                              RegistrationOpen: 1,
                                              KoiCheckIn: 2,
                                              TicketCheckIn: 3,
                                              Preliminary: 4,
                                              Evaluation: 5,
                                              Final: 6,
                                              Exhibition: 7,
                                              PublicResult: 8,
                                              Award: 9,
                                              Finished: 10,
                                            };
                                            const currentStatusOrder =
                                              statusOrder[status.statusName] ||
                                              0;

                                            const nextStatusName = Object.keys(
                                              statusOrder
                                            ).find(
                                              (key) =>
                                                statusOrder[key] ===
                                                currentStatusOrder + 1
                                            );

                                            if (
                                              nextStatusName &&
                                              editingStatuses[nextStatusName]
                                                ?.startDate
                                            ) {
                                              const nextStatus =
                                                editingStatuses[nextStatusName];

                                              // Nếu cùng ngày và cùng giờ với giờ bắt đầu của trạng thái tiếp theo
                                              if (
                                                selectedDate.format(
                                                  "YYYYMMDD"
                                                ) ===
                                                  nextStatus.startDate.format(
                                                    "YYYYMMDD"
                                                  ) &&
                                                selectedHour ===
                                                  nextStatus.startDate.hour()
                                              ) {
                                                // Vô hiệu hóa tất cả các phút SAU VÀ BẰNG phút bắt đầu của trạng thái tiếp theo
                                                for (
                                                  let i =
                                                    nextStatus.startDate.minute();
                                                  i < 60;
                                                  i++
                                                ) {
                                                  minutesDisabled.push(i);
                                                }
                                              }
                                            }

                                            return minutesDisabled;
                                          };

                                          const selectedDate =
                                            editingStatuses[status.statusName]
                                              ?.startDate;

                                          if (!selectedDate)
                                            return {
                                              disabledHours: () =>
                                                disabledHours,
                                            };

                                          // Kiểm tra không được sớm hơn thời gian bắt đầu
                                          for (
                                            let i = 0;
                                            i < selectedDate.hour();
                                            i++
                                          ) {
                                            disabledHours.push(i);
                                          }

                                          // Kiểm tra với trạng thái tiếp theo
                                          const statusOrder = {
                                            RegistrationOpen: 1,
                                            KoiCheckIn: 2,
                                            TicketCheckIn: 3,
                                            Preliminary: 4,
                                            Evaluation: 5,
                                            Final: 6,
                                            Exhibition: 7,
                                            PublicResult: 8,
                                            Award: 9,
                                            Finished: 10,
                                          };
                                          const currentStatusOrder =
                                            statusOrder[status.statusName] || 0;

                                          const nextStatusName = Object.keys(
                                            statusOrder
                                          ).find(
                                            (key) =>
                                              statusOrder[key] ===
                                              currentStatusOrder + 1
                                          );

                                          if (
                                            nextStatusName &&
                                            editingStatuses[nextStatusName]
                                              ?.startDate
                                          ) {
                                            const nextStatus =
                                              editingStatuses[nextStatusName];

                                            // Nếu trạng thái hiện tại có ngày sau ngày bắt đầu của trạng thái tiếp theo, vô hiệu hóa tất cả các giờ
                                            if (
                                              selectedDate.format("YYYYMMDD") >
                                              nextStatus.startDate.format(
                                                "YYYYMMDD"
                                              )
                                            ) {
                                              for (let i = 0; i < 24; i++) {
                                                disabledHours.push(i);
                                              }
                                            }
                                            // Nếu cùng ngày với trạng thái tiếp theo
                                            else if (
                                              selectedDate.format(
                                                "YYYYMMDD"
                                              ) ===
                                              nextStatus.startDate.format(
                                                "YYYYMMDD"
                                              )
                                            ) {
                                              // Vô hiệu hóa tất cả các giờ SAU giờ bắt đầu của trạng thái tiếp theo
                                              for (
                                                let i =
                                                  nextStatus.startDate.hour() +
                                                  1;
                                                i < 24;
                                                i++
                                              ) {
                                                disabledHours.push(i);
                                              }
                                            }
                                          }

                                          return {
                                            disabledHours: () => disabledHours,
                                            disabledMinutes,
                                          };
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          {errors[status.statusName] && (
                            <div className="text-red-500 text-xs mt-1">
                              {errors[status.statusName]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              };
            })}
        />

        {/* Modal hiển thị JSON */}
        <Modal
          title="Dữ liệu JSON của trạng thái"
          open={jsonModalVisible}
          onCancel={() => setJsonModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setJsonModalVisible(false)}>
              Đóng
            </Button>,
          ]}
          width={800}
        >
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-xs whitespace-pre-wrap">{statusJson}</pre>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default StatusManager;
