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
  Row,
  Col,
  ConfigProvider,
  Input,
  Empty,
  Spin,
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
import useRegistration from "../../../../hooks/useRegistration";
import useCategory from "../../../../hooks/useCategory";
import RoundSelector from "./RoundSelector";
import { Loading } from "../../../../components";

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

function Registration({ showId, statusShow }) {
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentKoi, setCurrentKoi] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState(null);
  const [checkinRegistrations, setCheckinRegistrations] = useState([]);
  const { confirm } = Modal;
  const roundSelectorRef = useRef(null);
  const statusOptions = [
    { value: "pending", label: "Đang chờ" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "checkin", label: "Đã check-in" },
    { value: "rejected", label: "Từ chối" },
    { value: "prizewinner", label: "Đạt giải" },
    { value: "eliminated", label: "Bị loại" },
    { value: "waittopaid", label: "Chờ thanh toán" },
  ];

  // Thêm lại định nghĩa REFUND_TYPE_OPTIONS
  const REFUND_TYPE_OPTIONS = [
    { value: "NotQualified", label: "Không đủ điều kiện" },
    { value: "ShowCancelled", label: "Show bị hủy" },
  ];

  const STATUS_CONFIG = {
    pending: { color: "orange", label: "Đang chờ", order: 1 },
    confirmed: { color: "green", label: "Đã xác nhận", order: 2 },
    checkin: { color: "geekblue", label: "Đã check-in", order: 3 },
    competition: { color: "purple", label: "Thi đấu", order: 4 },
    rejected: { color: "red", label: "Từ chối", order: 5 },
    refunded: { color: "magenta", label: "Đã hoàn tiền", order: 6 },
    prizewinner: { color: "gold", label: "Đạt giải", order: 7 },
    eliminated: { color: "volcano", label: "Bị loại", order: 8 },
    waittopaid: { color: "gold", label: "Chờ thanh toán", order: 9 },
  };

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

  const [showAllMedia, setShowAllMedia] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionId, setRejectionId] = useState(null);
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [refundType, setRefundType] = useState(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);
  const [totalCheckinRegistrations, setTotalCheckinRegistrations] = useState(0);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    fetchCategories(showId);
    fetchRegistration(1, 10, showId);
  }, []);

  useEffect(() => {
    if (selectedStatus && selectedStatus.length > 0) {
      const statusLabels = selectedStatus.map(
        (status) => STATUS_CONFIG[status]?.label || status
      );
      setActiveFilters(statusLabels);
    } else {
      setActiveFilters([]);
    }
  }, [selectedStatus]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedStatus(null);
    setActiveFilters([]);

    fetchRegistration(1, 10, showId, value ? [value] : undefined, null);
  };

  const handleRoundSelect = (roundId, roundName) => {
    setSelectedRoundId(roundId);
    setSelectedRoundName(roundName);
  };

  const showAssignModal = () => {
    if (!selectedCategory) {
      notification.warning({
        message: "Chưa chọn hạng mục",
        description: "Vui lòng chọn hạng mục trước khi gán vòng",
        placement: "topRight",
      });
      return;
    }

    // Hiển thị loading trước khi lấy dữ liệu
    notification.info({
      message: "Đang lấy dữ liệu",
      description: "Đang lấy tất cả đăng ký đã check-in, vui lòng đợi...",
      placement: "topRight",
      duration: 2,
    });

    // Gọi API để lấy tất cả đăng ký có trạng thái checkin trong hạng mục đã chọn
    // Đặt pageSize rất lớn để lấy tất cả dữ liệu trong một trang
    fetchRegistration(
      1,
      1000, // Số lượng lớn để lấy tất cả đăng ký
      showId,
      [selectedCategory],
      ["checkin"] // Chỉ lấy các đăng ký đã check-in
    ).then((response) => {
      if (response && response.registration) {
        const checkedInFish = response.registration.filter(
          (reg) =>
            reg.status?.toLowerCase() === "checkin" &&
            reg.competitionCategory?.id === selectedCategory
        );

        if (checkedInFish.length === 0) {
          notification.warning({
            message: "Không có đăng ký",
            description: "Không có đăng ký nào đã check-in để gán vòng",
            placement: "topRight",
          });
          return;
        }

        setCheckinRegistrations(checkedInFish);
        setTotalCheckinRegistrations(checkedInFish.length);
        setIsAssignModalVisible(true);
        clearSelectedRegistrations();

        notification.success({
          message: "Đã lấy dữ liệu",
          description: `Đã tìm thấy ${checkedInFish.length} đăng ký đã check-in`,
          placement: "topRight",
        });
      } else {
        notification.error({
          message: "Lỗi",
          description: "Không thể lấy dữ liệu đăng ký",
          placement: "topRight",
        });
      }
    });
  };

  const closeAssignModal = () => {
    setIsAssignModalVisible(false);
    setSelectedRoundId(null);
    setSelectedRoundName("");
    clearSelectedRegistrations();
    setIsAllSelected(false);

    if (roundSelectorRef.current) {
      roundSelectorRef.current.reset();
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    const filteredStatuses = filters.status;

    setSelectedStatus(filteredStatuses);

    if (filteredStatuses && filteredStatuses.length > 0) {
      const statusLabels = filteredStatuses.map(
        (status) => STATUS_CONFIG[status]?.label || status
      );
      setActiveFilters(statusLabels);
    } else {
      setActiveFilters([]);
    }

    fetchRegistration(
      pagination.current,
      pagination.pageSize,
      showId,
      selectedCategory ? [selectedCategory] : undefined,
      filteredStatuses
    );
  };

  const handleassignToRound = () => {
    if (!selectedRoundId) {
      notification.warning({
        message: "Chưa chọn vòng",
        description: "Vui lòng chọn vòng trước khi gán vòng",
        placement: "topRight",
      });
      return;
    }

    if (selectedRegistrations?.length === 0) {
      notification.warning({
        message: "Chưa chọn đăng ký",
        description: "Vui lòng chọn ít nhất một đăng ký để gán vòng",
        placement: "topRight",
      });
      return;
    }

    // Hiển thị xác nhận khác nhau tùy theo số lượng đăng ký được chọn
    const isLargeNumber = selectedRegistrations.length > 20;
    const confirmTitle = isLargeNumber
      ? "Xác nhận gán vòng cho số lượng lớn"
      : "Xác nhận gán vòng";

    const confirmContent = (
      <div>
        <p>
          Bạn có chắc chắn muốn gán{" "}
          <strong>{selectedRegistrations.length}</strong> đăng ký vào vòng:
        </p>
        <p>
          <strong>{selectedRoundName}</strong>?
        </p>
        {isLargeNumber && (
          <Alert
            type="warning"
            showIcon
            message="Lưu ý: Thao tác này có thể mất một chút thời gian để hoàn thành"
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    );

    confirm({
      title: confirmTitle,
      content: confirmContent,
      icon: <ExclamationCircleOutlined />,
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        // Hiển thị loading khi bắt đầu gán
        notification.info({
          message: "Đang xử lý",
          description: `Đang gán ${selectedRegistrations.length} đăng ký vào vòng ${selectedRoundName}...`,
          placement: "topRight",
          duration: 3,
        });

        const result = await assignToRound(
          selectedRoundId,
          selectedRegistrations
        );

        if (result.success) {
          closeAssignModal();
          // Tải lại dữ liệu sau khi gán thành công
          fetchRegistration(
            currentPage,
            pageSize,
            showId,
            selectedCategory ? [selectedCategory] : undefined,
            selectedStatus
          );

          // Hiển thị thông báo thành công
          notification.success({
            message: "Gán vòng thành công",
            description: `Đã gán ${selectedRegistrations.length} đăng ký vào vòng ${selectedRoundName}`,
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
      setIsAllSelected(selectedRowKeys.length === checkinRegistrations.length);
    },
    getCheckboxProps: (record) => ({
      disabled:
        selectedStatus && selectedStatus.length > 0
          ? !selectedStatus.includes(record.status?.toLowerCase())
          : record.status?.toLowerCase() !== "checkin",
      name: record.id,
    }),
  };

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
    if (!registration || registration.length === 0) return [];

    if (!selectedCategory) {
      return registration;
    }

    return registration.filter((item) => {
      return item.competitionCategory?.id === selectedCategory;
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
    if (status === "rejected") {
      setRejectionId(id);
      setRejectionReason("");
      setIsRejectModalVisible(true);
      return;
    }

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

  const handleUpdateStatus = async (id, status, reason = null) => {
    try {
      const result = await updateStatus(id, status, reason);
      if (result.success) {
        if (currentKoi) {
          setCurrentKoi({
            ...currentKoi,
            status: status,
            rejectedReason: reason,
          });
          setUpdatedStatus(status);
        }

        fetchRegistration(
          currentPage,
          pageSize,
          showId,
          selectedCategory ? [selectedCategory] : undefined,
          selectedStatus
        );

        setIsModalVisible(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng nhập lý do từ chối",
        placement: "topRight",
      });
      return;
    }

    handleUpdateStatus(rejectionId, "rejected", rejectionReason);
    setIsRejectModalVisible(false);
  };

  const handleRefund = async () => {
    if (!refundType) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn lý do hoàn tiền",
        placement: "topRight",
      });
      return;
    }

    try {
      const result = await updateStatus(
        selectedRegistrationId,
        "Refunded",
        null,
        refundType
      );
      if (result.success) {
        setIsRefundModalVisible(false);
        setRefundType(null);
        fetchRegistration(
          currentPage,
          pageSize,
          showId,
          selectedCategory ? [selectedCategory] : undefined,
          selectedStatus
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectAllInModal = () => {
    if (isAllSelected) {
      clearSelectedRegistrations();
      setIsAllSelected(false);
      notification.info({
        message: "Đã bỏ chọn tất cả",
        description: "Bạn có thể chọn lại các đăng ký cần gán vòng",
        placement: "topRight",
      });
    } else {
      if (checkinRegistrations.length > 100) {
        // Hiển thị xác nhận nếu số lượng lớn
        confirm({
          title: "Chọn số lượng lớn",
          content: `Bạn đang chọn ${checkinRegistrations.length} đăng ký. Thao tác này có thể mất một chút thời gian. Bạn có muốn tiếp tục?`,
          okText: "Tiếp tục",
          cancelText: "Hủy",
          onOk: () => {
            const allIds = checkinRegistrations.map((item) => item.id);
            setSelectedRegistrations(allIds);
            setIsAllSelected(true);
            notification.success({
              message: "Đã chọn tất cả",
              description: `Đã chọn tất cả ${allIds.length} đăng ký để gán vòng`,
              placement: "topRight",
            });
          },
        });
      } else {
        // Nếu số lượng nhỏ, chọn ngay
        const allIds = checkinRegistrations.map((item) => item.id);
        setSelectedRegistrations(allIds);
        setIsAllSelected(true);
        notification.success({
          message: "Đã chọn tất cả",
          description: `Đã chọn tất cả ${allIds.length} đăng ký để gán vòng`,
          placement: "topRight",
        });
      }
    }
  };

  const clearAllFilters = () => {
    setSelectedStatus(null);
    setActiveFilters([]);
    fetchRegistration(
      1,
      pageSize,
      showId,
      selectedCategory ? [selectedCategory] : undefined,
      null
    );
  };

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
      title: "Chủ sở hữu",
      dataIndex: "registerName",
      key: "registerName",
    },
    {
      title: "Hình ảnh",
      key: "image",
      render: (_, record) => {
        const imageMedia =
          record.koiMedia && record.koiMedia.length > 0
            ? record.koiMedia.find((media) => media.mediaType === "Image")
            : null;

        const imageUrl = imageMedia?.mediaUrl || PLACEHOLDER_IMAGE;

        return (
          <div className="w-[70px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
            <Image
              src={imageUrl}
              alt="Hình cá"
              width={80}
              height={50}
              className="object-cover"
              preview={{
                src: imageMedia?.mediaUrl,
                mask: (
                  <div className="text-xs">
                    <EyeOutlined />
                  </div>
                ),
              }}
              placeholder={
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Loading />
                </div>
              }
              fallback={PLACEHOLDER_IMAGE}
            />
          </div>
        );
      },
    },
    {
      title: "Tên Koi",
      key: "koiName",
      render: (_, record) => record.koiProfile?.name || "N/A",
    },
    {
      title: "Kích thước",
      key: "koiSize",
      render: (_, record) => (record.koiSize ? `${record.koiSize} cm` : "N/A"),
    },
    {
      title: "Hạng mục",
      dataIndex: "competitionCategory",
      key: "category",
      render: (category) => category?.name || "N/A",
    },
    {
      title: () => (
        <span>
          Trạng thái
          {activeFilters.length > 0 && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {activeFilters.length}
            </Tag>
          )}
        </span>
      ),
      dataIndex: "status",
      key: "status",
      render: renderStatus,
      filters: Object.entries(STATUS_CONFIG).map(([key, config]) => ({
        text: config.label,
        value: key,
      })),
      filterMode: "menu",
      filterMultiple: true,
      filteredValue: selectedStatus || null,
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
        <Flex justify="space-between" align="center" className="mb-6">
          {/* <Typography.Title level={4} style={{ margin: 0 }}>
            Quản lý đăng ký
          </Typography.Title> */}
        </Flex>
        <Flex justify="space-between" align="center" className="mb-4">
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

        {activeFilters.length > 0 && (
          <Alert
            type="info"
            showIcon
            message={
              <Space>
                <Typography.Text strong>
                  Đang lọc theo trạng thái:
                </Typography.Text>
                {activeFilters.map((filter) => (
                  <Tag color="blue" key={filter} style={{ marginRight: 8 }}>
                    {filter}
                  </Tag>
                ))}
                <Button type="link" size="small" onClick={clearAllFilters}>
                  Xóa bộ lọc
                </Button>
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          pagination={
            filteredData.length > 0
              ? {
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalItems,
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
          locale={{
            emptyText: (
              <Empty
                description="Không có dữ liệu"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "24px 0" }}
              />
            ),
          }}
        />
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>
                Gán cá tham gia vào vòng - Tất cả {checkinRegistrations.length}{" "}
                đăng ký đã check-in
              </span>
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
              Gán {selectedRegistrations?.length} đăng ký vào vòng
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

          <Alert
            type="info"
            showIcon
            message="Tất cả đăng ký đã check-in của hạng mục này đang được hiển thị"
            description="Bạn có thể chọn và gán vòng cho tất cả đăng ký cùng một lúc"
            style={{ marginBottom: "16px" }}
          />

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

                  <Button
                    type={isAllSelected ? "default" : "primary"}
                    onClick={handleSelectAllInModal}
                    disabled={checkinRegistrations.length === 0}
                  >
                    {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </Button>
                </div>

                {selectedRegistrations?.length > 0 && (
                  <Alert
                    type="info"
                    showIcon
                    message={
                      <span>
                        Đã chọn <strong>{selectedRegistrations.length}</strong>{" "}
                        / <strong>{checkinRegistrations.length}</strong> đăng ký
                        để gán vào vòng <strong>{selectedRoundName}</strong>
                        {selectedRegistrations.length ===
                          checkinRegistrations.length && (
                          <Tag color="green" style={{ marginLeft: 8 }}>
                            Đã chọn tất cả
                          </Tag>
                        )}
                      </span>
                    }
                    style={{ marginBottom: "16px" }}
                  />
                )}

                <Table
                  rowSelection={rowSelection}
                  columns={columns.filter((col) => col.key !== "actions")}
                  dataSource={checkinRegistrations}
                  loading={isLoading}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  bordered={false}
                  scroll={{ y: 400 }}
                />
              </div>
            </>
          )}
        </Modal>
        <Modal
          title="Chi Tiết Đăng Ký"
          open={isModalVisible}
          onCancel={handleCancel}
          footer={
            <>
              <Button key="cancel" onClick={handleCancel}>
                Đóng
              </Button>
              {(statusShow === "cancelled" ||
                currentKoi?.status === "rejected") &&
                currentKoi?.status !== "Refunded" && (
                  <Button
                    key="refund"
                    type="primary"
                    danger
                    onClick={() => {
                      setSelectedRegistrationId(currentKoi.id);
                      setIsRefundModalVisible(true);
                      setIsModalVisible(false);
                    }}
                  >
                    Đã Hoàn Tiền
                  </Button>
                )}
            </>
          }
          width={900}
        >
          {currentKoi && (
            <div className="p-4">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card
                    title="Thông Tin Đăng Ký"
                    bordered={false}
                    className="w-full"
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <p>
                          <strong>Chủ sở hữu:</strong> {currentKoi.registerName}
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
                        {currentKoi.createdAt && (
                          <p>
                            <strong>Ngày Tạo:</strong>{" "}
                            {currentKoi.createdAt
                              ? new Date(currentKoi.createdAt).toLocaleString()
                              : "-"}
                          </p>
                        )}
                        <p>
                          <strong>Trạng Thái:</strong>{" "}
                          {renderStatus(currentKoi.status)}
                        </p>
                        {currentKoi.status === "rejected" &&
                          currentKoi.rejectedReason && (
                            <p>
                              <strong>Lý do từ chối:</strong>{" "}
                              {currentKoi.rejectedReason}
                            </p>
                          )}
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {currentKoi.koiMedia && currentKoi.koiMedia.length > 0 && (
                  <Col span={24}>
                    <Card
                      title="Hình Ảnh/Video Cá Koi"
                      variant={false}
                      className="w-full"
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <div>
                            <p>
                              <strong>Hình Ảnh:</strong>
                            </p>
                            {currentKoi.koiMedia.find(
                              (media) => media.mediaType === "Image"
                            ) ? (
                              <Image
                                src={
                                  currentKoi.koiMedia.find(
                                    (media) => media.mediaType === "Image"
                                  )?.mediaUrl
                                }
                                alt="Hình Ảnh Koi"
                                style={{
                                  width: "100%",
                                  height: "300px",
                                  objectFit: "contain",
                                  borderRadius: "4px",
                                }}
                                placeholder={
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "300px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Spin size="small" />
                                  </div>
                                }
                                preview={{
                                  mask: (
                                    <EyeOutlined style={{ fontSize: "18px" }} />
                                  ),
                                  icons: false,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "300px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  background: "#f0f0f0",
                                  borderRadius: "4px",
                                }}
                              >
                                Không có hình ảnh
                              </div>
                            )}
                            {currentKoi.koiMedia.filter(
                              (media) => media.mediaType === "Image"
                            ).length > 1 && (
                              <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => setMediaModalVisible(true)}
                                style={{ marginTop: 8 }}
                              >
                                Xem thêm{" "}
                                {currentKoi.koiMedia.filter(
                                  (media) => media.mediaType === "Image"
                                ).length - 1}{" "}
                                hình ảnh
                              </Button>
                            )}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div>
                            <p>
                              <strong>Video:</strong>
                            </p>
                            {currentKoi.koiMedia.find(
                              (media) => media.mediaType === "Video"
                            ) ? (
                              <video
                                controls
                                src={
                                  currentKoi.koiMedia.find(
                                    (media) => media.mediaType === "Video"
                                  )?.mediaUrl
                                }
                                style={{
                                  width: "100%",
                                  height: "270px",
                                  objectFit: "contain",
                                  borderRadius: "4px",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "300px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  background: "#f0f0f0",
                                  borderRadius: "4px",
                                }}
                              >
                                Không có video
                              </div>
                            )}
                            {currentKoi.koiMedia.filter(
                              (media) => media.mediaType === "Video"
                            ).length > 1 && (
                              <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => setMediaModalVisible(true)}
                                style={{ marginTop: 8 }}
                              >
                                Xem thêm{" "}
                                {currentKoi.koiMedia.filter(
                                  (media) => media.mediaType === "Video"
                                ).length - 1}{" "}
                                video
                              </Button>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>

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
        <Modal
          title="Tất cả hình ảnh và video"
          open={mediaModalVisible}
          onCancel={() => setMediaModalVisible(false)}
          footer={null}
          width={900}
        >
          {currentKoi?.koiMedia?.filter((media) => media.mediaType === "Image")
            .length > 0 && (
            <>
              <Typography.Title level={5}>Hình Ảnh</Typography.Title>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {currentKoi?.koiMedia
                  ?.filter((media) => media.mediaType === "Image")
                  .map((media, index) => (
                    <Col span={12} key={`image-${media.id}`}>
                      <Image
                        src={media.mediaUrl}
                        alt={`Hình Ảnh Koi ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "contain",
                          borderRadius: "4px",
                        }}
                      />
                    </Col>
                  ))}
              </Row>
            </>
          )}

          {currentKoi?.koiMedia?.filter((media) => media.mediaType === "Video")
            .length > 0 && (
            <>
              <Typography.Title level={5}>Video</Typography.Title>
              <Row gutter={[16, 16]}>
                {currentKoi?.koiMedia
                  ?.filter((media) => media.mediaType === "Video")
                  .map((media, index) => (
                    <Col span={12} key={`video-${media.id}`}>
                      <video
                        controls
                        src={media.mediaUrl}
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "contain",
                          background: "#f0f0f0",
                          borderRadius: "4px",
                        }}
                      />
                    </Col>
                  ))}
              </Row>
            </>
          )}
        </Modal>
        <Modal
          title="Từ Chối Đăng Ký"
          open={isRejectModalVisible}
          onCancel={() => setIsRejectModalVisible(false)}
          onOk={handleRejectConfirm}
          okText="Xác nhận"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <div>
            <Typography.Text>
              Vui lòng nhập lý do từ chối đăng ký:
            </Typography.Text>
            <Input.TextArea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              style={{ marginTop: 16 }}
            />
          </div>
        </Modal>
        <Modal
          title="Hoàn Tiền Đăng Ký"
          open={isRefundModalVisible}
          onCancel={() => {
            setIsRefundModalVisible(false);
            setRefundType(null);
          }}
          onOk={handleRefund}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <div style={{ marginBottom: 16 }}>
            <Typography.Text>Chọn lý do hoàn tiền:</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Chọn lý do hoàn tiền"
              value={refundType}
              onChange={(value) => setRefundType(value)}
              options={REFUND_TYPE_OPTIONS}
            />
          </div>
        </Modal>
      </Card>
    </ConfigProvider>
  );
}

export default Registration;
