import React, { useState, useEffect } from "react";
import { Tabs } from "antd";
import ScanQr from "./ScanQr";
import ScanTicketQr from "./ScanTicketQr";
import { QrcodeOutlined, TagOutlined } from "@ant-design/icons";

function ScanQrWrapper() {
  const [screenSize, setScreenSize] = useState("default");

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 640) {
        setScreenSize("mobile");
      } else if (window.innerWidth < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isTablet = screenSize === "tablet";
  const isMobile = screenSize === "mobile";

  const tabItems = [
    {
      key: "koiRegistration",
      label: (
        <div className="flex items-center space-x-2 py-1">
          <QrcodeOutlined
            className={`${isTablet ? "text-xl" : isMobile ? "text-base" : "text-lg"}`}
          />
          <span
            className={`${isTablet ? "text-base" : isMobile ? "text-xs" : "text-sm"} font-medium`}
          >
            Check-in Đơn Đăng Ký
          </span>
        </div>
      ),
      children: (
        <div className="py-3">
          <ScanQr />
        </div>
      ),
    },
    {
      key: "ticket",
      label: (
        <div className="flex items-center space-x-2 py-1">
          <TagOutlined
            className={`${isTablet ? "text-xl" : isMobile ? "text-base" : "text-lg"}`}
          />
          <span
            className={`${isTablet ? "text-base" : isMobile ? "text-xs" : "text-sm"} font-medium`}
          >
            Check-in Vé Tham Dự
          </span>
        </div>
      ),
      children: (
        <div className="py-3">
          <ScanTicketQr />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <h1 className="text-center text-2xl md:text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
          Hệ Thống Check-in
        </h1>

        {/* Scanner Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 shadow-lg border border-gray-100 hover:shadow-xl">
          <div className="pt-4 pb-2 px-4 md:px-6">
            <Tabs
              defaultActiveKey="koiRegistration"
              items={tabItems}
              centered
              size={isTablet || isMobile ? "middle" : "large"}
              animated={{ inkBar: true, tabPane: true }}
              className="qr-scan-tabs"
              tabBarGutter={isTablet ? 36 : isMobile ? 24 : 48}
            />
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100">
          <p className="text-sm text-gray-600 text-center">
            Di chuyển mã QR vào vùng quét để check-in
          </p>
        </div>
      </div>

      {/* Inline styles for Ant Design components - not from index.css */}
      <style jsx="true">
        {`
          /* Custom styling for Ant Design Tabs */
          .qr-scan-tabs .ant-tabs-ink-bar {
            height: 3px;
            border-radius: 3px;
            background: linear-gradient(90deg, #3b82f6, #6366f1);
          }

          .qr-scan-tabs .ant-tabs-nav {
            margin-bottom: 0.5rem;
          }

          .qr-scan-tabs .ant-tabs-tab:hover {
            color: #4f46e5;
          }

          .qr-scan-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #4f46e5;
            font-weight: 500;
          }

          /* Scanner video element customization */
          .qr-scan-tabs .react-qr-reader {
            width: 100% !important;
            max-width: 400px !important;
            margin: 0 auto !important;
          }

          .qr-scan-tabs .react-qr-reader video {
            border-radius: 0.5rem !important;
            object-fit: cover !important;
          }
        `}
      </style>
    </div>
  );
}

export default ScanQrWrapper;
