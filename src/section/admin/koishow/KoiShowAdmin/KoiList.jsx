import React, { useState, useEffect } from "react";
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
  Select,
  Empty,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import useRegistration from "../../../../hooks/useRegistration";
import useCategory from "../../../../hooks/useCategory";

function KoiList({ showId }) {
  const {
    registration,
    isLoading,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    updateStatus,
    fetchRegistration,
  } = useRegistration();

  const { categories, fetchCategories } = useCategory();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentKoi, setCurrentKoi] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const { confirm } = Modal;

  const statusOptions = [
    { value: "waittopaid", label: "Chờ thanh toán" },
    { value: "paid", label: "Đã thanh toán" },
    { value: "cancelled", label: "Đã hủy" },
    { value: "pending", label: "Đang chờ" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "checkin", label: "Đã check-in" },
    { value: "rejected", label: "Từ chối" },
  ];

  // Gọi API khi component được mount
  useEffect(() => {
    fetchCategories(showId);
  }, []);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);

    // Khi category thay đổi, reset status filter
    if (value === "all") {
      // Fetch tất cả đơn đăng ký không phân biệt hạng mục
      fetchRegistration(1, 10, showId, []);
    } else if (value) {
      // Fetch theo hạng mục đã chọn
      fetchRegistration(1, 10, showId, [value]);
    } else {
      // Clear data khi không có hạng mục nào được chọn
      fetchRegistration(1, 0, showId, []);
    }
  };

  // Handle status selection change
  const handleStatusChange = (value) => {
    setSelectedStatus(value);

    // Áp dụng cả hai bộ lọc
    if (selectedCategory) {
      // Cho phép hiển thị dữ liệu khi đã chọn hạng mục và trạng thái (hoặc "Tất cả")
      console.log("Filtering with status:", value);
    }
  };

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    if (selectedCategory) {
      fetchRegistration(pagination.current, pagination.pageSize, showId, [
        selectedCategory,
      ]);
    }
  };

  const getFilteredData = () => {
    if (!registration || registration.length === 0) return [];

    return registration.filter((item) => {
      // Kiểm tra trạng thái phù hợp (không phân biệt chữ hoa/thường)
      const statusMatches =
        !selectedStatus ||
        selectedStatus === "all" ||
        item.status?.toLowerCase() === selectedStatus.toLowerCase();

      return statusMatches;
    });
  };

  // Get the filtered data
  const filteredData = getFilteredData();

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
      sorter: (a, b) => a.registerName.localeCompare(b.registerName),
    },
    {
      title: "Tên Koi",
      key: "koiName",
      render: (_, record) => record.koiProfile?.name || "N/A",
      sorter: (a, b) => {
        const nameA = a.koiProfile?.name || "";
        const nameB = b.koiProfile?.name || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: "Hạng mục",
      dataIndex: "competitionCategory",
      key: "category",
      render: (category) => category?.name || "N/A",
      sorter: (a, b) => {
        const catA = a.competitionCategory?.name || "";
        const catB = b.competitionCategory?.name || "";
        return catA.localeCompare(catB);
      },
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
      sorter: (a, b) => {
        const statusA = a.status || "";
        const statusB = b.status || "";
        return statusA.localeCompare(statusB);
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
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="mb-4 flex gap-4">
        <Select
          style={{ width: "50%" }}
          placeholder="Chọn hạng mục"
          onChange={handleCategoryChange}
          allowClear
          value={selectedCategory}
        >
          <Select.Option key="all" value="all">
            Tất cả hạng mục
          </Select.Option>
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
          <Select.Option key="all" value="all">
            Tất cả trạng thái
          </Select.Option>
          {statusOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </div>
      {(selectedCategory && (selectedStatus || selectedStatus === "all")) ||
      (selectedCategory === "all" &&
        (selectedStatus || selectedStatus === "all")) ? (
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total}`,
          }}
          onChange={handleTableChange}
          rowKey="id"
        />
      ) : (
        <Empty description="Vui lòng chọn hạng mục và trạng thái để xem dữ liệu" />
      )}

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
                        <strong>Kích Thước Cá:</strong> {currentKoi.koiSize} cm
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
                        {currentKoi.registrationFee?.toLocaleString() || 0} VND
                      </p>
                      <p>
                        <strong>Trạng Thái:</strong>{" "}
                        {currentKoi.status && (
                          <Tag
                            color={
                              currentKoi.status.toLowerCase() === "waittopaid"
                                ? "blue"
                                : currentKoi.status.toLowerCase() === "paid"
                                  ? "cyan"
                                  : currentKoi.status.toLowerCase() ===
                                      "cancelled"
                                    ? "gray"
                                    : currentKoi.status.toLowerCase() ===
                                        "pending"
                                      ? "orange"
                                      : currentKoi.status.toLowerCase() ===
                                          "confirmed"
                                        ? "green"
                                        : currentKoi.status.toLowerCase() ===
                                            "checkin"
                                          ? "geekblue"
                                          : currentKoi.status.toLowerCase() ===
                                              "rejected"
                                            ? "red"
                                            : "default"
                            }
                            style={{ marginLeft: "8px" }}
                          >
                            {currentKoi.status.toLowerCase() === "waittopaid"
                              ? "Chờ thanh toán"
                              : currentKoi.status.toLowerCase() === "paid"
                                ? "Đã thanh toán"
                                : currentKoi.status.toLowerCase() ===
                                    "cancelled"
                                  ? "Đã hủy"
                                  : currentKoi.status.toLowerCase() ===
                                      "pending"
                                    ? "Đang chờ"
                                    : currentKoi.status.toLowerCase() ===
                                        "confirmed"
                                      ? "Đã xác nhận"
                                      : currentKoi.status.toLowerCase() ===
                                          "checkin"
                                        ? "Đã check-in"
                                        : currentKoi.status.toLowerCase() ===
                                            "rejected"
                                          ? "Từ chối"
                                          : currentKoi.status}
                          </Tag>
                        )}
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
                      {currentKoi.koiMedia.map((media, index) => (
                        <Col span={12} key={media.id}>
                          {media.mediaType === "Image" ? (
                            <div>
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
                            </div>
                          ) : media.mediaType === "Video" ? (
                            <div>
                              <p>
                                <strong>Video:</strong>
                              </p>
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
                  </Card>
                </Col>
              )}
            </Row>

            {/* Nút Approve/Reject */}
            <div className="mt-4 text-center space-x-3">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => showConfirmModal(currentKoi.id, "confirmed")}
                className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white font-bold w-36"
                disabled={
                  currentKoi.status === "confirmed" ||
                  updatedStatus === "confirmed" ||
                  updatedStatus === "rejected"
                }
              >
                Phê Duyệt
              </Button>

              <Button
                type="primary"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => showConfirmModal(currentKoi.id, "rejected")}
                className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white font-bold w-36"
                disabled={
                  currentKoi.status === "rejected" ||
                  updatedStatus === "confirmed" ||
                  updatedStatus === "rejected"
                }
              >
                Từ Chối
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default KoiList;
