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

function ScanTicketQr() {
  const [qrResult, setQrResult] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [isTablet, setIsTablet] = useState(false);

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
        if (result.success) {
          setTicketInfo(result.data.data);
        }
      } catch (error) {
        console.error("Error fetching ticket data:", error);
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
            }}
          >
            Bắt đầu quét QR
          </Button>
        </div>
      )}

      {showScanner && scannerEnabled && (
        <div
          className={`mb-6 shadow-md ${isTablet ? "tablet-scanner" : ""}`}
          style={{
            borderRadius: "12px",
            maxWidth: isTablet ? "600px" : "400px",
            margin: "0 auto",
          }}
        >
          <div className="scanner-container flex flex-col items-center">
            <div
              className="qr-scanner-wrapper border-3 p-2 rounded-lg mb-4"
              style={{
                width: "100%",
              }}
            >
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
            <Text
              className="text-center text-gray-600 italic mb-2"
              style={{ fontSize: isTablet ? "16px" : "14px" }}
            >
              Hướng camera vào mã QR để quét
            </Text>
            <Button
              onClick={() => setShowScanner(false)}
              className="mb-4"
              danger
              size={isTablet ? "large" : "middle"}
              style={{
                height: isTablet ? "48px" : "32px",
                minWidth: isTablet ? "120px" : "80px",
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
          message="Mã QR này đã được check-in rồi!"
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

      <style jsx global>{`
        /* Tablet optimization styles */
        .tablet-scanner {
          width: 90% !important;
          max-width: 600px !important;
          margin: 0 auto;
        }

        .tablet-scanner .qr-scanner-wrapper {
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          overflow: hidden;
        }

        .tablet-scan-button {
          border-radius: 8px;
        }

        .tablet-card {
          padding: 24px;
        }

        .tablet-card .ant-card-body {
          padding: 24px;
        }

        /* Larger touch targets for tablet */
        @media (min-width: 768px) and (max-width: 1024px) {
          .react-qr-scanner video {
            width: 100% !important;
            height: auto !important;
          }

          button {
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
}

export default ScanTicketQr;
