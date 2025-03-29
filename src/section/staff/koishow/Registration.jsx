import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Image,
  Card,
  Space,
  Tag,
  notification,
  Flex,
  Typography,
  Select,
  Alert,
  Spin,
  Row,
  Col,
  ConfigProvider,
} from "antd";
import {
  ExclamationCircleOutlined,
  SendOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import useRegistration from "../../../hooks/useRegistration";
import useCategory from "../../../hooks/useCategory";
import RoundSelector from "./RoundSelector";

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
    assignToRound,
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
    { value: "pending", label: "Đang chờ" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "checkin", label: "Đã check-in" },
    { value: "rejected", label: "Từ chối" },
  ];

  // Cập nhật STATUS_CONFIG để chỉ bao gồm 4 trạng thái chính
  const STATUS_CONFIG = {
    pending: { color: "orange", label: "Đang chờ", order: 1 },
    confirmed: { color: "green", label: "Đã xác nhận", order: 2 },
    checkin: { color: "geekblue", label: "Đã check-in", order: 3 },
    competition: { color: "purple", label: "Thi đấu", order: 4 },
    rejected: { color: "red", label: "Từ chối", order: 5 },
  };

  // Hàm này dùng để render và cũng có thể dùng ở nơi khác
  const renderStatus = (status) => {
    const statusKey = status?.toLowerCase() || "";
    const config = STATUS_CONFIG[statusKey] || {
      color: "default",
      label: status || "N/A",
      order: 999,
    };

    return (
      <Tag color={config.color} style={{ fontWeight: "medium" }}>
        {config.label}
      </Tag>
    );
  };

  // Add these new state variables
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);

  useEffect(() => {
    fetchCategories(showId);
    fetchRegistration(1, 10, showId);
  }, []);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    // Reset selected status khi thay đổi category
    setSelectedStatus(null);

    // Fetch lại dữ liệu với category mới
    fetchRegistration(1, 10, showId, value ? [value] : undefined);
  };

  const handleRoundSelect = (roundId, roundName) => {
    setSelectedRoundId(roundId);
    setSelectedRoundName(roundName);
  };

  const showAssignModal = () => {
    if (!selectedCategory) {
      notification.warning({
        message: "Chưa đủ thông tin",
        description: "Vui lòng chọn hạng mục trước khi gán vòng",
        placement: "topRight",
      });
      return;
    }

    setIsAssignModalVisible(true);
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

  const handleTableChange = (pagination, filters, sorter) => {
    // Get all selected statuses from filters (can be multiple now)
    const filteredStatuses = filters.status;

    // Update selectedStatus state to handle multiple selections
    setSelectedStatus(filteredStatuses);

    // Fetch data with filters
    fetchRegistration(
      pagination.current,
      pagination.pageSize,
      showId,
      selectedCategory ? [selectedCategory] : undefined,
      filteredStatuses // Pass the array of selected statuses
    );
  };

  const handleassignToRound = () => {
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
      title: "Xác nhận gán vòng",
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
        const result = await assignToRound(
          selectedRoundId,
          selectedRegistrations
        );

        if (result.success) {
          closeAssignModal();
          fetchRegistration(currentPage, pageSize, showId);
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
      disabled:
        selectedStatus && selectedStatus.length > 0
          ? !selectedStatus.includes(record.status?.toLowerCase())
          : record.status?.toLowerCase() !== "checkin",
      name: record.id,
    }),
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
  const getFilteredData = () => {
    // If no category selected, return empty array
    if (!selectedCategory) {
      return [];
    }

    if (!registration || registration.length === 0) return [];

    return registration.filter((item) => {
      const categoryMatches = item.competitionCategory?.id === selectedCategory;

      // Handle multiple status filtering
      const statusMatches =
        selectedStatus && selectedStatus.length > 0
          ? selectedStatus.includes(item.status?.toLowerCase())
          : true;

      return categoryMatches && statusMatches;
    });
  };
  const handleViewDetails = (record) => {
    setCurrentKoi(record);
    setUpdatedStatus(null);
    setIsModalVisible(true);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
    setUpdatedStatus(null);
    setCurrentKoi(null);
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
        // Only update the UI state, notifications are handled in the hook
        if (currentKoi) {
          setCurrentKoi({
            ...currentKoi,
            status: status,
          });
          setUpdatedStatus(status);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  // Lấy dữ liệu đã lọc
  const filteredData = getFilteredData();
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
              width: 120,
              objectFit: "cover",
              borderRadius: "4px",
            }}
            preview={false}
            placeholder={
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Spin size="small" />
              </div>
            }
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
      render: renderStatus,
      filters: Object.entries(STATUS_CONFIG).map(([key, config]) => ({
        text: config.label,
        value: key,
      })),
      onFilter: (value, record) => {
        return record.status?.toLowerCase() === value;
      },
      filterMode: "menu",
      filterMultiple: true,
      filterSearch: false,
      filterDropdownProps: {
        locale: {
          filterReset: "Xóa",
          filterConfirm: "Đồng ý",
        },
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{ color: "#4B5563" }}
          />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      locale={{
        Table: {
          filterReset: "Xóa",
          filterConfirm: "Đồng ý",
        },
      }}
    >
      <Card className="rounded-lg shadow-md">
        {/* Header section */}
        <Flex justify="space-between" align="center" className="mb-6">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Quản lý đăng ký
          </Typography.Title>
          {filteredData.some(
            (item) => item.status?.toLowerCase() === "checkin"
          ) && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={showAssignModal}
            >
              Gán vòng
            </Button>
          )}
        </Flex>
        {/* Thêm bộ lọc category và status */}
        <div className="mb-4">
          <Select
            style={{ width: "25%" }}
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
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          pagination={
            filteredData.length > 0
              ? {
                  current: currentPage,
                  pageSize: pageSize,
                  total: filteredData.length, // Sử dụng độ dài của dữ liệu đã lọc
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} trong ${total}`,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                }
              : false
          }
          onChange={handleTableChange}
          rowKey="id"
          size="middle"
          bordered={false}
          scroll={{ x: "max-content" }}
        />
        {/* Modal gán bể */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Gán cá tham gia vào vòng</span>
            </div>
          }
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
              onClick={handleassignToRound}
              disabled={selectedRegistrations?.length === 0 || !selectedRoundId}
            >
              Gán vòng
            </Button>,
          ]}
          width={1000}
        >
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <Typography.Text strong>Chọn vòng</Typography.Text>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <RoundSelector
                ref={roundSelectorRef}
                onRoundSelect={handleRoundSelect}
                showId={showId}
                categoryId={selectedCategory}
                preSelectPreliminary={true}
              />
            </div>
          </div>

          {selectedRoundId && (
            <>
              <div
                style={{
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: "24px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <CheckSquareOutlined
                      style={{ color: "#1890ff", marginRight: "8px" }}
                    />
                    <Typography.Text strong>
                      Danh sách cá đăng ký
                    </Typography.Text>
                  </div>
                </div>

                {selectedRegistrations?.length > 0 && (
                  <Alert
                    type="info"
                    showIcon
                    message={
                      <span>
                        Đã chọn <strong>{selectedRegistrations.length}</strong>{" "}
                        đăng ký để gán vào vòng{" "}
                        <strong>{selectedRoundName}</strong>
                      </span>
                    }
                    style={{ marginBottom: "16px" }}
                  />
                )}

                <Table
                  rowSelection={rowSelection}
                  columns={columns.filter((col) => col.key !== "actions")}
                  dataSource={registration.filter(
                    (reg) =>
                      reg.status?.toLowerCase() === "checkin" &&
                      reg.competitionCategory?.id === selectedCategory
                  )}
                  loading={isLoading}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: registration.filter(
                      (reg) => reg.status?.toLowerCase() === "checkin"
                    ).length,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} trong ${total}`,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                  }}
                  rowKey="id"
                  size="small"
                  bordered={false}
                />
              </div>
            </>
          )}
        </Modal>
        <Modal
          title="Chi Tiết Đăng Ký"
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={900}
        >
          {currentKoi && (
            <div className="p-4">
              <Row gutter={[16, 16]}>
                {/* Thông tin đăng ký */}
                <Col span={24}>
                  <Card
                    title="Thông Tin Đăng Ký"
                    bordered={false}
                    className="w-full"
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <p>
                          <strong>Tên Người Đăng Ký:</strong>{" "}
                          {currentKoi.registerName}
                        </p>
                        <p>
                          <strong>Tên Cá Koi:</strong>{" "}
                          {currentKoi.koiProfile.name}
                        </p>
                        <p>
                          <strong>Kích Thước Cá:</strong> {currentKoi.koiSize}{" "}
                          cm
                        </p>
                        <p>
                          <strong>Giống:</strong>{" "}
                          {currentKoi?.koiProfile?.variety?.name}
                        </p>

                        <p>
                          <strong>Tuổi Cá:</strong> {currentKoi.koiAge}
                        </p>
                      </Col>
                      <Col span={12}>
                        <p>
                          <strong>Hạng Mục:</strong>{" "}
                          {currentKoi.competitionCategory?.name}
                        </p>
                        {currentKoi.koiShow && (
                          <p>
                            <strong>Tên Cuộc Thi:</strong>{" "}
                            {currentKoi.koiShow.name}
                          </p>
                        )}
                        <p>
                          <strong>Phí Đăng Ký:</strong>{" "}
                          {currentKoi.registrationFee?.toLocaleString() || 0}{" "}
                          VND
                        </p>
                        <p>
                          <strong>Trạng Thái:</strong>{" "}
                          {renderStatus(currentKoi.status)}
                        </p>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* Koi Media */}
                {currentKoi.koiMedia && currentKoi.koiMedia.length > 0 && (
                  <Col span={24}>
                    <Card
                      title="Hình Ảnh/Video Cá Koi"
                      variant={false}
                      className="w-full"
                    >
                      <Row gutter={[16, 16]}>
                        {/* Limit display to first 2 media items initially */}
                        {currentKoi.koiMedia.slice(0, 2).map((media, index) => (
                          <Col span={12} key={media.id} className="relative">
                            {media.mediaType === "Image" ? (
                              <div className="relative">
                                <p>
                                  <strong>Hình Ảnh:</strong>
                                </p>
                                <Image
                                  src={media.mediaUrl}
                                  alt="Hình Ảnh Koi"
                                  style={{
                                    width: "100%",
                                    maxHeight: "300px",
                                    objectFit: "contain",
                                  }}
                                />
                                {/* Add overlay with +X on the second image if there are more than 2 */}
                                {index === 1 &&
                                  currentKoi.koiMedia.length > 2 && (
                                    <div
                                      onClick={() => setMediaModalVisible(true)}
                                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                                      style={{ borderRadius: "8px" }}
                                    >
                                      <span className="text-white font-semibold">
                                        +{currentKoi.koiMedia.length - 2}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            ) : media.mediaType === "Video" ? (
                              <div className="relative">
                                <p>
                                  <strong>Video:</strong>
                                </p>
                                <video
                                  controls
                                  src={media.mediaUrl}
                                  style={{ width: "100%", maxHeight: "300px" }}
                                />
                                {/* Add overlay with +X on the second video if there are more than 2 */}
                                {index === 1 &&
                                  currentKoi.koiMedia.length > 2 && (
                                    <div
                                      onClick={() => setMediaModalVisible(true)}
                                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                                      style={{ borderRadius: "8px" }}
                                    >
                                      <span className="text-white font-semibold">
                                        +{currentKoi.koiMedia.length - 2}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            ) : null}
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>

              {/* Nút Approve/Reject */}
              {currentKoi.status === "pending" && (
                <div className="mt-4 text-center space-x-3">
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => showConfirmModal(currentKoi.id, "confirmed")}
                    style={{
                      backgroundColor: "#52c41a",
                      color: "white",
                      borderColor: "#52c41a",
                    }}
                  >
                    Phê Duyệt
                  </Button>

                  <Button
                    type="primary"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => showConfirmModal(currentKoi.id, "rejected")}
                    style={{
                      backgroundColor: "#dc2626",
                      borderColor: "#dc2626",
                      color: "white",
                    }}
                  >
                    Từ Chối
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
        {/* Add a new modal to display all media */}
        <Modal
          title="Tất cả hình ảnh/video"
          open={mediaModalVisible}
          onCancel={() => setMediaModalVisible(false)}
          footer={null}
          width={900}
        >
          <Row gutter={[16, 16]}>
            {currentKoi?.koiMedia?.map((media) => (
              <Col span={12} key={media.id}>
                {media.mediaType === "Image" ? (
                  <div>
                    <Image
                      src={media.mediaUrl}
                      alt="Hình Ảnh Koi"
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                ) : media.mediaType === "Video" ? (
                  <div>
                    <video
                      controls
                      src={media.mediaUrl}
                      style={{ width: "100%", maxHeight: "300px" }}
                    />
                  </div>
                ) : null}
              </Col>
            ))}
          </Row>
        </Modal>
      </Card>
    </ConfigProvider>
  );
}

export default Registration;
