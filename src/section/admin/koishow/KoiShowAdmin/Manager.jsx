import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, Checkbox } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

function Manager() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [managerData, setManagerData] = useState([
    {
      key: "1",
      name: "John Manager",
      email: "john@example.com",
      phone: "123-456-789",
      status: "Hoạt động",
      role: "Quản lý",
    },
    {
      key: "2",
      name: "Jane Manager",
      email: "jane@example.com",
      phone: "123-456-789",
      status: "Hoạt động",
      role: "Quản lý",
    },
  ]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCheckboxChange = (checkedValues) => {
    setSelectedManagers(checkedValues);
  };

  const handleClick = () => {
    console.log("Selected Managers:", selectedManagers);
    setSelectedManagers([]);
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
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
      render: (status) => (
        <span
          className={status === "Hoạt động" ? "text-green-500" : "text-red-500"}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "Role",
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

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
          Thêm mới
        </Button>
      </div>
      <Modal
        title="Thêm Quản Lý"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleClick}
            disabled={selectedManagers.length === 0}
          >
            Thêm Quản Lý Đã Chọn
          </Button>,
        ]}
        width={400}
      >
        <Checkbox.Group
          options={managerData.map((manager) => ({
            label: `${manager.name} (${manager.email})`,
            value: manager.key,
          }))}
          value={selectedManagers}
          onChange={handleCheckboxChange}
        />
      </Modal>
      <Table
        columns={columns}
        dataSource={managerData}
        pagination={{
          total: managerData.length,
          pageSize: 6,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
        }}
      />
    </div>
  );
}

export default Manager;
