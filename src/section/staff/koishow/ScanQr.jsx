import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import useRegistrationPayment from "../../../hooks/useRegistrationPayment";
import useRegistration from "../../../hooks/useRegistration";
import {
  Card,
  Button,
  Typography,
  Spin,
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  Space,
  message,
  notification,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

function ScanQr() {
  const [qrResult, setQrResult] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const {
    registrationPayment,
    loading,
    error,
    fetchRegistrationPayment,
    reset,
  } = useRegistrationPayment();
  const { updateStatus } = useRegistration();

  console.log(registrationPayment);
  const handleScan = async (data) => {
    if (data && data.text) {
      setQrResult(data.text);
      setScannerEnabled(false);
      try {
        // Giả sử QR code chứa registration ID
        await fetchRegistrationPayment(data.text);
      } catch (error) {
        console.error("Error fetching registration data:", error);
      }
    }
  };

  const handleError = (err) => {
    console.error("QR Scanner error:", err);
  };

  const handleReset = () => {
    setQrResult(null);
    setScannerEnabled(true);
    setShowScanner(false);
    reset();
  };

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const registrationId = registrationPayment.data.registration.id;
      await updateStatus(registrationId, "checkin");

      // Reset state to go back to scanning mode
      handleReset();
    } catch (error) {
      // Xử lý lỗi 404 - vé đã được check-in
      if (error.response && error.response.status === 404) {
        notification.info({
          message: "Vé đã được check-in",
          description:
            "Vé này đã được check-in trước đó và không thể sử dụng lại.",
          duration: 4,
        });
      } else {
        notification.error({
          message: "Lỗi",
          description: `Lỗi khi check-in: ${error.message || "Lỗi không xác định"}`,
          duration: 4,
        });
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const registrationId = registrationPayment.data.registration.id;
      await updateStatus(registrationId, "rejected");

      // Reset state to go back to scanning mode
      handleReset();
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: `Lỗi khi từ chối: ${error.message}`,
        duration: 4,
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className=" max-w-6xl mx-auto">
      <Title level={3} className="mb-6 text-center">
        <span className="">Quét QR để Check-in</span>
      </Title>

      {!showScanner && !qrResult && (
        <div className="flex justify-center mb-6">
          <Button type="primary" onClick={() => setShowScanner(true)}>
            Bắt đầu quét QR
          </Button>
        </div>
      )}

      {showScanner && scannerEnabled && (
        <div className="mb-6 shadow-md" style={{ borderRadius: "12px" }}>
          <div className="scanner-container flex flex-col items-center">
            <div className="border-3 p-2 rounded-lg mb-4">
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                constraints={{
                  video: { facingMode: "environment" },
                }}
                style={{}}
              />
            </div>
            <Text className="text-center text-gray-600 italic mb-2">
              Hướng camera vào mã QR để quét
            </Text>
            <Button
              onClick={() => setShowScanner(false)}
              className="mb-4"
              danger
            >
              Hủy quét
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center my-8">
          <div className="text-center">
            <Spin size="large" tip="Đang tải thông tin..." />
          </div>
        </div>
      )}

      {error && (
        <Alert
          message="Mã QR này đã được check-in rồi!"
          description="Vui lòng quét mã QR khác"
          type="error"
          className="mb-6"
          showIcon
          action={
            <Button type="primary" size="middle" onClick={handleReset}>
              Quét lại
            </Button>
          }
        />
      )}

      {registrationPayment && registrationPayment.data && (
        <Card
          className="shadow-lg"
          variant="borderless"
          style={{ borderRadius: "12px" }}
        >
          <Title level={4} className="mb-6 pb-2 border-b border-gray-200">
            <span className="">Thông tin đăng ký</span>
          </Title>

          <Row gutter={[32, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" className="w-full" size="middle">
                <Card className="bg-gray-50 border-0">
                  <Text strong className="text-lg block mb-4">
                    Người đăng ký:{" "}
                    <span className="text-blue-600">
                      {registrationPayment.data.registration.registerName}
                    </span>
                  </Text>

                  <div className="mb-3 flex items-center">
                    <Text strong className="mr-2">
                      Trạng thái thanh toán:
                    </Text>
                    <Tag
                      color={
                        registrationPayment.data.status === "paid"
                          ? "success"
                          : "error"
                      }
                      icon={
                        registrationPayment.data.status === "paid" ? (
                          <CheckCircleOutlined />
                        ) : (
                          <CloseCircleOutlined />
                        )
                      }
                      className="px-3 py-1"
                    >
                      {registrationPayment.data.status === "paid"
                        ? "Đã thanh toán"
                        : "Chưa thanh toán"}
                    </Tag>
                  </div>

                  {/* <div className="mb-3 flex items-center">
                    <Text strong className="mr-2">Trạng thái đăng ký:</Text>
                    <Tag
                      color={
                        registrationPayment.data.registration.status === "confirmed"
                          ? "blue"
                          : registrationPayment.data.registration.status ===
                              "checkin"
                            ? "green"
                            : registrationPayment.data.registration.status ===
                                "rejected"
                              ? "red"
                              : "default"
                      }
                      className="px-3 py-1"
                    >
                      {registrationPayment.data.registration.status}
                    </Tag>
                  </div> */}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <Text type="secondary">Số tiền:</Text>
                      <div className="font-semibold">
                        {registrationPayment.data.paidAmount.toLocaleString()}{" "}
                        VND
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Phương thức:</Text>
                      <div className="font-semibold">
                        {registrationPayment.data.paymentMethod}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Text type="secondary">Ngày thanh toán:</Text>
                      <div className="font-semibold">
                        {new Date(
                          registrationPayment.data.paymentDate
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gray-50 border-0">
                  <Title level={5} className="mb-4 text-blue-600">
                    Thông tin Koi
                  </Title>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Text type="secondary">Tên:</Text>
                      <div className="font-semibold">
                        {registrationPayment.data.registration.koiProfile.name}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Giống:</Text>
                      <div className="font-semibold">
                        {
                          registrationPayment.data.registration.koiProfile
                            .variety.name
                        }
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Kích thước:</Text>
                      <div className="font-semibold">
                        {registrationPayment.data.registration.koiSize} cm
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Tuổi:</Text>
                      <div className="font-semibold">
                        {registrationPayment.data.registration.koiAge} năm
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Text type="secondary">Dòng máu:</Text>
                      <div className="font-semibold">
                        {
                          registrationPayment.data.registration.koiProfile
                            .bloodline
                        }
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gray-50 border-0">
                  <div className="mb-3">
                    <Text type="secondary">Danh mục thi đấu:</Text>
                    <div className="font-semibold">
                      {
                        registrationPayment.data.registration
                          .competitionCategory.name
                      }
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Sự kiện:</Text>
                    <div className="font-semibold">
                      {
                        registrationPayment.data.registration
                          .competitionCategory.koiShow.name
                      }
                    </div>
                  </div>
                </Card>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              {registrationPayment.data.registration.koiMedia &&
                registrationPayment.data.registration.koiMedia.length > 0 && (
                  <Card
                    className="bg-gray-50 border-0 h-full"
                    title={
                      <Title level={5} className="mb-0 text-blue-600">
                        Hình ảnh & Video
                      </Title>
                    }
                  >
                    <div
                      className="overflow-y-auto"
                      style={{ maxHeight: "600px" }}
                    >
                      {registrationPayment.data.registration.koiMedia.map(
                        (media, index) =>
                          media.mediaType === "Image" ? (
                            <div key={index} className="mb-4">
                              <img
                                src={media.mediaUrl}
                                alt="Koi Image"
                                className="w-full rounded-md shadow-md hover:shadow-lg transition-shadow"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          ) : media.mediaType === "Video" ? (
                            <div key={index} className="mb-4">
                              <video
                                width="100%"
                                controls
                                className="rounded-md shadow-md"
                              >
                                <source src={media.mediaUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          ) : null
                      )}
                    </div>
                  </Card>
                )}
            </Col>
          </Row>

          <div className="flex justify-center gap-6 mt-8">
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleCheckIn}
              loading={isCheckingIn}
              disabled={
                isCheckingIn ||
                registrationPayment.data.registration.status === "checkin"
              }
              style={{
                backgroundColor: "#52c41a",
                color: "white",
                borderColor: "#52c41a",
                height: "52px",
                padding: "0 24px",
                borderRadius: "8px",
                fontWeight: "bold",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {isCheckingIn ? "Đang xử lý..." : "Check-in"}
            </Button>
            <Button
              danger
              size="large"
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              loading={isRejecting}
              disabled={
                isRejecting ||
                registrationPayment.data.registration.status === "rejected"
              }
              style={{
                height: "52px",
                padding: "0 24px",
                borderRadius: "8px",
                fontWeight: "bold",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {isRejecting ? "Đang xử lý..." : "Từ chối"}
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReset}
              style={{
                height: "52px",
                padding: "0 24px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              Quét lại
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ScanQr;
