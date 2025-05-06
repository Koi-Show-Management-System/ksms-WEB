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
  Tag,
  Collapse,
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
  FieldTimeOutlined,
  RocketOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  DownOutlined,
} from "@ant-design/icons";
import useStatus from "../../../../hooks/useStatus";
import useKoiShow from "../../../../hooks/useKoiShow";
import KoiShowStatusUpdater from "./KoiShowStatusUpdater";
import KoiShowStatusEditor from "./KoiShowStatusEditor";
import signalRService from "../../../../config/signalRService";
import Cookies from "js-cookie";

// Cài đặt plugins cho dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
// Thiết lập timezone mặc định là UTC+7
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const StatusManager = ({
  showId,
  showStatuses,
  disabled = false,
  showStartDate,
  showEndDate,
  showStatus,
}) => {
  // Sử dụng hook useStatus để update trạng thái
  const { updateShowStatus, isLoading } = useStatus();
  const { fetchKoiShowDetail, updateKoiShowStatus } = useKoiShow();

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
  const [localShowStatus, setLocalShowStatus] = useState(showStatus);
  // State to track SignalR connection status
  const [signalRConnected, setSignalRConnected] = useState(false);
  // Add loading state
  const [loading, setLoading] = useState(false);
  // Check user role from cookies
  const userRole = Cookies.get("__role");
  const canUpdateStatus = !["Staff", "Referee"].includes(userRole);

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
  };

  // Cấu hình UI cho các trạng thái (chỉ giữ phần UI styling)
  const statusUIConfig = {
    RegistrationOpen: {
      color: "blue",
      mainCategory: "upcoming",
    },
    KoiCheckIn: {
      mainCategory: "inprogress",
    },
    TicketCheckIn: {
      mainCategory: "inprogress",
    },
    Preliminary: {
      mainCategory: "inprogress",
    },
    Evaluation: {
      mainCategory: "inprogress",
    },
    Final: {
      mainCategory: "inprogress",
    },
    Exhibition: {
      mainCategory: "inprogress",
    },
    PublicResult: {
      mainCategory: "inprogress",
    },
    Award: {
      mainCategory: "inprogress",
    },
  };

  // Initialize SignalR connection and subscribe to updates
  useEffect(() => {
    let unsubscribe = null;

    const startConnection = async () => {
      try {
        if (signalRService.getShowConnectionState() !== "Connected") {
          await signalRService.startShowConnection();
          // console.log("Show SignalR connection established for StatusManager");
          setSignalRConnected(true);
        } else {
          console.log("Show SignalR already connected");
          setSignalRConnected(true);
        }

        // Subscribe to show status updates
        unsubscribe = signalRService.subscribeToShowStatusUpdates(
          (updatedShowId, updatedStatus) => {
            if (updatedShowId === showId) {
              setLocalShowStatus(updatedStatus);

              // No need to fetch the entire show details just for status update
              // fetchKoiShowDetail(showId);
            }
          }
        );
      } catch (error) {
        console.error("Error with SignalR connection:", error);
        setSignalRConnected(false);

        // Try to reconnect after a delay if connection fails
        setTimeout(() => {
          startConnection();
        }, 5000);
      }
    };

    startConnection();

    // Clean up on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showId]);

  // Update localShowStatus when prop changes
  useEffect(() => {
    setLocalShowStatus(showStatus);
  }, [showStatus]);

  // Hàm dịch tên trạng thái - sử dụng showStatuses
  const translateStatus = (statusName) => {
    const status = showStatuses.find((s) => s.statusName === statusName);
    return status ? status.description : statusName;
  };

  // Hàm format date
  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

  // Khởi tạo trạng thái từ dữ liệu triển lãm
  useEffect(() => {
    if (showStatuses && showStatuses.length > 0) {
      // Tạo đối tượng chứa tất cả các trạng thái có sẵn từ statusUIConfig
      const initialStatuses = Object.keys(statusUIConfig).map((statusName) => {
        // Tìm thông tin từ showStatuses nếu có
        const existingStatus = showStatuses.find(
          (s) => s.statusName === statusName
        );

        return {
          statusName,
          label: existingStatus?.description || statusName,
          description: existingStatus?.description || statusName,
          startDate: existingStatus?.startDate
            ? dayjs(existingStatus.startDate)
            : null,
          endDate: existingStatus?.endDate
            ? dayjs(existingStatus.endDate)
            : null,
          selected: !!existingStatus,
        };
      });

      setAvailableStatuses(initialStatuses);
    }
  }, [showStatuses]);

  // Import the StatusEditor component
  const statusEditor = KoiShowStatusEditor({
    showId,
    availableStatuses,
    showStartDate,
    showEndDate,
    statusOrder,
    statusUIConfig,
    updateShowStatus,
    fetchKoiShowDetail,
    translateStatus,
    onLoadingChange: setLoading,
    disabled,
    canEdit: !disabled && canUpdateStatus,
    localShowStatus,
    setAvailableStatuses,
  });

  // Lưu tất cả thay đổi
  const saveAllChanges = async () => {
    const errors = [];

    // Tìm thời gian bắt đầu và kết thúc sự kiện từ trạng thái
    const eventStartTime = editingStatuses["RegistrationOpen"]?.startDate;

    // Kiểm tra các trạng thái từ KoiCheckIn đến Award nằm trong khoảng thời gian triển lãm
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
            errors.push(
              `Thời gian bắt đầu của ${translateStatus(
                statusName
              )} không được trước ngày bắt đầu triển lãm`
            );
          }

          // Kiểm tra endDate không được sau ngày kết thúc triển lãm
          if (status.endDate && status.endDate.isAfter(exhibitionEndDay)) {
            errors.push(
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

        if (
          currentStatusName &&
          nextStatusName &&
          editingStatuses[currentStatusName]?.endDate &&
          editingStatuses[nextStatusName]?.startDate
        ) {
          const currentStatus = editingStatuses[currentStatusName];
          const nextStatus = editingStatuses[nextStatusName];

          // Kiểm tra nếu ngày bắt đầu của trạng thái tiếp theo trước ngày kết thúc của trạng thái hiện tại
          // Đã sửa: Cho phép ngày bắt đầu = ngày kết thúc (chỉ lỗi khi bắt đầu < kết thúc)
          if (nextStatus.startDate.isBefore(currentStatus.endDate)) {
            errors.push(
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

      // Kiểm tra nếu startDate < eventStartTime
      if (
        status.startDate &&
        eventStartTime &&
        status.startDate.isBefore(eventStartTime) &&
        statusName !== "RegistrationOpen" // Bỏ qua kiểm tra này cho RegistrationOpen
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
      // Hiển thị thông báo lỗi với định dạng dễ đọc hơn
      message.error(
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            Vui lòng sửa các lỗi sau:
          </div>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            {errors.map((error, index) => (
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
    setLoading(true);

    try {
      const statusesToUpdate = Object.keys(editingStatuses).map(
        (statusName) => {
          const editedStatus = editingStatuses[statusName];
          const originalStatus = availableStatuses.find(
            (status) => status.statusName === statusName
          );

          return {
            statusName,
            description:
              originalStatus?.description || translateStatus(statusName),
            startDate: editedStatus.startDate,
            endDate: editedStatus.endDate,
          };
        }
      );

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
          setLoading(false);
        });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      message.error("Có lỗi xảy ra khi cập nhật trạng thái");
      setLoading(false);
    }
  };

  // Handle status update from KoiShowStatusUpdater
  const handleStatusUpdate = (newStatus) => {
    // Only update if the status is actually changing
    if (newStatus !== localShowStatus) {
      setLocalShowStatus(newStatus);
    }
    // We don't need to fetch details here as SignalR will handle the updates
  };

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

          if (!selectedDay.isBefore(exhibitionDay)) {
            message.error(
              "Ngày kết thúc đăng ký phải trước ngày bắt đầu triển lãm"
            );
            return;
          }
        }
      }
    } else {
      // Kiểm tra cho các trạng thái khác
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
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Card
        className="mb-4 shadow-sm w-full flex-grow"
        styles={{ body: { padding: "16px", height: "100%" } }}
        style={{ height: "100%" }}
        loading={loading}
        title={
          <div className="flex justify-between items-center">
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-base md:text-lg">
                Lịch dự kiến
              </span>
              {!canUpdateStatus && localShowStatus && (
                <Tag
                  color={
                    localShowStatus === "pending"
                      ? "orange"
                      : localShowStatus === "internalpublished"
                        ? "blue"
                        : localShowStatus === "published"
                          ? "green"
                          : localShowStatus === "upcoming"
                            ? "cyan"
                            : localShowStatus === "inprogress"
                              ? "purple"
                              : localShowStatus === "finished"
                                ? "gray"
                                : "default"
                  }
                >
                  {localShowStatus === "pending"
                    ? "Chờ duyệt"
                    : localShowStatus === "internalpublished"
                      ? "Công bố nội bộ"
                      : localShowStatus === "published"
                        ? "Công bố"
                        : localShowStatus === "upcoming"
                          ? "Sắp diễn ra"
                          : localShowStatus === "inprogress"
                            ? "Đang diễn ra"
                            : localShowStatus === "finished"
                              ? "Kết thúc"
                              : localShowStatus}
                </Tag>
              )}
            </div>
            <div className="flex items-center">
              {canUpdateStatus && (
                <KoiShowStatusUpdater
                  showId={showId}
                  currentStatus={localShowStatus}
                  onStatusUpdate={handleStatusUpdate}
                  updateKoiShowStatus={updateKoiShowStatus}
                />
              )}
              {!disabled && canUpdateStatus && (
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
              )}
            </div>
          </div>
        }
      >
        {/* Vertical Timeline Style Layout */}
        <div className="w-full">
          <Collapse
            defaultActiveKey={[]}
            bordered={false}
            className="site-collapse-custom-collapse"
            expandIcon={({ isActive }) => (
              <DownOutlined
                rotate={isActive ? 180 : 0}
                style={{ fontSize: "12px" }}
              />
            )}
            items={[
              {
                key: "approval",
                label: (
                  <div className="flex justify-between items-center">
                    <div
                      className={`${
                        localShowStatus === "pending"
                          ? " -ml-2 -my-2 py-2 pl-2 pr-3  flex items-center "
                          : ""
                      }`}
                    >
                      <CalendarOutlined
                        className={`${localShowStatus === "pending" ? "text-orange-500 text-lg" : "text-orange-400"} mr-2`}
                      />
                      <span
                        className={`font-medium text-sm md:text-base ${localShowStatus === "pending" ? "text-orange-500 font-bold" : "text-orange-400"}`}
                      >
                        Chờ duyệt
                      </span>
                    </div>
                    {localShowStatus === "pending" && (
                      <div className="ml-2 h-4 w-4 bg-orange-500 rounded-full animate-pulse shadow-sm"></div>
                    )}
                  </div>
                ),
                className: `site-collapse-custom-panel border-0 border-l-4 relative ${
                  localShowStatus === "pending"
                    ? "border-orange-500 pl-1 mb-3 bg-orange-50 rounded-r-md shadow-md"
                    : "border-orange-200 pl-1 mb-3 bg-gray-50 rounded-r-md"
                }`,
                children: (
                  <>
                    {localShowStatus === "pending" && (
                      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md z-10">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    <div
                      className={`pl-7 relative p-3 ${localShowStatus === "pending" ? "border border-orange-200 bg-white rounded-md" : ""}`}
                    >
                      <div
                        className={`absolute left-1 top-6 h-3 w-3 rounded-full ${
                          localShowStatus === "pending"
                            ? "bg-orange-500"
                            : "bg-orange-200"
                        }`}
                      ></div>
                      <div
                        className={`font-medium ${localShowStatus === "pending" ? "text-gray-800" : "text-gray-500"}`}
                      >
                        Hồ sơ đang chờ được xét duyệt
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Triển lãm đang được BTC xem xét
                      </div>
                    </div>
                  </>
                ),
              },
              {
                key: "internalpublished",
                label: (
                  <div className="flex justify-between items-center">
                    <div
                      className={`${
                        localShowStatus === "internalpublished"
                          ? " -ml-2 -my-2 py-2 pl-2 pr-3  flex items-center "
                          : ""
                      }`}
                    >
                      <FieldTimeOutlined
                        className={`${localShowStatus === "internalpublished" ? "text-blue-500 text-lg" : "text-blue-400"} mr-2`}
                      />
                      <span
                        className={`font-medium text-sm md:text-base ${localShowStatus === "internalpublished" ? "text-blue-500 font-bold" : "text-blue-400"}`}
                      >
                        Công bố nội bộ
                      </span>
                    </div>
                    {localShowStatus === "internalpublished" && (
                      <div className="ml-2 h-4 w-4 bg-blue-500 rounded-full animate-pulse shadow-sm"></div>
                    )}
                  </div>
                ),
                className: `site-collapse-custom-panel border-0 border-l-4 relative ${
                  localShowStatus === "internalpublished"
                    ? "border-blue-500 pl-1 mb-3 bg-blue-50 rounded-r-md shadow-md"
                    : "border-blue-200 pl-1 mb-3 bg-gray-50 rounded-r-md"
                }`,
                children: (
                  <>
                    {localShowStatus === "internalpublished" && (
                      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md z-10">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    <div
                      className={`pl-7 relative p-3 ${localShowStatus === "internalpublished" ? "border border-blue-200 bg-white rounded-md" : ""}`}
                    >
                      <div
                        className={`absolute left-1 top-6 h-3 w-3 rounded-full ${
                          localShowStatus === "internalpublished"
                            ? "bg-blue-500"
                            : "bg-blue-200"
                        }`}
                      ></div>
                      <div
                        className={`font-medium ${localShowStatus === "internalpublished" ? "text-gray-800" : "text-gray-500"}`}
                      >
                        Thông tin chỉ hiển thị cho nội bộ
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Triển lãm được công bố trong hệ thống
                      </div>
                    </div>
                  </>
                ),
              },
              {
                key: "published",
                label: (
                  <div className="flex justify-between items-center">
                    <div
                      className={`${
                        localShowStatus === "published"
                          ? " -ml-2 -my-2 py-2 pl-2 pr-3  flex items-center "
                          : ""
                      }`}
                    >
                      <CheckOutlined
                        className={`${localShowStatus === "published" ? "text-green-500 text-lg" : "text-green-400"} mr-2`}
                      />
                      <span
                        className={`font-medium text-sm md:text-base ${localShowStatus === "published" ? "text-green-500 font-bold" : "text-green-400"}`}
                      >
                        Công bố
                      </span>
                    </div>
                    {localShowStatus === "published" && (
                      <div className="ml-2 h-4 w-4 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                    )}
                  </div>
                ),
                className: `site-collapse-custom-panel border-0 border-l-4 relative ${
                  localShowStatus === "published"
                    ? "border-green-500 pl-1 mb-3 bg-green-50 rounded-r-md shadow-md"
                    : "border-green-200 pl-1 mb-3 bg-gray-50 rounded-r-md"
                }`,
                children: (
                  <>
                    {localShowStatus === "published" && (
                      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center shadow-md z-10">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    <div
                      className={`pl-7 relative p-3 ${localShowStatus === "published" ? "border border-green-200 bg-white rounded-md" : ""}`}
                    >
                      <div
                        className={`absolute left-1 top-6 h-3 w-3 rounded-full ${
                          localShowStatus === "published"
                            ? "bg-green-500"
                            : "bg-green-200"
                        }`}
                      ></div>
                      <div
                        className={`font-medium ${localShowStatus === "published" ? "text-gray-800" : "text-gray-500"}`}
                      >
                        Triển lãm được công bố rộng rãi
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Thông tin triển lãm được công bố rộng rãi cho công chúng
                      </div>
                    </div>
                  </>
                ),
              },
              {
                key: "upcoming",
                label: (
                  <div className="flex justify-between items-center">
                    <div
                      className={`${
                        localShowStatus === "upcoming"
                          ? " -ml-2 -my-2 py-2 pl-2 pr-3  flex items-center "
                          : ""
                      }`}
                    >
                      <RocketOutlined
                        className={`${localShowStatus === "upcoming" ? "text-cyan-500 text-lg" : "text-cyan-400"} mr-2`}
                      />
                      <span
                        className={`font-medium text-sm md:text-base ${localShowStatus === "upcoming" ? "text-cyan-500 font-bold" : "text-cyan-400"}`}
                      >
                        Sắp diễn ra
                      </span>
                      {localShowStatus === "upcoming" && (
                        <div className="ml-2 h-4 w-4 bg-cyan-500 rounded-full animate-pulse shadow-sm"></div>
                      )}
                    </div>
                  </div>
                ),
                className: `site-collapse-custom-panel border-0 border-l-4 relative ${
                  localShowStatus === "upcoming"
                    ? "border-cyan-500 pl-1 mb-3 bg-cyan-50 rounded-r-md shadow-md"
                    : "border-cyan-200 pl-1 mb-3 bg-gray-50 rounded-r-md"
                }`,
                children: (
                  <>
                    {localShowStatus === "upcoming" && (
                      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-cyan-500 rounded-full flex items-center justify-center shadow-md z-10">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    {availableStatuses
                      .filter(
                        (status) =>
                          status.selected &&
                          statusUIConfig[status.statusName]?.mainCategory ===
                            "upcoming"
                      )
                      .sort(
                        (a, b) =>
                          statusOrder[a.statusName] - statusOrder[b.statusName]
                      )
                      .map((status, index) => {
                        // Check if dates are the same
                        const sameDay =
                          status.startDate &&
                          status.endDate &&
                          dayjs(status.startDate).format("YYYY-MM-DD") ===
                            dayjs(status.endDate).format("YYYY-MM-DD");

                        return (
                          <div
                            key={status.statusName}
                            className={`pl-7 relative mb-4 p-3 ${localShowStatus === "upcoming" ? "border border-cyan-200 bg-white rounded-md" : ""}`}
                          >
                            <div
                              className={`absolute left-1 top-5 h-3 w-3 rounded-full ${
                                localShowStatus === "upcoming"
                                  ? "bg-cyan-500"
                                  : "bg-cyan-200"
                              }`}
                            ></div>
                            <div
                              className={`font-medium ${localShowStatus === "upcoming" ? "text-gray-800" : "text-gray-500"}`}
                            >
                              {status.description}
                            </div>
                            {!isEditing && status.startDate && (
                              <div className="text-xs text-gray-500">
                                {sameDay ? (
                                  <>
                                    {formatDate(status.startDate)},{" "}
                                    {formatTime(status.startDate)} -{" "}
                                    {formatTime(status.endDate)}
                                  </>
                                ) : (
                                  <>
                                    {formatDate(status.startDate)}{" "}
                                    {formatTime(status.startDate)} -{" "}
                                    {formatDate(status.endDate)}{" "}
                                    {formatTime(status.endDate)}
                                  </>
                                )}
                              </div>
                            )}

                            {isEditing &&
                              status.statusName === "RegistrationOpen" && (
                                <div className="mt-2 space-y-2">
                                  <div className="grid grid-cols-1 gap-2">
                                    <div>
                                      <div className="mb-1">
                                        <label className="block text-xs mb-1">
                                          Ngày bắt đầu:
                                        </label>
                                        <DatePicker
                                          showTime={{ defaultValue: null }}
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
                                        <label className="block text-xs mb-1">
                                          Ngày kết thúc:
                                        </label>
                                        <DatePicker
                                          showTime={{ defaultValue: null }}
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
                                          format="YYYY-MM-DD HH:mm:ss"
                                          placeholder="Chọn ngày kết thúc"
                                          showNow={false}
                                          popupClassName="timezone-popup"
                                          renderExtraFooter={() => (
                                            <div className="text-xs text-gray-500 text-right"></div>
                                          )}
                                          disabledDate={(current) => {
                                            if (
                                              editingStatuses[status.statusName]
                                                ?.startDate &&
                                              current.isBefore(
                                                editingStatuses[
                                                  status.statusName
                                                ].startDate,
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
                              )}
                          </div>
                        );
                      })}
                  </>
                ),
              },
              {
                key: "inprogress",
                label: (
                  <div className="flex justify-between items-center">
                    <div
                      className={`${
                        localShowStatus === "inprogress"
                          ? " -ml-2 -my-2 py-2 pl-2 pr-3  flex items-center "
                          : ""
                      }`}
                    >
                      <PlayCircleOutlined
                        className={`${localShowStatus === "inprogress" ? "text-purple-500 text-lg" : "text-purple-400"} mr-2`}
                      />
                      <span
                        className={`font-medium text-sm md:text-base ${localShowStatus === "inprogress" ? "text-purple-500 font-bold" : "text-purple-400"}`}
                      >
                        Đang diễn ra
                      </span>
                    </div>
                    {localShowStatus === "inprogress" && (
                      <div className="ml-2 h-4 w-4 bg-purple-500 rounded-full animate-pulse shadow-sm"></div>
                    )}
                  </div>
                ),
                className: `site-collapse-custom-panel border-0 border-l-4 relative ${
                  localShowStatus === "inprogress"
                    ? "border-purple-500 pl-1 mb-3 bg-purple-50 rounded-r-md shadow-md"
                    : "border-purple-200 pl-1 mb-3 bg-gray-50 rounded-r-md"
                }`,
                children: (
                  <>
                    {localShowStatus === "inprogress" && (
                      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-purple-500 rounded-full flex items-center justify-center shadow-md z-10">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    {availableStatuses
                      .filter(
                        (status) =>
                          status.selected &&
                          statusUIConfig[status.statusName]?.mainCategory ===
                            "inprogress"
                      )
                      .sort(
                        (a, b) =>
                          statusOrder[a.statusName] - statusOrder[b.statusName]
                      )
                      .map((status, index, array) => {
                        // Check if dates are the same
                        const sameDay =
                          status.startDate &&
                          status.endDate &&
                          dayjs(status.startDate).format("YYYY-MM-DD") ===
                            dayjs(status.endDate).format("YYYY-MM-DD");

                        return (
                          <div key={status.statusName} className="relative">
                            <div
                              className={`pl-7 relative mb-4 p-3 ${localShowStatus === "inprogress" ? "border border-purple-200 bg-white rounded-md" : ""}`}
                            >
                              <div
                                className={`absolute left-1 top-5 h-3 w-3 rounded-full ${
                                  localShowStatus === "inprogress"
                                    ? "bg-purple-500"
                                    : "bg-purple-200"
                                }`}
                              ></div>
                              <div
                                className={`font-medium ${localShowStatus === "inprogress" ? "text-gray-800" : "text-gray-500"}`}
                              >
                                {status.description}
                              </div>

                              {!isEditing && status.startDate && (
                                <div className="text-xs text-gray-500">
                                  {sameDay ? (
                                    <>
                                      {formatDate(status.startDate)},{" "}
                                      {formatTime(status.startDate)} -{" "}
                                      {formatTime(status.endDate)}
                                    </>
                                  ) : (
                                    <>
                                      {formatDate(status.startDate)}{" "}
                                      {formatTime(status.startDate)} -{" "}
                                      {formatDate(status.endDate)}{" "}
                                      {formatTime(status.endDate)}
                                    </>
                                  )}
                                </div>
                              )}

                              {isEditing &&
                                status.statusName !== "RegistrationOpen" && (
                                  <div className="mt-2 space-y-2">
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
                                            <label className="block text-xs mb-1">
                                              Giờ bắt đầu:
                                            </label>
                                            <TimePicker
                                              className="w-full"
                                              size="small"
                                              value={
                                                editingStatuses[
                                                  status.statusName
                                                ]?.startDate
                                              }
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
                                            <label className="block text-xs mb-1">
                                              Giờ kết thúc:
                                            </label>
                                            <TimePicker
                                              className="w-full"
                                              size="small"
                                              value={
                                                editingStatuses[
                                                  status.statusName
                                                ]?.endDate
                                              }
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
                                )}
                            </div>
                            {index < array.length - 1 && (
                              <div className="border-b border-dashed border-gray-200 mx-7 mb-4"></div>
                            )}
                          </div>
                        );
                      })}
                  </>
                ),
              },
              {
                key: "finished",
                label: (
                  <div className="flex justify-between items-center">
                    <div
                      className={`${
                        localShowStatus === "finished"
                          ? "-ml-2 -my-2 py-2 pl-2 pr-3  flex items-center "
                          : ""
                      }`}
                    >
                      <CheckCircleOutlined
                        className={`${localShowStatus === "finished" ? "text-gray-600 text-lg" : "text-gray-400"} mr-2`}
                      />
                      <span
                        className={`font-medium text-sm md:text-base ${localShowStatus === "finished" ? "text-gray-600 font-bold" : "text-gray-400"}`}
                      >
                        Kết thúc
                      </span>
                    </div>
                    {localShowStatus === "finished" && (
                      <div className="ml-2 h-4 w-4 bg-gray-600 rounded-full animate-pulse shadow-sm"></div>
                    )}
                  </div>
                ),
                className: `site-collapse-custom-panel border-0 border-l-4 relative ${
                  localShowStatus === "finished"
                    ? "border-gray-500 pl-1 mb-3 bg-gray-100 rounded-r-md shadow-md"
                    : "border-gray-200 pl-1 mb-3 bg-gray-50 rounded-r-md"
                }`,
                children: (
                  <>
                    {localShowStatus === "finished" && (
                      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-gray-500 rounded-full flex items-center justify-center shadow-md z-10">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    <div
                      className={`pl-7 relative p-3 ${localShowStatus === "finished" ? "border border-gray-200 bg-white rounded-md" : ""}`}
                    >
                      <div
                        className={`absolute left-1 top-6 h-3 w-3 rounded-full ${
                          localShowStatus === "finished"
                            ? "bg-gray-500"
                            : "bg-gray-200"
                        }`}
                      ></div>
                      <div
                        className={`font-medium ${localShowStatus === "finished" ? "text-gray-800" : "text-gray-500"}`}
                      >
                        Kết thúc sự kiện
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Triển lãm đã kết thúc
                      </div>
                      {showEndDate && (
                        <div className="text-xs text-gray-500">
                          {formatDate(showEndDate)}, {formatTime(showEndDate)}
                        </div>
                      )}
                    </div>
                  </>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default StatusManager;
