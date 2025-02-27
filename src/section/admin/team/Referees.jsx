import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, Spin } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

function Referees({ accounts = [], isLoading }) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "fullName",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "";
        let text = "";

        // Chuẩn hóa status thành chữ thường để dễ so sánh
        const normalizedStatus = status ? status.toLowerCase() : "";

        if (normalizedStatus === "active") {
          color = "text-green-500";
          text = "Active";
        } else if (normalizedStatus === "blocked") {
          color = "text-orange-500"; // Màu cam cho trạng thái Blocked
          text = "Blocked";
        } else if (normalizedStatus === "deleted") {
          color = "text-red-500"; // Màu đỏ cho trạng thái Deleted
          text = "Deleted";
        } else {
          color = "text-gray-500"; // Màu xám cho các trạng thái khác
          text = status || "N/A";
        }

        return <span className={color}>{text}</span>;
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: () => "Trọng tài",
    },
    {
      title: "Hành động",
      key: "action",
      render: () => (
        <div className="flex gap-3">
          <EditOutlined className="cursor-pointer" />
          <DeleteOutlined className="cursor-pointer" />
        </div>
      ),
    },
  ];

  // Transform API data to match table structure
  const refereeData = accounts.map((account, index) => ({
    key: account.id || index.toString(),
    fullName: account.fullName || account.name || "N/A",
    email: account.email || "N/A",
    phone: account.phone || "N/A",
    status: account.status || "INACTIVE",
    role: account.role || "REFEREE",
  }));

  return (
    <div>
      <Modal
        title="Thêm Trọng Tài Mới"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form layout="vertical" className="space-y-4">
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Vui lòng nhập email!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={refereeData}
          pagination={{
            total: refereeData.length,
            pageSize: 6,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
        />
      )}
    </div>
  );
}

export default Referees;
