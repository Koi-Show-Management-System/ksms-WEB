// Staff.jsx
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useShowStaff from "../../../hooks/useShowStaff";

function Staff({ showId }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Get the staff data and functions from the custom hook
  const {
    staffData: {
      items: staff,
      isLoading,
      error,
      currentPage,
      pageSize,
      totalItems,
    },
    fetchShowStaff,
  } = useShowStaff();

  // Fetch staff data when component mounts or when pagination changes
  useEffect(() => {
    // If showId is not provided, you won't be able to fetch staff data
    if (!showId) {
      message.error("Show ID is required to fetch staff data");
      return;
    }

    // Pass the showId parameter to the fetchShowStaff function
    fetchShowStaff(currentPage, pageSize, "Staff", showId);
  }, [currentPage, pageSize, showId, fetchShowStaff]);

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleTableChange = (pagination) => {
    fetchShowStaff(pagination.current, pagination.pageSize, "Staff", showId);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={status === "Active" ? "text-green-500" : "text-red-500"}
        >
          <Tag color={status === "active" ? "green" : "red"}>
            {status === "active" ? "Hoạt động" : "Không hoạt động"}
          </Tag>{" "}
        </span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => <span>{role === "Staff" ? "Nhân viên" : role}</span>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-3">
          <EditOutlined className="cursor-pointer" />
          <DeleteOutlined className="cursor-pointer" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={staff.map((item) => ({ ...item, key: item.id }))}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}

export default Staff;
