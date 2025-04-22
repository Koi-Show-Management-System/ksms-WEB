import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import useTicketType from "../../hooks/useTicketType";
import {
  Card,
  Button,
  Typography,
  Spin,
  Alert,
  Tag,
  Row,
  Col,
  Space,
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

function ScanTicketQr() {
  const [qrResult, setQrResult] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [isTablet, setIsTablet] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [errorTicket, setErrorTicket] = useState(null);

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
    isLoading,
    error,
    fetchInfoByQrCode,
    fetchUpdateTicketCheckIn,
    resetError,
  } = useTicketType();

  const handleScan = async (data) => {
    if (data && data.text) {
      setQrResult(data.text);
      setScannerEnabled(false);

      try {
        // Assumes QR code contains the ticket ID
        const result = await fetchInfoByQrCode(data.text);

        if (result && result.success) {
          setTicketInfo(result.data.data);
        } 
      } catch (error) {
        // Handle unexpected errors
        const errorMessage =
          error?.response?.data?.Error || "Đã xảy ra lỗi khi quét mã QR";
        console.error("Error fetching ticket data:", errorMessage);
        setErrorTicket(errorMessage);
        setScannerEnabled(true); // Allow scanning again
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
    setTicketInfo(null);
    resetError();
  };

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const ticketId = qrResult; // The QR code content is the ticket ID
      const result = await fetchUpdateTicketCheckIn(ticketId);

      if (result && result.success) {
        notification.success({
          message: "Check-in thành công",
          description: "Vé đã được xác nhận check-in",
          duration: 4,
        });
        // Reset state to go back to scanning mode
        handleReset();
      } else {
        notification.error({
          message: "Lỗi",
          description: result?.message || "Lỗi không xác định khi check-in vé",
          duration: 4,
        });
      }
    } catch (error) {
      // Handle 404 error - ticket already checked in
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

  // Helper function to map ticket status to display values
  const getStatusDisplay = (status) => {
    switch (status) {
      case "sold":
        return {
          color: "green",
          text: "Đã bán",
          icon: <CheckCircleOutlined />,
        };
      case "used":
        return {
          color: "grey",
          text: "Đã sử dụng",
          icon: <CloseCircleOutlined />,
        };
      case "refunded":
        return {
          color: "red",
          text: "Đã hoàn tiền",
          icon: <CloseCircleOutlined />,
        };
      case "cancelled":
        return { color: "red", text: "Đã hủy", icon: <CloseCircleOutlined /> };
      default:
        return { color: "blue", text: status, icon: <CheckCircleOutlined /> };
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

      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="text-center">
            <Spin
              size={isTablet ? "large" : "default"}
              tip="Đang tải thông tin vé..."
            />
          </div>
        </div>
      )}

      {error && (
        <Alert
          message={errorTicket}
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

      {ticketInfo && (
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
            <span className="">Thông tin vé</span>
          </Title>

          <Row gutter={[isTablet ? 40 : 32, isTablet ? 24 : 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" className="w-full" size="middle">
                <Card className="bg-gray-50 border-0">
                  <Text strong className="text-lg block mb-4">
                    Người mua:{" "}
                    <span className="text-blue-600">{ticketInfo.fullName}</span>
                  </Text>

                  <div className="mb-3 flex items-center">
                    <Text strong className="mr-2">
                      Trạng thái vé:
                    </Text>
                    <Tag
                      color={getStatusDisplay(ticketInfo.status).color}
                      icon={getStatusDisplay(ticketInfo.status).icon}
                      className="px-3 py-1"
                    >
                      {getStatusDisplay(ticketInfo.status).text}
                    </Tag>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <Text type="secondary">Loại vé:</Text>
                      <div className="font-semibold">
                        {ticketInfo.ticketTypeName}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Giá vé:</Text>
                      <div className="font-semibold">
                        {ticketInfo.ticketPrice?.toLocaleString()} VND
                      </div>
                    </div>
                    {ticketInfo.checkInTime && (
                      <div className="col-span-2">
                        <Text type="secondary">Thời gian check-in:</Text>
                        <div className="font-semibold">
                          {new Date(ticketInfo.checkInTime).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="bg-gray-50 border-0">
                  <div className="mb-3">
                    <Text type="secondary">Sự kiện:</Text>
                    <div className="font-semibold">{ticketInfo.showName}</div>
                  </div>
                  <div>
                    <Text type="secondary">Địa điểm:</Text>
                    <div className="font-semibold">
                      {ticketInfo.showLocation}
                    </div>
                  </div>
                  <div className="mt-3">
                    <Text type="secondary">Thời gian:</Text>
                    <div className="font-semibold">
                      {new Date(ticketInfo.showStartDate).toLocaleDateString()}{" "}
                      - {new Date(ticketInfo.showEndDate).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <Card className="bg-gray-50 border-0 h-full">
                <Title level={5} className="mb-4 text-blue-600">
                  Thông tin liên hệ
                </Title>
                <div className="mb-3">
                  <Text type="secondary">Email:</Text>
                  <div className="font-semibold">{ticketInfo.email}</div>
                </div>
                {ticketInfo.phone && (
                  <div className="mb-3">
                    <Text type="secondary">Số điện thoại:</Text>
                    <div className="font-semibold">{ticketInfo.phone}</div>
                  </div>
                )}
                {ticketInfo.checkInLocation && (
                  <div className="mb-3">
                    <Text type="secondary">Địa điểm check-in:</Text>
                    <div className="font-semibold">
                      {ticketInfo.checkInLocation}
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <div className="flex justify-center gap-6 mt-8">
            <Button
              type="primary"
              size={isTablet ? "large" : "middle"}
              icon={<CheckCircleOutlined />}
              onClick={handleCheckIn}
              loading={isCheckingIn}
              disabled={isCheckingIn || ticketInfo.status === "used"}
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
              {isCheckingIn ? "Đang xử lý..." : "Check-in vé"}
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

export default ScanTicketQr;
