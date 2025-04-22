import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import useRegistrationPayment from "../../hooks/useRegistrationPayment";
import useRegistration from "../../hooks/useRegistration";
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
  ScanOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Định nghĩa các props mặc định thay vì dựa vào defaultProps của QrScanner
const DEFAULT_DELAY = 300;
const DEFAULT_CONSTRAINTS = {
  video: {
    facingMode: "environment",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

function ScanQr() {
  const [qrResult, setQrResult] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [errorScan, setErrorScan] = useState(null);
  // Detect tablet size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Animation effect for scanning
  useEffect(() => {
    if (showScanner && scannerEnabled) {
      setScanning(true);
    } else {
      setScanning(false);
    }
  }, [showScanner, scannerEnabled]);

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
        console.error(
          "Error fetching registration data:",
          error?.response?.data?.Error
        );
        setErrorScan(error?.response?.data?.Error);
      }
    }
  };

  const handleError = (err) => {
    console.error("QR Scanner error:", err);
  };

  const handleReset = () => {
    setQrResult(null);
    setScannerEnabled(true);
    setShowScanner(true);
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
    <div className="max-w-6xl mx-auto">
      {!showScanner && !qrResult && (
        <div className="flex justify-center mb-6">
          <Button
            type="primary"
            onClick={() => setShowScanner(true)}
            size={isTablet ? "large" : "middle"}
            icon={<ScanOutlined />}
            className="tablet-scan-button"
            style={{
              height: isTablet ? "56px" : "40px",
              fontSize: isTablet ? "16px" : "14px",
              padding: isTablet ? "0 32px" : "0 20px",
              borderRadius: "8px",
            }}
          >
            Bắt đầu quét QR
          </Button>
        </div>
      )}

      {showScanner && scannerEnabled && (
        <div
          className={`mb-6 shadow-lg ${isTablet ? "tablet-scanner" : ""}`}
          style={{
            borderRadius: "16px",
            maxWidth: isTablet ? "800px" : "600px",
            margin: "0 auto",
            overflow: "hidden",
            backgroundColor: "#f8f8f8",
            border: "1px solid #e0e0e0",
          }}
        >
          <div className="scanner-header bg-blue-600 text-white py-3 px-4 flex items-center justify-center">
            <ScanOutlined className="mr-2" style={{ fontSize: "18px" }} />
            <Text
              strong
              style={{
                color: "white",
                fontSize: isTablet ? "18px" : "16px",
                margin: 0,
              }}
            >
              Quét mã QR
            </Text>
          </div>

          <div className="scanner-container flex flex-col items-center px-4 py-4">
            <div
              className="qr-scanner-wrapper mb-4 relative"
              style={{
                width: "100%",
                position: "relative",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div className="scanner-corners">
                <div className="scanner-corner-tl"></div>
                <div className="scanner-corner-tr"></div>
                <div className="scanner-corner-bl"></div>
                <div className="scanner-corner-br"></div>
              </div>

              {scanning && <div className="scanner-line"></div>}

              <QrScanner
                delay={DEFAULT_DELAY}
                onError={handleError}
                onScan={handleScan}
                constraints={DEFAULT_CONSTRAINTS}
                style={{
                  width: "100%",
                  height: isTablet ? "500px" : "350px",
                  objectFit: "cover",
                }}
              />
            </div>

            <Text
              className="text-center text-gray-600 italic mb-3"
              style={{
                fontSize: isTablet ? "16px" : "14px",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                padding: "8px 16px",
                borderRadius: "20px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
            >
              Hướng camera vào mã QR để quét
            </Text>

            <Button
              onClick={() => setShowScanner(false)}
              className="mb-3"
              danger
              size={isTablet ? "large" : "middle"}
              style={{
                height: isTablet ? "48px" : "36px",
                minWidth: isTablet ? "140px" : "100px",
                borderRadius: "8px",
              }}
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
          message={errorScan}
          description="Vui lòng quét mã QR khác"
          type="error"
          className="mb-6"
          showIcon
          action={
            <Button
              type="primary"
              size={isTablet ? "large" : "middle"}
              onClick={handleReset}
              style={{
                height: isTablet ? "48px" : "32px",
              }}
            >
              Quét lại
            </Button>
          }
        />
      )}

      {registrationPayment && registrationPayment.data && (
        <Card
          className={`shadow-lg ${isTablet ? "tablet-card" : ""}`}
          variant="borderless"
          style={{
            borderRadius: "12px",
            maxWidth: isTablet ? "900px" : "100%",
            margin: "0 auto",
          }}
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
              size={isTablet ? "large" : "middle"}
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
                height: isTablet ? "60px" : "52px",
                padding: isTablet ? "0 30px" : "0 24px",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: isTablet ? "16px" : "14px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {isCheckingIn ? "Đang xử lý..." : "Check-in"}
            </Button>
            <Button
              danger
              size={isTablet ? "large" : "middle"}
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              loading={isRejecting}
              disabled={
                isRejecting ||
                registrationPayment.data.registration.status === "rejected"
              }
              style={{
                height: isTablet ? "60px" : "52px",
                padding: isTablet ? "0 30px" : "0 24px",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: isTablet ? "16px" : "14px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {isRejecting ? "Đang xử lý..." : "Từ chối"}
            </Button>
            <Button
              size={isTablet ? "large" : "middle"}
              icon={<ReloadOutlined />}
              onClick={handleReset}
              style={{
                height: isTablet ? "60px" : "52px",
                padding: isTablet ? "0 30px" : "0 24px",
                borderRadius: "8px",
                fontSize: isTablet ? "16px" : "14px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              Quét lại
            </Button>
          </div>
        </Card>
      )}

      <style jsx="true">
        {`
          /* Tablet optimization styles */
          .tablet-scanner {
            width: 95% !important;
            max-width: 800px !important;
          }

          /* Scanner frame and corners */
          .scanner-corners {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
            pointer-events: none;
          }

          .scanner-corner-tl,
          .scanner-corner-tr,
          .scanner-corner-bl,
          .scanner-corner-br {
            position: absolute;
            width: 20px;
            height: 20px;
            z-index: 10;
          }

          .scanner-corner-tl {
            top: 10px;
            left: 10px;
            border-top: 3px solid #1890ff;
            border-left: 3px solid #1890ff;
          }

          .scanner-corner-tr {
            top: 10px;
            right: 10px;
            border-top: 3px solid #1890ff;
            border-right: 3px solid #1890ff;
          }

          .scanner-corner-bl {
            bottom: 10px;
            left: 10px;
            border-bottom: 3px solid #1890ff;
            border-left: 3px solid #1890ff;
          }

          .scanner-corner-br {
            bottom: 10px;
            right: 10px;
            border-bottom: 3px solid #1890ff;
            border-right: 3px solid #1890ff;
          }

          /* Scanning animation */
          .scanner-line {
            position: absolute;
            height: 2px;
            width: 100%;
            background: linear-gradient(
              to right,
              rgba(24, 144, 255, 0),
              rgba(24, 144, 255, 0.8),
              rgba(24, 144, 255, 0)
            );
            z-index: 9;
            top: 10%;
            box-shadow: 0 0 8px rgba(24, 144, 255, 0.8);
            animation: scanning 2s linear infinite;
            pointer-events: none;
          }

          @keyframes scanning {
            0% {
              top: 10%;
            }
            50% {
              top: 90%;
            }
            100% {
              top: 10%;
            }
          }

          /* QR Scanner styles */
          .react-qr-scanner video {
            position: relative !important;
            object-fit: cover !important;
            max-width: 100% !important;
            width: 100% !important;
          }

          .tablet-card {
            padding: 24px;
          }

          /* Larger touch targets for tablet */
          @media (min-width: 768px) and (max-width: 1024px) {
            button {
              min-height: 44px;
            }

            .scanner-corner-tl,
            .scanner-corner-tr,
            .scanner-corner-bl,
            .scanner-corner-br {
              width: 30px;
              height: 30px;
              border-width: 4px;
            }

            .react-qr-scanner video {
              height: 500px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default ScanQr;
