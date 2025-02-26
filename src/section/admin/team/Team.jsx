import React from "react";
import { Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import Referees from "./Referees";

function Team() {
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
    <div>
      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs defaultActiveKey="manager" items={items} />
        </div>
      </div>
    </div>
  );
}

export default Team;
