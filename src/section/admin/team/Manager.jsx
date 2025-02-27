import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Spin,
  Select,
  notification,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import useAccountTeam from "../../../hooks/useAccountTeam";
import { updateStatus } from "../../../api/accountManage";

function Manager({ accounts = [], isLoading }) {
  const { updateStatusAccount, fetchAccountTeam, updateAccountTeam } =
    useAccountTeam();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);

  const handleStatusChange = async (accountId, newStatus) => {
    try {
      console.log(`Changing status for account ${accountId} to ${newStatus}`);

      // Gọi API để cập nhật trạng thái
      const res = await updateStatus(accountId, newStatus);

      if (res && res.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Trạng thái tài khoản đã được cập nhật thành ${newStatus}`,
          placement: "topRight",
        });

        // Refresh danh sách tài khoản
        fetchAccountTeam();
      } else {
        notification.error({
          message: "Lỗi",
          description: "Không thể cập nhật trạng thái tài khoản",
          placement: "topRight",
        });
      }
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi cập nhật trạng thái tài khoản",
        placement: "topRight",
      });
    }
  };

  const handleEdit = (account) => {
    setCurrentAccount(account);
    setIsModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      const res = await updateAccountTeam(currentAccount.key, values);

      if (res.success) {
        notification.success({
          message: "Thành công",
          description: "Cập nhật tài khoản thành công!",
          placement: "topRight",
        });

        fetchAccountTeam();
        setIsModalVisible(false);
      } else {
        notification.error({
          message: "Lỗi",
          description: res.error || "Không thể cập nhật tài khoản.",
          placement: "topRight",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi cập nhật tài khoản",
        placement: "topRight",
      });
    }
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
      render: (status, record) => {
        const options = [
          {
            value: "active",
            label: <span className="text-green-500">Active</span>,
          },
          {
            value: "blocked",
            label: <span className="text-orange-500">Blocked</span>,
          },
          {
            value: "deleted",
            label: <span className="text-red-500">Deleted</span>,
          },
        ];

        return (
          <Select
            value={status.toLowerCase()}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record.key, value)}
            options={options}
            dropdownStyle={{ minWidth: 120 }}
          />
        );
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => role || "Quản lý",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <div className="flex mx-3">
          <EditOutlined
            onClick={() => handleEdit(record)}
            style={{ fontSize: 16, color: "#1890ff" }}
          />
        </div>
      ),
    },
  ];

  // Transform API data to match table structure
  const managerData = accounts.map((account, index) => ({
    key: account.id || index.toString(),
    fullName: account.fullName || account.name || "N/A",
    email: account.email || "N/A",
    phone: account.phone || "N/A",
    status: account.status || "inactive",
    role: account.role || "MANAGER",
  }));

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={managerData}
          pagination={{
            total: managerData.length,
            pageSize: 6,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
        />
      )}
      <Modal
        title="Chỉnh sửa tài khoản"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          initialValues={{
            fullName: currentAccount?.fullName,
            userName: currentAccount?.userName,
            phone: currentAccount?.phone,
            avatar: currentAccount?.avatar,
            role: currentAccount?.role,
          }}
          onFinish={handleUpdate}
          labelAlign="left"
          layout="vertical"
        >
          <Form.Item
            label="Tên đầy đủ"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập tên đầy đủ!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Tên"
            name="userName"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập!" },
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

          <Form.Item label="Ảnh đại diện" name="avatar">
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Manager;
