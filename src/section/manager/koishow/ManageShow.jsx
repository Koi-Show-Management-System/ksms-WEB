import React from "react";
import { Button, Form, Input, Modal, Tabs } from "antd";
import Staff from "./Staff";
import { PlusOutlined } from "@ant-design/icons";

function ManageShow({ showId }) {
  const items = [
    // {
    //   key: "manager",
    //   label: <span className="text-lg">Quản lý</span>,
    //   children: <Manager showId={showId} />,
    // },
    {
      key: "staff",
      label: <span className="text-lg">Nhân viên</span>,
      children: <Staff showId={showId} />,
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Tabs
        defaultActiveKey="manager"
        items={items}
        tabBarExtraContent={{
          right: (
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm mới
            </Button>
          ),
        }}
      />
    </div>
  );
}

export default ManageShow;
