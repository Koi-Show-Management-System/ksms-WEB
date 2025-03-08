// Manager.jsx
import React, { useEffect } from "react";
import { Table, Button, message, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useShowStaff from "../../../../hooks/useShowStaff";

function Manager({ showId }) {
  const {
    managerData: {
      items: managers,
      isLoading,
      error,
      currentPage,
      pageSize,
      totalItems,
    },
    fetchShowStaff,
  } = useShowStaff();

  useEffect(() => {
    if (!showId) {
      message.error("Show ID is required to fetch manager data");
      return;
    }
    fetchShowStaff(1, pageSize, "Manager", showId);
  }, [fetchShowStaff, pageSize, showId]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handlePageChange = (page, size) => {
    fetchShowStaff(page, size, "Manager", showId);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (name) => name || "Chưa cập nhật",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email || "Chưa cập nhật",
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
      render: (role) => (role === "Manager" ? "Quản lý" : role || "Không rõ"),
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
      <Table
        columns={columns}
        dataSource={managers.map((item) => ({
          key: item.id,
          name: item.fullName,
          email: item.email,
          status: item.status,
          role: item.role,
        }))}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
        }}
      />
    </div>
  );
}

export default Manager;
