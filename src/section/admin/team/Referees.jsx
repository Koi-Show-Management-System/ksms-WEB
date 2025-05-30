import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Spin,
  Select,
  notification,
  Upload,
  message,
  Empty,
  Space,
} from "antd";
import {
  EditOutlined,
  UploadOutlined,
  LoadingOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import useAccountTeam from "../../../hooks/useAccountTeam";
import { updateStatus } from "../../../api/accountManage";
import { Loading } from "../../../components";

function Referees({ accounts = [], isLoading, role }) {
  const { updateStatusAccount, fetchAccountTeam, updateAccountTeam } =
    useAccountTeam();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAccountTeam(1, 10, role, statusFilter, searchQuery);
  }, [statusFilter, searchQuery]);

  // Function to translate status to Vietnamese
  const getStatusInVietnamese = (status) => {
    const statusMap = {
      active: "Hoạt động",
      blocked: "Khóa tài khoản",
      deleted: "Xóa tài khoản",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const handleStatusChange = async (accountId, newStatus) => {
    try {
      console.log(`Changing status for account ${accountId} to ${newStatus}`);

      const res = await updateStatus(accountId, newStatus);

      if (res && res.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Trạng thái tài khoản đã được cập nhật thành ${getStatusInVietnamese(newStatus)}`,
          placement: "topRight",
        });

        fetchAccountTeam(1, 10, role);
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

  const enableEditing = () => {
    setIsEditing(true);
  };

  const handleEdit = (account) => {
    setCurrentAccount(account);
    setAvatar(account.avatar);
    setIsEditing(false);
    setIsModalVisible(true);

    if (account.avatar) {
      setPreviewImage(account.avatar);
      setFileList([
        {
          uid: "-1",
          name: "current-avatar.jpg",
          status: "done",
          url: account.avatar,
        },
      ]);
    } else {
      setPreviewImage("");
      setFileList([]);
    }

    form.setFieldsValue({
      fullName: account.fullName,
      username: account.username,
      phone: account.phone,
    });
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
    if (fileList.length > 0) {
      setPreviewImage(URL.createObjectURL(fileList[0].originFileObj));
    } else {
      setPreviewImage(avatar);
    }
  };

  const urlToBlob = async (url) => {
    try {
      console.log("🔄 Fetching avatar URL:", url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Không thể tải ảnh từ URL!");
      }

      const blob = await response.blob();
      return new File([blob], "avatar.jpg", { type: blob.type });
    } catch (error) {
      console.error("🚨 Lỗi khi convert URL thành file:", error);
      return null;
    }
  };

  const handleUpdate = async (values) => {
    const formData = new FormData();
    formData.append("FullName", values.fullName);
    formData.append("Username", values.username);
    formData.append("Phone", values.phone);

    let avatarFile = null;

    if (fileList.length > 0 && fileList[0].originFileObj) {
      avatarFile = fileList[0].originFileObj;
    } else if (avatar) {
      avatarFile = await urlToBlob(avatar);
    }

    if (avatarFile) {
      formData.append("AvatarUrl", avatarFile);
    }

    console.log("🔥 Dữ liệu gửi lên:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const res = await updateAccountTeam(currentAccount.key, formData);
    if (res.success) {
      fetchAccountTeam(1, 10, role);
      setIsModalVisible(false);
      setIsEditing(false);
    } else {
      console.log("Lỗi account", res);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditing(false);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value === "--" ? null : value);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
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
            label: <span className="text-green-500">Hoạt động</span>,
          },
          {
            value: "blocked",
            label: <span className="text-orange-500">Khóa tài khoản</span>,
          },
          {
            value: "deleted",
            label: <span className="text-red-500">Xóa tài khoản</span>,
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
      render: () => "Trọng tài",
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

  const refereeData = accounts.map((account, index) => ({
    key: account.id || index.toString(),
    fullName: account.fullName || account.name || "N/A",
    email: account.email || "N/A",
    phone: account.phone || "N/A",
    status: account.status || "inactive",
    role: account.role || "REFEREE",
    username: account.username || "",
    avatar: account.avatar || "",
  }));

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Space>
          <Input
            placeholder="Tìm kiếm trọng tài..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={handleSearch}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            onChange={handleStatusFilterChange}
            value={statusFilter || "--"}
            options={[
              { value: "--", label: "Tất cả" },
              { value: "Active", label: "Hoạt động" },
              { value: "Blocked", label: "Khóa tài khoản" },
              { value: "Deleted", label: "Xóa tài khoản" },
            ]}
          />
        </Space>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={refereeData}
          pagination={{
            total: refereeData.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="Không có dữ liệu"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "24px 0" }}
              />
            ),
          }}
        />
      )}
      <Modal
        title="Thông tin tài khoản"
        open={isModalVisible}
        onCancel={handleCancel}
        okText="Cập nhật"
        cancelText="Đóng"
        footer={
          isEditing
            ? [
                <Button key="back" onClick={handleCancel}>
                  Hủy
                </Button>,
                <Button key="submit" type="primary" onClick={form.submit}>
                  Cập nhật
                </Button>,
              ]
            : [
                <Button key="back" onClick={handleCancel}>
                  Đóng
                </Button>,
                <Button key="edit" type="primary" onClick={enableEditing}>
                  Chỉnh sửa
                </Button>,
              ]
        }
      >
        <Form
          form={form}
          onFinish={handleUpdate}
          labelAlign="left"
          layout="vertical"
        >
          <Form.Item
            label="Tên đầy đủ"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập tên đầy đủ!" }]}
          >
            {isEditing ? <Input /> : <Input disabled />}
          </Form.Item>

          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập!" },
            ]}
          >
            {isEditing ? <Input /> : <Input disabled />}
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
            ]}
          >
            {isEditing ? <Input /> : <Input disabled />}
          </Form.Item>

          <Form.Item label="Ảnh đại diện">
            <div className="flex items-center ">
              <div>
                {isEditing && (
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    beforeUpload={() => false}
                    onChange={handleUploadChange}
                  >
                    {fileList.length > 0 ? null : <PlusOutlined />}
                  </Upload>
                )}
              </div>

              <div>
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="avatar"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                ) : null}
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Referees;
