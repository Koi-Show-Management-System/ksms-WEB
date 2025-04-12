import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useShowStaff from "../../../../hooks/useShowStaff";

function Referees({ showId }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Get the referees data and functions from the custom hook
  const {
    accountManage: { referees },
    isLoading,
    error,
    totalItems,
    totalPages,
    fetchShowStaff,
  } = useShowStaff();

  useEffect(() => {
 fetchShowStaff(currentPage, pageSize, "Referee", showId);
  }, [currentPage, pageSize, showId, fetchShowStaff]);

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);



  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
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
          {status === "Active" ? "Hoạt động" : "Không hoạt động"}
        </span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => <span>{role === "Referee" ? "Trọng tài" : role}</span>,
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
      <div className="mb-4 flex justify-end">
        <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
          Thêm mới
        </Button>
      </div>
      <Modal
        title="Thêm Trọng Tài"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" className="space-y-4">
          <Form.Item
            label="Tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
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
      <Table
        columns={columns}
        dataSource={referees.map((item) => ({ ...item, key: item.id }))}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}

export default Referees;
