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

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

function Registration({ showId, statusShow, cancelledCategoryIds = [] }) {
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
    { value: "ShowCancelled", label: "Triển lãm bị hủy" },
    { value: "CategoryCancelled", label: "Hạng mục bị hủy" },
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
  const [mediaType, setMediaType] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionId, setRejectionId] = useState(null);
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [refundType, setRefundType] = useState(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);
  const [totalCheckinRegistrations, setTotalCheckinRegistrations] = useState(0);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  // Add new state variables for batch refund functionality
  const [isBatchRefundModalVisible, setIsBatchRefundModalVisible] =
    useState(false);
  const [batchRefundType, setBatchRefundType] = useState(null);
  const [batchRefundInProgress, setBatchRefundInProgress] = useState(false);
  const [registrationsToRefund, setRegistrationsToRefund] = useState([]);

  // Kiểm tra xem hạng mục hiện tại có bị hủy không
  const isCategorySelected = selectedCategory !== null;
  const isCategoryCancelled =
    isCategorySelected && cancelledCategoryIds.includes(selectedCategory);

  // Cập nhật lại useEffect khi chọn hạng mục
  useEffect(() => {
    if (selectedCategory) {
      // Kiểm tra nếu hạng mục đã bị hủy
      if (cancelledCategoryIds.includes(selectedCategory)) {
        // Chỉ hiển thị thông báo nếu đáp ứng điều kiện hiển thị nút "Đã hoàn tiền"

        // Logic 1: Show đã bị hủy
        const showCancelled = statusShow?.toLowerCase() === "cancelled";

        // Logic 2: Show public và hạng mục bị hủy
        const showPublicAndCategoryCancelled =
          statusShow?.toLowerCase() === "public" &&
          cancelledCategoryIds.includes(selectedCategory);

        // Logic 3: Show inprogress/finished và hạng mục bị hủy
        const showInProgressAndCategoryCancelled =
          ["inprogress", "finished"].includes(statusShow?.toLowerCase()) &&
          cancelledCategoryIds.includes(selectedCategory);

        // Hiển thị thông báo nếu nằm trong một trong các trường hợp trên
        if (
          showCancelled ||
          showPublicAndCategoryCancelled ||
          showInProgressAndCategoryCancelled
        ) {
          // Hiển thị thông báo
          notification.info({
            message: "Hạng mục đã bị hủy",
            description:
              "Hạng mục này đã bị hủy. Bạn có thể hoàn tiền cho các đơn đăng ký.",
            placement: "topRight",
            duration: 5,
          });
        }
      }
    }
  }, [selectedCategory, cancelledCategoryIds, statusShow]);

  useEffect(() => {
    fetchCategories(showId);
    fetchRegistration(1, 10, showId);
  }, []);

  useEffect(() => {}, [categories]);

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

    fetchRegistration(1, 10, showId, value ? [value] : undefined, null).then(
      () => {
        // After fetching registrations, check if category is canceled and handle refund
        if (value && statusShow === "cancelled") {
          checkCategoryCanceledAndRefund(value);
        }
      }
    );
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

        // Đảm bảo RoundSelector đang sử dụng đúng category
        if (roundSelectorRef.current) {
          roundSelectorRef.current.updateCategory(selectedCategory);
        }

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

  const handleCategoryChangeInModal = (categoryId) => {
    setSelectedCategory(categoryId);

    // Hiển thị loading khi chọn hạng mục
    notification.info({
      message: "Đang lấy dữ liệu",
      description: "Đang lấy tất cả đăng ký đã check-in, vui lòng đợi...",
      placement: "topRight",
      duration: 2,
    });

    // Gọi API để lấy tất cả đăng ký có trạng thái checkin trong hạng mục đã chọn
    fetchRegistration(
      1,
      1000, // Số lượng lớn để lấy tất cả đăng ký
      showId,
      [categoryId],
      ["checkin"] // Chỉ lấy các đăng ký đã check-in
    ).then((response) => {
      if (response && response.registration) {
        const checkedInFish = response.registration.filter(
          (reg) =>
            reg.status?.toLowerCase() === "checkin" &&
            reg.competitionCategory?.id === categoryId
        );

        if (checkedInFish.length === 0) {
          notification.warning({
            message: "Không có đăng ký",
            description: "Không có đăng ký nào đã check-in để gán vòng",
            placement: "topRight",
          });
          setCheckinRegistrations([]);
          setTotalCheckinRegistrations(0);
        } else {
          setCheckinRegistrations(checkedInFish);
          setTotalCheckinRegistrations(checkedInFish.length);

          notification.success({
            message: "Đã lấy dữ liệu",
            description: `Đã tìm thấy ${checkedInFish.length} đăng ký đã check-in`,
            placement: "topRight",
          });
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: "Không thể lấy dữ liệu đăng ký",
          placement: "topRight",
        });
      }
    });

    // Cập nhật category trong RoundSelector thay vì chỉ reset
    if (roundSelectorRef.current) {
      roundSelectorRef.current.updateCategory(categoryId);
    }
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

    // Kiểm tra xem các registration có cùng hạng mục với round hiện tại không
    const selectedRegs = checkinRegistrations.filter((reg) =>
      selectedRegistrations.includes(reg.id)
    );

    // Nếu có registration thuộc hạng mục khác với hạng mục đang chọn, hiển thị cảnh báo
    const invalidRegs = selectedRegs.filter(
      (reg) => reg.competitionCategory?.id !== selectedCategory
    );

    if (invalidRegs.length > 0) {
      notification.error({
        message: "Lỗi hạng mục không khớp",
        description: `Có ${invalidRegs.length} đăng ký thuộc hạng mục khác với hạng mục đang chọn. Vui lòng kiểm tra lại.`,
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
                  <Spin size="small" />
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: renderStatus,
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(dateString));
  };

  const openMediaModal = (type) => {
    setMediaType(type);
    setMediaModalVisible(true);
  };

  // Add function to check if category has been canceled and handle batch refund
  const checkCategoryCanceledAndRefund = (categoryId) => {
    if (!categoryId || statusShow !== "cancelled") return;

    // Previous show statuses that qualify for auto refund when canceled
    const qualifyingPreviousStatuses = [
      "inprogress",
      "public",
      "internalpublic",
      "pending",
    ];

    // Tìm tất cả đăng ký có trạng thái pending, confirmed, rejected thuộc hạng mục đã chọn
    const eligibleRegistrations = registration.filter(
      (reg) =>
        reg.competitionCategory?.id === categoryId &&
        ["pending", "confirmed", "rejected"].includes(reg.status?.toLowerCase())
    );

    if (eligibleRegistrations.length > 0) {
      // Get IDs of eligible registrations
      const eligibleIds = eligibleRegistrations.map((reg) => reg.id);
      setRegistrationsToRefund(eligibleIds);

      // Hiển thị modal chọn lý do hoàn tiền
      setIsBatchRefundModalVisible(true);
      setBatchRefundType(null);

      notification.info({
        message: "Cần hoàn tiền",
        description: `Tìm thấy ${eligibleIds.length} đăng ký cần hoàn tiền. Vui lòng chọn lý do hoàn tiền.`,
        placement: "topRight",
        duration: 3,
      });
    } else {
      notification.info({
        message: "Không có đăng ký cần hoàn tiền",
        description:
          "Tất cả các đăng ký trong hạng mục này đã được xử lý hoặc không cần hoàn tiền",
        placement: "topRight",
      });
    }
  };

  // Add a function to handle batch refund for canceled category
  const handleBatchRefund = async () => {
    if (!batchRefundType) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn lý do hoàn tiền",
        placement: "topRight",
      });
      return;
    }

    try {
      setBatchRefundInProgress(true);

      // Show loading notification
      notification.info({
        message: "Đang xử lý",
        description: `Đang hoàn tiền cho ${registrationsToRefund.length} đăng ký...`,
        placement: "topRight",
        duration: 3,
      });

      let successCount = 0;
      let failCount = 0;

      // Process each registration one by one
      for (const regId of registrationsToRefund) {
        try {
          const result = await updateStatus(
            regId,
            "Refunded",
            null,
            batchRefundType
          );
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error("Error refunding registration:", error);
          failCount++;
        }
      }

      setBatchRefundInProgress(false);
      setIsBatchRefundModalVisible(false);
      setBatchRefundType(null);

      // Refresh the registration list
      fetchRegistration(
        currentPage,
        pageSize,
        showId,
        selectedCategory ? [selectedCategory] : undefined,
        selectedStatus
      );

      // Show completion notification
      notification.success({
        message: "Hoàn thành",
        description: `Đã hoàn tiền thành công cho ${successCount} đăng ký${failCount > 0 ? `, ${failCount} đăng ký thất bại` : ""}`,
        placement: "topRight",
      });
    } catch (error) {
      console.error("Batch refund error:", error);
      setBatchRefundInProgress(false);

      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi thực hiện hoàn tiền hàng loạt",
        placement: "topRight",
      });
    }
  };

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
        <div className="flex flex-wrap gap-4 mb-6">
          <Select
            style={{ width: "100%", maxWidth: 300 }}
            placeholder="Chọn hạng mục"
            onChange={handleCategoryChange}
            allowClear
            value={selectedCategory}
          >
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))
            ) : (
              <Select.Option disabled>Không có dữ liệu</Select.Option>
            )}
          </Select>

          <Select
            mode="multiple"
            value={selectedStatus}
            onChange={(values) => {
              // Check if "all" is selected
              if (values.includes("all")) {
                setSelectedStatus(null);
                setActiveFilters([]);
                fetchRegistration(
                  1,
                  pageSize,
                  showId,
                  selectedCategory ? [selectedCategory] : undefined,
                  null
                );
              } else {
                // Filter out "all" if it was previously selected
                const filteredValues = values.filter((v) => v !== "all");
                setSelectedStatus(filteredValues);

                if (filteredValues && filteredValues.length > 0) {
                  const statusLabels = filteredValues.map(
                    (status) => STATUS_CONFIG[status]?.label || status
                  );
                  setActiveFilters(statusLabels);
                  fetchRegistration(
                    1,
                    pageSize,
                    showId,
                    selectedCategory ? [selectedCategory] : undefined,
                    filteredValues
                  );
                } else {
                  // If no status is selected, show all
                  setActiveFilters([]);
                  fetchRegistration(
                    1,
                    pageSize,
                    showId,
                    selectedCategory ? [selectedCategory] : undefined,
                    null
                  );
                }
              }
            }}
            style={{ width: "100%", maxWidth: 300 }}
            placeholder="Chọn trạng thái"
            allowClear
            maxTagCount="responsive"
            tagRender={(props) => {
              const { label, value, closable, onClose } = props;
              const color = STATUS_CONFIG[value]?.color || "default";
              return (
                <Tag
                  color={color}
                  closable={closable}
                  onClose={onClose}
                  style={{ marginRight: 3 }}
                >
                  {label}
                </Tag>
              );
            }}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <Select.Option key={key} value={key}>
                {config.label}
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
              className="ml-auto"
            >
              Gán vòng
            </Button>
          )}
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
                  total: totalItems,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} trong ${total}`,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  responsive: true,
                }
              : false
          }
          onChange={handleTableChange}
          rowKey="id"
          size="middle"
          variant="borderless"
          scroll={{ x: "100%" }}
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
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#262626",
                borderLeft: "4px solid #1890ff",
                paddingLeft: "12px",
              }}
            >
              Chi Tiết Đăng Ký
            </div>
          }
          open={isModalVisible}
          onCancel={handleCancel}
          footer={
            <>
              <Button key="cancel" onClick={handleCancel}>
                Đóng
              </Button>
              {currentKoi && (
                <>
                  {console.log("Debug Refund Button:", {
                    koiStatus: currentKoi.status?.toLowerCase(),
                    showStatus: statusShow?.toLowerCase(),
                    isCategoryCancelled,
                    categoryMatch:
                      currentKoi.competitionCategory?.id === selectedCategory,
                  })}

                  {/* Hiển thị nút Đã hoàn tiền khi cần */}
                  {currentKoi.status?.toLowerCase() !== "refunded" && (
                    <>
                      {/* Logic mới: Luôn hiển thị nút hoàn tiền cho đơn bị từ chối */}
                      {currentKoi.status?.toLowerCase() === "rejected" && (
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

                      {/* Logic 1: Show bị hủy - hiện nút cho đơn pending/confirmed */}
                      {statusShow?.toLowerCase() === "cancelled" &&
                        ["pending", "confirmed", "rejected"].includes(
                          currentKoi.status?.toLowerCase()
                        ) && (
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

                      {/* Logic 2: Hạng mục bị hủy + status public - hiện nút cho đơn pending/confirmed */}
                      {statusShow?.toLowerCase() === "public" &&
                        isCategoryCancelled &&
                        currentKoi.competitionCategory?.id ===
                          selectedCategory &&
                        ["pending", "confirmed", "rejected"].includes(
                          currentKoi.status?.toLowerCase()
                        ) && (
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

                      {/* Logic 3: Hạng mục bị hủy + status inprogress/finished - chỉ hiện nút cho đơn checkin */}
                      {["inprogress", "finished"].includes(
                        statusShow?.toLowerCase()
                      ) &&
                        isCategoryCancelled &&
                        currentKoi.competitionCategory?.id ===
                          selectedCategory &&
                        ["checkin", "rejected"].includes(
                          currentKoi.status?.toLowerCase()
                        ) && (
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
                  )}
                </>
              )}
            </>
          }
          width={"90%"}
          style={{ maxWidth: 900 }}
        >
          {currentKoi && (
            <div className="p-4">
              <Card
                title={
                  <Flex align="center" justify="space-between">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          background: "#096dd9",
                          marginRight: "8px",
                        }}
                      ></div>
                      <span>Thông tin cá Koi</span>
                    </div>
                    <div>{renderStatus(currentKoi.status)}</div>
                  </Flex>
                }
                variant="borderless"
                style={{
                  marginBottom: 16,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                  background: "linear-gradient(to right, #f9f9f9, #ffffff)",
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Tên Cá Koi:</strong>
                      <span style={{ marginLeft: "8px", fontWeight: 500 }}>
                        {currentKoi.koiProfile?.name}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Giống:</strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi?.koiProfile?.variety?.name}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>
                        Kích Thước Cá:
                      </strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi.koiSize} cm
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Tuổi Cá:</strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi.koiAge}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Ghi chú:</strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi.notes || "Không có ghi chú"}
                      </span>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Hạng Mục:</strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi.competitionCategory?.name}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Chủ sở hữu:</strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi.registerName}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Email:</strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi.account?.email || "-"}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>
                        Số điện thoại:
                      </strong>
                      <span style={{ marginLeft: "8px" }}>
                        {currentKoi.account?.phone || "-"}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px dashed #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#096dd9" }}>Phí Đăng Ký:</strong>
                      <span
                        style={{
                          marginLeft: "8px",
                          fontWeight: 500,
                          color: "#d4380d",
                        }}
                      >
                        {currentKoi.registrationFee?.toLocaleString() || 0} VND
                      </span>
                    </div>
                    {currentKoi.createdAt && (
                      <div
                        style={{
                          padding: "8px 0",
                          borderBottom: "1px dashed #f0f0f0",
                          marginBottom: "8px",
                        }}
                      >
                        <strong style={{ color: "#096dd9" }}>Ngày Tạo:</strong>
                        <span style={{ marginLeft: "8px" }}>
                          {currentKoi.createdAt
                            ? (() => {
                                const d = new Date(currentKoi.createdAt);
                                const day = String(d.getDate()).padStart(
                                  2,
                                  "0"
                                );
                                const month = String(d.getMonth() + 1).padStart(
                                  2,
                                  "0"
                                );
                                const year = d.getFullYear();
                                const hour = String(d.getHours()).padStart(
                                  2,
                                  "0"
                                );
                                const minute = String(d.getMinutes()).padStart(
                                  2,
                                  "0"
                                );
                                const second = String(d.getSeconds()).padStart(
                                  2,
                                  "0"
                                );
                                return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
                              })()
                            : "-"}
                        </span>
                      </div>
                    )}

                    {currentKoi.status === "rejected" &&
                      currentKoi.rejectedReason && (
                        <div
                          style={{
                            marginBottom: "8px",
                            background: "#fff2f0",
                            border: "1px solid #ffccc7",
                            borderRadius: "4px",
                            padding: "8px 12px",
                          }}
                        >
                          <strong style={{ color: "#cf1322" }}>
                            Lý do từ chối:
                          </strong>
                          <div style={{ marginTop: "4px" }}>
                            {currentKoi.rejectedReason}
                          </div>
                        </div>
                      )}
                  </Col>
                </Row>
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            background: "#1890ff",
                            marginRight: "8px",
                          }}
                        ></div>
                        <span>Hình Ảnh</span>
                      </div>
                    }
                    variant="borderless"
                    style={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    {currentKoi.koiMedia?.find(
                      (media) => media.mediaType === "Image"
                    ) ? (
                      <div className="relative">
                        <div
                          className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-[300px]"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <Image
                            src={
                              currentKoi.koiMedia.find(
                                (media) => media.mediaType === "Image"
                              )?.mediaUrl
                            }
                            alt="Hình Ảnh Koi"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              margin: "0 auto",
                              display: "block",
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
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <EyeOutlined style={{ fontSize: "22px" }} />
                                  <span
                                    style={{
                                      marginTop: "4px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Xem
                                  </span>
                                </div>
                              ),
                              icons: false,
                            }}
                          />
                        </div>
                        {currentKoi.koiMedia.filter(
                          (media) => media.mediaType === "Image"
                        ).length > 1 && (
                          <div
                            onClick={() => {
                              setMediaType("image");
                              setMediaModalVisible(true);
                            }}
                            className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-all"
                            style={{
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                          >
                            <span className="text-white font-semibold text-xl bg-black bg-opacity-40 px-4 py-2 rounded-full">
                              +
                              {currentKoi.koiMedia.filter(
                                (media) => media.mediaType === "Image"
                              ).length - 1}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "300px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          background: "#f0f0f0",
                          borderRadius: "8px",
                          color: "#8c8c8c",
                          fontSize: "16px",
                          fontStyle: "italic",
                        }}
                      >
                        Không có hình ảnh
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            background: "#722ed1",
                            marginRight: "8px",
                          }}
                        ></div>
                        <span>Video</span>
                      </div>
                    }
                    variant="borderless"
                    style={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    {currentKoi.koiMedia?.find(
                      (media) => media.mediaType === "Video"
                    ) ? (
                      <div className="relative">
                        <div
                          className="bg-gray-900 rounded-lg overflow-hidden h-[300px] flex items-center justify-center"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #1f1f1f",
                          }}
                        >
                          <video
                            controls
                            src={
                              currentKoi.koiMedia.find(
                                (media) => media.mediaType === "Video"
                              )?.mediaUrl
                            }
                            style={{
                              width: "100%",
                              height: "auto",
                              maxHeight: "100%",
                              borderRadius: "8px",
                            }}
                          />
                        </div>
                        {currentKoi.koiMedia.filter(
                          (media) => media.mediaType === "Video"
                        ).length > 1 && (
                          <div
                            onClick={() => {
                              setMediaType("video");
                              setMediaModalVisible(true);
                            }}
                            className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-all"
                            style={{
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                          >
                            <span className="text-white font-semibold text-xl bg-black bg-opacity-40 px-4 py-2 rounded-full">
                              +
                              {currentKoi.koiMedia.filter(
                                (media) => media.mediaType === "Video"
                              ).length - 1}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "300px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          background: "#0f0f0f",
                          color: "#d9d9d9",
                          borderRadius: "8px",
                          fontSize: "16px",
                          fontStyle: "italic",
                        }}
                      >
                        Không có video
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              {currentKoi.status === "pending" && (
                <div
                  className="mt-6 text-center space-x-4"
                  style={{ marginTop: "16px" }}
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => showConfirmModal(currentKoi.id, "confirmed")}
                    style={{
                      backgroundColor: "#52c41a",
                      color: "white",
                      borderColor: "#52c41a",
                      height: "40px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      boxShadow: "0 2px 0 rgba(0, 0, 0, 0.045)",
                      padding: "0 20px",
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
                      height: "40px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      boxShadow: "0 2px 0 rgba(0, 0, 0, 0.045)",
                      padding: "0 20px",
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
          title={
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#262626",
                borderLeft:
                  mediaType === "video"
                    ? "4px solid #722ed1"
                    : "4px solid #1890ff",
                paddingLeft: "12px",
              }}
            >
              {mediaType === "image"
                ? "Tất cả hình ảnh"
                : mediaType === "video"
                  ? "Tất cả video"
                  : "Tất cả hình ảnh và video"}
            </div>
          }
          open={mediaModalVisible}
          onCancel={() => setMediaModalVisible(false)}
          footer={null}
          width={"90%"}
          style={{ maxWidth: 900 }}
        >
          {mediaType !== "video" &&
            currentKoi?.koiMedia?.filter((media) => media.mediaType === "Image")
              .length > 0 && (
              <>
                <Typography.Title
                  level={5}
                  style={{
                    marginBottom: "16px",
                    position: "relative",
                    paddingLeft: "16px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#1890ff",
                    }}
                  ></div>
                  Hình Ảnh
                </Typography.Title>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  {currentKoi?.koiMedia
                    ?.filter((media) => media.mediaType === "Image")
                    .map((media, index) => (
                      <Col xs={24} sm={12} key={`image-${media.id}`}>
                        <Card
                          variant="borderless"
                          hoverable
                          style={{
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow:
                              "0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)",
                          }}
                        >
                          <div
                            className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-[300px]"
                            style={{
                              borderRadius: "4px",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <Image
                              src={media.mediaUrl}
                              alt={`Hình Ảnh Koi ${index + 1}`}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                margin: "0 auto",
                                display: "block",
                              }}
                            />
                          </div>
                        </Card>
                      </Col>
                    ))}
                </Row>
              </>
            )}

          {mediaType !== "image" &&
            currentKoi?.koiMedia?.filter((media) => media.mediaType === "Video")
              .length > 0 && (
              <>
                <Typography.Title
                  level={5}
                  style={{
                    marginBottom: "16px",
                    position: "relative",
                    paddingLeft: "16px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#722ed1",
                    }}
                  ></div>
                  Video
                </Typography.Title>
                <Row gutter={[16, 16]}>
                  {currentKoi?.koiMedia
                    ?.filter((media) => media.mediaType === "Video")
                    .map((media, index) => (
                      <Col xs={24} sm={12} key={`video-${media.id}`}>
                        <Card
                          variant="borderless"
                          hoverable
                          style={{
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow:
                              "0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)",
                          }}
                        >
                          <div
                            className="bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center h-[300px]"
                            style={{
                              borderRadius: "4px",
                              border: "1px solid #1f1f1f",
                            }}
                          >
                            <video
                              controls
                              src={media.mediaUrl}
                              style={{
                                width: "100%",
                                height: "auto",
                                maxHeight: "100%",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                        </Card>
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
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>
                Gán cá tham gia vào vòng{" "}
                {checkinRegistrations.length > 0
                  ? `- Tất cả ${checkinRegistrations.length} đăng ký đã check-in`
                  : ""}
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
            {!selectedCategory && (
              <Alert
                message="Vui lòng chọn hạng mục"
                description="Hãy chọn hạng mục để xem danh sách đăng ký đã check-in"
                type="info"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

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

          {selectedCategory && (
            <>
              {checkinRegistrations.length > 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message="Tất cả đăng ký đã check-in của hạng mục này đang được hiển thị"
                  description="Bạn có thể chọn và gán vòng cho tất cả đăng ký cùng một lúc"
                  style={{ marginBottom: "16px" }}
                />
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  message="Không có đăng ký"
                  description="Không có đăng ký nào đã check-in cho hạng mục này"
                  style={{ marginBottom: "16px" }}
                />
              )}
            </>
          )}

          {selectedCategory &&
            checkinRegistrations.length > 0 &&
            selectedRoundId && (
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
                          Đã chọn{" "}
                          <strong>{selectedRegistrations.length}</strong> /{" "}
                          <strong>{checkinRegistrations.length}</strong> đăng ký
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
                    variant="borderless"
                    scroll={{ y: 400 }}
                  />
                </div>
              </>
            )}
        </Modal>
        <Modal
          title="Hoàn Tiền Hàng Loạt"
          open={isBatchRefundModalVisible}
          onCancel={() => {
            setIsBatchRefundModalVisible(false);
            setBatchRefundType(null);
          }}
          onOk={handleBatchRefund}
          okText="Xác nhận"
          cancelText="Hủy"
          confirmLoading={batchRefundInProgress}
        >
          <div style={{ marginBottom: 16 }}>
            <Typography.Text>Chọn lý do hoàn tiền:</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Chọn lý do hoàn tiền"
              value={batchRefundType}
              onChange={(value) => setBatchRefundType(value)}
              options={REFUND_TYPE_OPTIONS}
            />
            {registrationsToRefund.length > 0 && (
              <Alert
                message={`Sẽ hoàn tiền cho ${registrationsToRefund.length} đăng ký`}
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        </Modal>
      </Card>
    </ConfigProvider>
  );
}

export default Registration;
