import React from "react";
import { Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import Referees from "./Referees";

function ManageShow() {
  const items = [
    {
      key: "manager",
      label: <span className="text-lg">Quản lý</span>,
      children: <Manager />,
    },
    {
      key: "staff",
      label: <span className="text-lg">Nhân viên</span>,
      children: <Staff />,
    },
    {
      key: "referees",
      label: <span className="text-lg">Trọng tài</span>,
      children: <Referees />,
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Tabs defaultActiveKey="manager" items={items} />
    </div>
  );
}

export default ManageShow;
