import React, { useState, useEffect } from "react";
import { Tabs, Typography, Card, Space, Button } from "antd";
import ScanQr from "./ScanQr";
import ScanTicketQr from "./ScanTicketQr";
import { QrcodeOutlined, TagOutlined, ScanOutlined } from "@ant-design/icons";

const { Title } = Typography;

function ScanQrWrapper() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Kiểm tra kích thước màn hình khi component mount và khi window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const tabItems = [
    {
      key: "koiRegistration",
      label: (
        <Space size="small">
          <QrcodeOutlined style={{ fontSize: isTablet ? "18px" : "16px" }} />
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Check-in Đơn Đăng Ký
          </span>
        </Space>
      ),
      children: <ScanQr />,
    },
    {
      key: "ticket",
      label: (
        <Space size="small">
          <TagOutlined style={{ fontSize: isTablet ? "18px" : "16px" }} />
          <span style={{ fontSize: isTablet ? "16px" : "14px" }}>
            Check-in Vé Tham Dự
          </span>
        </Space>
      ),
      children: <ScanTicketQr />,
    },
  ];

  return (
    <div
      className="scan-qr-wrapper mx-auto"
      style={{ padding: isTablet ? "20px" : "16px" }}
    >
      <div className={`scan-container ${isTablet ? "tablet-mode" : ""}`}>
        <div
          className="bg-white/90 backdrop-blur-sm"
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Tabs
            defaultActiveKey="koiRegistration"
            items={tabItems}
            centered
            size={isTablet ? "large" : "middle"}
            animated={{ inkBar: true, tabPane: true }}
            className={`custom-tabs ${isTablet ? "tablet-tabs" : ""}`}
            tabBarGutter={isTablet ? 40 : 24}
          />
        </div>
      </div>

      <style jsx global>{`
        /* Tablet-specific styles */
        .tablet-mode {
          max-width: 100%;
          margin: 0 auto;
        }

        .tablet-tabs .ant-tabs-nav {
          margin-bottom: 28px;
        }

        .tablet-tabs .ant-tabs-tab {
          padding: 16px 30px;
        }

        /* Styles for scanner components on tablet */
        .tablet-mode .scanner-container {
          width: 90%;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Tablet optimizations for QR scanner */
        .tablet-mode .react-qr-scanner video {
          width: 100% !important;
          height: auto !important;
          aspect-ratio: 4/3;
          object-fit: cover;
        }

        /* Larger buttons for touch screens */
        .tablet-mode button {
          min-height: 48px;
          min-width: 120px;
          font-size: 16px;
          touch-action: manipulation;
        }

        /* Base styles */
        .text-gradient {
          background: linear-gradient(90deg, #1677ff, #00b96b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }

        .custom-tabs .ant-tabs-nav {
          margin-bottom: 24px;
        }

        .custom-tabs .ant-tabs-tab {
          padding: 12px 24px;
          transition: all 0.3s ease;
        }

        .custom-tabs .ant-tabs-tab:hover {
          color: #1677ff;
          transform: translateY(-2px);
        }

        .custom-tabs .ant-tabs-tab-active {
          font-weight: 600;
        }

        .custom-tabs .ant-tabs-ink-bar {
          height: 3px;
          border-radius: 3px;
          background: linear-gradient(90deg, #1677ff, #00b96b);
        }

        /* Landscape mode for tablets */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
          .scan-qr-wrapper {
            padding: 16px 24px;
          }

          .tablet-mode .scanner-container {
            max-width: 70%;
          }
        }

        /* Portrait mode for tablets */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .scan-qr-wrapper {
            padding: 20px;
          }

          .tablet-mode .scanner-container {
            max-width: 90%;
          }
        }

        /* Mobile styles */
        @media (max-width: 640px) {
          .scan-qr-wrapper {
            padding: 12px;
          }

          .custom-tabs .ant-tabs-tab {
            padding: 8px 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default ScanQrWrapper;
