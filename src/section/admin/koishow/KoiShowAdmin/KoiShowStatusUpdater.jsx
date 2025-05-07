import React, { useState, useEffect } from "react";
import { Select, Modal, Form, Input, notification } from "antd";
import signalRService from "../../../../config/signalRService";

function KoiShowStatusUpdater({
  showId,
  currentStatus,
  onStatusUpdate,
  updateKoiShowStatus,
}) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [status, setStatus] = useState(currentStatus);

  // Initialize SignalR connection on component mount
  useEffect(() => {
    let unsubscribe = null;

    const initializeSignalR = async () => {
      try {
        await signalRService.startShowConnection();
        // console.log("SignalR Show connection started in KoiShowStatusUpdater");

        // Subscribe to show status updates
        unsubscribe = signalRService.subscribeToShowStatusUpdates(
          (updatedShowId, updatedStatus) => {
            if (updatedShowId === showId) {
              setStatus(updatedStatus);
              // Inform parent component about the status change
              onStatusUpdate(updatedStatus);
            }
          }
        );
      } catch (error) {
        console.error("Error starting SignalR connection:", error);
      }
    };

    initializeSignalR();

    return () => {
      // Unsubscribe when component unmounts
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showId]); // Only depend on showId, not onStatusUpdate

  // Update the local status when props change (in case it's updated elsewhere)
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const statusOptions = [
    { value: "pending", label: "Chờ duyệt", color: "orange" },
    { value: "internalpublished", label: "Công bố nội bộ", color: "blue" },
    { value: "published", label: "Công bố", color: "green" },
    { value: "upcoming", label: "Sắp diễn ra", color: "cyan" },
    { value: "inprogress", label: "Đang diễn ra", color: "purple" },
    { value: "finished", label: "Kết thúc", color: "gray" },
    { value: "cancelled", label: "Hủy", color: "red" },
  ];

  const getAvailableStatusOptions = (status) => {
    if (status === "pending") {
      return statusOptions.filter((option) =>
        ["internalpublished", "cancelled"].includes(option.value)
      );
    } else if (status === "internalpublished") {
      return statusOptions.filter((option) =>
        ["published", "cancelled"].includes(option.value)
      );
    } else if (status === "published") {
      return statusOptions.filter((option) =>
        ["upcoming", "cancelled"].includes(option.value)
      );
    } else if (status === "upcoming") {
      return statusOptions.filter((option) =>
        ["inprogress"].includes(option.value)
      );
    } else if (status === "inprogress") {
      return statusOptions.filter((option) =>
        ["finished"].includes(option.value)
      );
    } else {
      // For finished state or any other state, allow only current status
      return statusOptions.filter((option) => option.value === status);
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);

    if (status === "cancelled") {
      setIsModalOpen(true);
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  const updateStatus = async (status, reason = "") => {
    // Avoid re-renders - only update if status is actually changing
    if (status === currentStatus) {
      setIsConfirmModalOpen(false);
      return;
    }

    try {
      const result = await updateKoiShowStatus(showId, status, reason);

      if (result.success) {
        // Only show UI notifications, don't update state directly - this will happen via SignalR
        notification.success({
          message: "Thành công",
          description: `Cập nhật trạng thái triển lãm thành ${getStatusLabel(status)}`,
          placement: "topRight",
        });

        // Don't update the local state - let SignalR handle this to avoid double updates
        // setStatus(status);
      } else {
        notification.error({
          message: "Lỗi",
          description: result.message || "Cập nhật trạng thái thất bại",
          placement: "topRight",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra: " + error.message,
        placement: "topRight",
      });
    }
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      updateStatus(selectedStatus, values.cancellationReason);
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleConfirmStatusChange = () => {
    updateStatus(selectedStatus);
    setIsConfirmModalOpen(false);
  };

  const availableOptions = getAvailableStatusOptions(status);
  const statusOption = statusOptions.find((option) => option.value === status);

  const statusLabel = statusOption ? statusOption.label : status;
  const statusColor = statusOption ? statusOption.color : "black";

  return (
    <>
      <style>
        {`
          .status-select-${showId} .ant-select-selection-item {
            color: ${statusColor} !important;
            font-weight: 500;
          }
        `}
      </style>
      <Select
        value={statusLabel}
        style={{ width: "100%" }}
        className={`status-select-${showId}`}
        onChange={(_, option) => {
          const statusCode = option.key;
          handleStatusChange(statusCode);
        }}
        dropdownStyle={{ minWidth: 150 }}
        size="middle"
      >
        {availableOptions.map((opt) => (
          <Select.Option key={opt.value} value={opt.label}>
            <span style={{ color: opt.color, fontWeight: 500 }}>
              {opt.label}
            </span>
          </Select.Option>
        ))}
      </Select>

      <Modal
        title="Lý do hủy triển lãm"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        width={520}
        centered
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="cancellationReason"
            label="Lý do hủy"
            rules={[
              { required: true, message: "Vui lòng nhập lý do hủy triển lãm" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Nhập lý do hủy triển lãm" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận thay đổi trạng thái"
        open={isConfirmModalOpen}
        onOk={handleConfirmStatusChange}
        onCancel={() => setIsConfirmModalOpen(false)}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        width={520}
        centered
        maskClosable={false}
      >
        <p>
          Bạn có chắc chắn muốn thay đổi trạng thái từ "{getStatusLabel(status)}
          " thành "{getStatusLabel(selectedStatus)}"?
        </p>
        <p className="text-red-500 font-medium">
          Lưu ý: Khi đã cập nhật trạng thái, bạn sẽ không thể quay lại trạng
          thái trước đó.
        </p>
      </Modal>
    </>
  );
}

export default KoiShowStatusUpdater;
