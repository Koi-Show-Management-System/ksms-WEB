import React, { useState } from "react";
import { Tabs } from "antd";
import ScanQr from "./ScanQr";
import ScanTicketQr from "./ScanTicketQr";

function ScanQrWrapper() {
  const items = [
    {
      key: "koiRegistration",
      label: "Check-in Đăng Ký Koi",
      children: <ScanQr />,
    },
    {
      key: "ticket",
      label: "Check-in Vé Tham Dự",
      children: <ScanTicketQr />,
    },
  ];

  return (
    <div className="scan-qr-wrapper max-w-6xl mx-auto">
      <Tabs defaultActiveKey="koiRegistration" items={items} centered />
    </div>
  );
}

export default ScanQrWrapper;
