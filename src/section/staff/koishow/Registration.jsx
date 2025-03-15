import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Image,
  Col,
  Row,
  Card,
  Space,
  Tag,
  notification,
  Tooltip,
  Flex,
  Badge,
  Typography,
  Select,
  Empty,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  FilterOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import useRegistration from "../../../hooks/useRegistration";
import useCategory from "../../../hooks/useCategory";
import RoundSelector from "./RoundSelector";
import Title from "antd/es/skeleton/Title";

function Registration({ showId }) {
  const {
    registration,
    isLoading,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    updateStatus,
    fetchRegistration,
    assignToTank,
    assignLoading,
    selectedRegistrations,
    setSelectedRegistrations,
    selectAllCheckedInRegistrations,
    clearSelectedRegistrations,
  } = useRegistration();

  const { categories, fetchCategories } = useCategory();

  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedRoundName, setSelectedRoundName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Các state khác giữ nguyên
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentKoi, setCurrentKoi] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState(null);
  const { confirm } = Modal;
  const roundSelectorRef = useRef(null);
  const statusOptions = [
    { value: "waittopaid", label: "Chờ thanh toán" },
    { value: "paid", label: "Đã thanh toán" },
    { value: "cancelled", label: "Đã hủy" },
    { value: "pending", label: "Đang chờ" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "checkin", label: "Đã check-in" },
    { value: "rejected", label: "Từ chối" },
  ];

  useEffect(() => {
    fetchCategories(showId);
    fetchRegistration(1, 10, showId);
  }, []);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);

    if (value) {
      // Fetch by selected category
      fetchRegistration(1, 10, showId, [value]);
    } else {
      // Clear data when no category is selected
      fetchRegistration(1, 10, showId);
    }
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
  };

  const getFilteredData = () => {
    if (!registration || registration.length === 0) return [];

    return registration.filter((item) => {
      // Check if status matches (case insensitive)
      const statusMatches =
        !selectedStatus ||
        item.status?.toLowerCase() === selectedStatus.toLowerCase();

      return statusMatches;
    });
  };

  // Get the filtered data
  const filteredData = getFilteredData();

  const handleRoundSelect = (roundId, roundName) => {
    setSelectedRoundId(roundId);
    setSelectedRoundName(roundName);
  };

  const showAssignModal = () => {
    setIsAssignModalVisible(true);
    setSelectedRoundId(null);
    setSelectedRoundName("");
    clearSelectedRegistrations();
  };

  const closeAssignModal = () => {
    setIsAssignModalVisible(false);
    // Reset các lựa chọn khi đóng modal
    setSelectedRoundId(null);
    setSelectedRoundName("");
    clearSelectedRegistrations();

    // Reset RoundSelector thông qua ref
    if (roundSelectorRef.current) {
      roundSelectorRef.current.reset();
    }
  };

  const handleTableChange = (pagination) => {
    if (selectedCategory) {
      fetchRegistration(pagination.current, pagination.pageSize, showId, [
        selectedCategory,
      ]);
    } else {
      fetchRegistration(pagination.current, pagination.pageSize, showId);
    }
  };

  const handleSelectAllCheckedIn = () => {
    const checkedInIds = selectAllCheckedInRegistrations();
    if (checkedInIds.length === 0) {
      notification.info({
        message: "Không có đăng ký nào",
        description: "Không tìm thấy đăng ký nào có trạng thái đã check-in",
        placement: "topRight",
      });
    } else {
      notification.success({
        message: "Đã chọn đăng ký",
        description: `Đã chọn ${checkedInIds.length} đăng ký có trạng thái đã check-in`,
        placement: "topRight",
      });
    }
  };

  const handleAssignToTank = () => {
    if (!selectedRoundId) {
      notification.warning({
        message: "Chưa chọn vòng",
        description: "Vui lòng chọn vòng trước khi gán bể",
        placement: "topRight",
      });
      return;
    }

    if (selectedRegistrations?.length === 0) {
      notification.warning({
        message: "Chưa chọn đăng ký",
        description: "Vui lòng chọn ít nhất một đăng ký để gán bể",
        placement: "topRight",
      });
      return;
    }

    confirm({
      title: "Xác nhận gán bể",
      content: (
        <div>
          <p>
            Bạn có chắc chắn muốn gán {selectedRegistrations.length} đăng ký vào
            vòng:
          </p>
          <p>
            <strong>{selectedRoundName}</strong>?
          </p>
        </div>
      ),
      icon: <ExclamationCircleOutlined />,
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        const result = await assignToTank(
          selectedRoundId,
          selectedRegistrations
        );

        if (result.success) {
          notification.success({
            message: "Gán bể thành công",
            description: "Các đăng ký đã được gán vào bể thành công",
            placement: "topRight",
          });
          closeAssignModal();
          fetchRegistration(currentPage, pageSize, showId); // Refresh danh sách
        } else {
          notification.error({
            message: "Gán bể thất bại",
            description: "Đã xảy ra lỗi khi gán bể. Vui lòng thử lại sau.",
            placement: "topRight",
          });
        }
      },
    });
  };

  const rowSelection = {
    selectedRowKeys: selectedRegistrations,
    onChange: (selectedRowKeys) => {
      setSelectedRegistrations(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status?.toLowerCase() !== "checkin", // Chỉ cho phép chọn các đăng ký đã check-in
      name: record.id,
    }),
  };

  const showConfirmModal = (id, status) => {
    const action = status === "confirmed" ? "phê duyệt" : "từ chối";
    const title =
      status === "confirmed" ? "Phê Duyệt Đăng Ký" : "Từ Chối Đăng Ký";

    confirm({
      title: title,
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn ${action} đăng ký này không?`,
      okText: "Đồng ý",
      okType: status === "confirmed" ? "primary" : "danger",
      cancelText: "Hủy",
      onOk() {
        return handleUpdateStatus(id, status);
      },
    });
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const result = await updateStatus(id, status);
      if (result.success) {
        notification.success({
          message: "Thành công",
          description: `${status === "confirmed" ? "Phê duyệt" : "Từ chối"} đăng ký thành công`,
          placement: "topRight",
        });

        // Cập nhật status trong currentKoi và set updatedStatus
        if (currentKoi) {
          setCurrentKoi({
            ...currentKoi,
            status: status,
          });
          setUpdatedStatus(status);
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: `${status === "confirmed" ? "Phê duyệt" : "Từ chối"} đăng ký thất bại`,
          placement: "topRight",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi cập nhật trạng thái",
        placement: "topRight",
      });
      console.error(error);
    }
  };

  // Hàm lấy URL hình ảnh đầu tiên từ koiMedia
  const getFirstImageUrl = (record) => {
    if (
      record.koiMedia &&
      Array.isArray(record.koiMedia) &&
      record.koiMedia.length > 0
    ) {
      const imageMedia = record.koiMedia.find(
        (media) => media.mediaType === "Image"
      );
      return imageMedia ? imageMedia.mediaUrl : null;
    }
    return null;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (_, __, index) => index + 1 + (currentPage - 1) * pageSize,
    },
    {
      title: "Tên người đăng ký",
      dataIndex: "registerName",
      key: "registerName",
    },
    {
      title: "Tên Koi",
      key: "koiName",
      render: (_, record) => record.koiProfile?.name || "N/A",
    },
    {
      title: "Hạng mục",
      dataIndex: "competitionCategory",
      key: "category",
      render: (category) => category?.name || "N/A",
    },
    {
      title: "Hình ảnh",
      key: "image",
      render: (_, record) => {
        const imageUrl = getFirstImageUrl(record);
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt="Koi"
            style={{
              width: 100,
              height: 70,
              objectFit: "cover",
              borderRadius: "4px",
            }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 70,
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
          >
            Không có ảnh
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "";
        let statusText = status;

        switch (status?.toLowerCase()) {
          case "waittopaid":
            color = "blue";
            statusText = "Chờ thanh toán";
            break;
          case "paid":
            color = "cyan";
            statusText = "Đã thanh toán";
            break;
          case "cancelled":
            color = "gray";
            statusText = "Đã hủy";
            break;
          case "pending":
            color = "orange";
            statusText = "Đang chờ";
            break;
          case "confirmed":
            color = "green";
            statusText = "Đã xác nhận";
            break;
          case "checkin":
            color = "geekblue";
            statusText = "Đã check-in";
            break;
          case "rejected":
            color = "red";
            statusText = "Từ chối";
            break;
          default:
            color = "default";
            statusText = status || "N/A";
        }

        return (
          <Tag color={color} style={{ fontWeight: "medium" }}>
            {statusText}
          </Tag>
        );
      },
    },
  ];

  return (
    <Card className="rounded-lg shadow-md">
      {/* Header section */}
      <Flex justify="space-between" align="center" className="mb-6">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản lý đăng ký
        </Typography.Title>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={showAssignModal}
        >
          Gán vòng
        </Button>
      </Flex>

      {/* Thêm bộ lọc category và status */}
      <div className="mb-4 flex gap-4">
        <Select
          style={{ width: "50%" }}
          placeholder="Chọn hạng mục"
          onChange={handleCategoryChange}
          allowClear
          value={selectedCategory}
        >
          {categories?.map((category) => (
            <Select.Option key={category.id} value={category.id}>
              {category.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          style={{ width: "50%" }}
          placeholder="Lọc theo trạng thái"
          onChange={handleStatusChange}
          allowClear
          value={selectedStatus}
        >
          {statusOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Bảng danh sách đăng ký */}
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} đăng ký`,
          size: "default",
        }}
        onChange={handleTableChange}
        rowKey="id"
        size="middle"
        bordered={false}
        scroll={{ x: "max-content" }}
      />

      {/* Modal gán bể */}
      <Modal
        title="Gán cá tham gia vào vòng "
        open={isAssignModalVisible}
        onCancel={closeAssignModal}
        footer={[
          <Button key="cancel" onClick={closeAssignModal}>
            Hủy
          </Button>,
          <Button
            key="assign"
            type="primary"
            loading={assignLoading}
            onClick={handleAssignToTank}
            disabled={selectedRegistrations?.length === 0 || !selectedRoundId}
          >
            Gán bể
          </Button>,
        ]}
        width={1000}
      >
        <div className="mb-4">
          <Typography.Title level={5}>Chọn vòng</Typography.Title>
          {/* Truyền selectedCategory vào RoundSelector */}
          <RoundSelector
            ref={roundSelectorRef}
            onRoundSelect={handleRoundSelect}
            showId={showId}
            categoryId={selectedCategory}
          />
        </div>

        {selectedRoundId && (
          <>
            <div className="mb-4">
              <Typography.Title level={5}>Chọn đăng ký</Typography.Title>
              <Space className="mb-2">
                <Button
                  icon={<CheckSquareOutlined />}
                  onClick={selectAllCheckedInRegistrations}
                  disabled={isLoading}
                >
                  Chọn tất cả đã check-in
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={clearSelectedRegistrations}
                  disabled={selectedRegistrations?.length === 0}
                >
                  Bỏ chọn
                </Button>
              </Space>
            </div>

            {selectedRegistrations?.length > 0 && (
              <Card
                size="small"
                className="mb-4"
                style={{
                  background: "#EBF5FF",
                  borderLeft: "4px solid #1890ff",
                  borderRadius: 8,
                }}
              >
                <Flex align="center" gap="middle">
                  <InfoCircleOutlined
                    style={{ color: "#1890ff", fontSize: 18 }}
                  />
                  <div>
                    <Typography.Text strong>
                      Đã chọn {selectedRegistrations.length} đăng ký
                    </Typography.Text>
                    {selectedRoundName && (
                      <Typography.Text>
                        {" "}
                        để gán vào vòng{" "}
                        <Typography.Text strong>
                          {selectedRoundName}
                        </Typography.Text>
                      </Typography.Text>
                    )}
                  </div>
                </Flex>
              </Card>
            )}

            <Table
              rowSelection={rowSelection}
              columns={columns.filter((col) => col.key !== "actions")} // Bỏ cột thao tác
              dataSource={registration.filter(
                (reg) => reg.status?.toLowerCase() === "checkin"
              )}
              loading={isLoading}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} đăng ký đã check-in`,
              }}
              rowKey="id"
              size="small"
              bordered={false}
            />
          </>
        )}
      </Modal>
    </Card>
  );
}

export default Registration;
