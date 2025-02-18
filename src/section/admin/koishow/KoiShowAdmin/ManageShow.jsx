import React from "react";
import { Tabs } from "antd";
import Manager from "./Manager";
import Staff from "./Staff";
import Referees from "./Referees";

function ManageShow() {
  const items = [
    {
      key: "manager",
      label: <span className="text-lg">Manager</span>,
      children: <Manager />,
    },
    {
      key: "staff",
      label: <span className="text-lg">Staff</span>,
      children: <Staff />,
    },
    {
      key: "referees",
      label: <span className="text-lg">Referees</span>,
      children: <Referees />,
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs defaultActiveKey="manager" items={items} />
        </div>
      </div>
    </div>
  );
}

export default ManageShow;
