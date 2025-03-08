import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Image, Col, Row, Card, Space, Tag } from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import useRegistration from "../../../../hooks/useRegistration";

function KoiList({ showId }) {
  const {
    registration,
    isLoading,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    fetchRegistration,
  } = useRegistration();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentKoi, setCurrentKoi] = useState(null);

  // Gọi API khi component được mount
  useEffect(() => {
    fetchRegistration(1, 10, showId);
  }, []);

  // Xử lý khi thay đổi trang
  const handleTableChange = (pagination) => {
    fetchRegistration(pagination.current, pagination.pageSize);
  };

  const handleViewDetails = (record) => {
    setCurrentKoi(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentKoi(null);
  };

  const handleApproveReject = (status) => {
    // Xử lý logic phê duyệt/từ chối ở đây
    console.log(`Changing status to ${status} for koi:`, currentKoi.id);
    setIsModalVisible(false);
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
      title: "Name",
      dataIndex: "registerName",
      key: "registerName",
    },
    {
      title: "Koi Name",
      key: "koiName",
      render: (_, record) => record.koiProfile?.name || "N/A",
    },
    {
      title: "Category",
      dataIndex: "competitionCategory",
      key: "category",
      render: (category) => category?.name || "N/A",
    },
    {
      title: "Image",
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
            No image
          </div>
        );
      },
    },
    {
      title: "Status",
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
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{ color: "#4B5563" }}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            style={{ color: "#EF4444" }}
            // Thêm xử lý xóa nếu cần
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Table
        columns={columns}
        dataSource={registration}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        rowKey="id"
      />

      <Modal
        title="Registration Details"
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
                  title="Registration Information"
                  bordered={false}
                  className="w-full"
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <p>
                        <strong>Register Name:</strong>{" "}
                        {currentKoi.registerName}
                      </p>
                      <p>
                        <strong>Koi Name:</strong> {currentKoi.koiProfile.name}
                      </p>
                      <p>
                        <strong>Koi Size:</strong> {currentKoi.koiSize} cm
                      </p>
                      <p>
                        <strong>Koi Age:</strong> {currentKoi.koiAge}
                      </p>
                    </Col>
                    <Col span={12}>
                      <p>
                        <strong>Category:</strong>{" "}
                        {currentKoi.competitionCategory?.name}
                      </p>
                      {currentKoi.koiShow && (
                        <p>
                          <strong>Show Name:</strong> {currentKoi.koiShow.name}
                        </p>
                      )}
                      <p>
                        <strong>Registration Fee:</strong>{" "}
                        {currentKoi.registrationFee?.toLocaleString() || 0} VND
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
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
                  <Card title="Koi Media" variant={false} className="w-full">
                    <Row gutter={[16, 16]}>
                      {currentKoi.koiMedia.map((media, index) => (
                        <Col span={12} key={media.id}>
                          {media.mediaType === "Image" ? (
                            <div>
                              <p>
                                <strong>Image:</strong>
                              </p>
                              <Image
                                src={media.mediaUrl}
                                alt="Koi Image"
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
            {/* <div className="mt-4 text-center space-x-3">
              <Button
                type="primary"
                onClick={() => handleApproveReject("confirmed")}
                className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white font-bold w-36"
                disabled={currentKoi.status === "confirmed"}
              >
                Approve
              </Button>

              <Button
                type="primary"
                danger
                onClick={() => handleApproveReject("rejected")}
                className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white font-bold w-36"
                disabled={currentKoi.status === "rejected"}
              >
                Reject
              </Button>
            </div> */}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default KoiList;
