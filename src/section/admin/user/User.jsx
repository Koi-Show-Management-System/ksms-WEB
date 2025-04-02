import { useEffect, useState } from "react";
import {
  Table,
  Space,
  Button,
  Select,
  notification,
  Modal,
  Form,
  Input,
  Upload,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useAccountTeam from "../../../hooks/useAccountTeam";
import { updateStatus } from "../../../api/accountManage";

const User = () => {
  const {
    accountManage,
    fetchAccountTeam,
    isLoading,
    currentPage,
    pageSize,
    totalItems,
    updateAccountTeam,
  } = useAccountTeam();
  // Add local state to store updated data
  const [localData, setLocalData] = useState([]);
  // Add state for modal and editing
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    fetchAccountTeam(currentPage, pageSize, "Member");
  }, [currentPage, pageSize]);

  // Update local data when accountManage changes
  useEffect(() => {
    if (accountManage.member) {
      const formattedData = accountManage.member.map((account) => ({
        key: account.id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone || "0384499305",
        status: account.status || "active",
        role: account.role,
      }));
      setLocalData(formattedData);
    }
  }, [accountManage]);

  const handleTableChange = (pagination) => {
    fetchAccountTeam(pagination.current, pagination.pageSize, "Member");
  };

  const enableEditing = () => {
    setIsEditing(true);
  };

  const handleEdit = (record) => {
    setCurrentAccount(record);
    setAvatar(record.avatar);
    setIsEditing(false);
    setIsModalVisible(true);

    if (record.avatar) {
      setPreviewImage(record.avatar);
      setFileList([
        {
          uid: "-1",
          name: "current-avatar.jpg",
          status: "done",
          url: record.avatar,
        },
      ]);
    } else {
      setPreviewImage("");
      setFileList([]);
    }

    form.setFieldsValue({
      fullName: record.fullName,
      username: record.username || record.email.split("@")[0],
      phone: record.phone,
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
      notification.success({
        message: "Thành công",
        description: "Cập nhật tài khoản thành công!",
        placement: "topRight",
      });

      fetchAccountTeam(currentPage, pageSize, "Member");
      setIsModalVisible(false);
      setIsEditing(false);
    } else {
      notification.error({
        message: "Lỗi",
        description: res.error || "Không thể cập nhật tài khoản.",
        placement: "topRight",
      });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditing(false);
  };

  const handleDelete = (record) => {
    console.log("Delete account:", record);
  };

  const handleStatusChange = async (accountId, newStatus) => {
    try {
      console.log(`Changing status for account ${accountId} to ${newStatus}`);

      // Update locally first (optimistic update)
      setLocalData((prevData) =>
        prevData.map((item) =>
          item.key === accountId ? { ...item, status: newStatus } : item
        )
      );

      const res = await updateStatus(accountId, newStatus);

      if (res && res.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Trạng thái tài khoản đã được cập nhật thành ${newStatus}`,
          placement: "topRight",
        });

        // Fetch fresh data from the server to ensure everything is in sync
        fetchAccountTeam(currentPage, pageSize, "Member");
      } else {
        // Revert the optimistic update if the server request fails
        fetchAccountTeam(currentPage, pageSize, "Member");
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi cập nhật trạng thái tài khoản",
        placement: "topRight",
      });
      // Revert the optimistic update on error
      fetchAccountTeam(currentPage, pageSize, "Member");
    }
  };

  const columns = [
    {
      title: "Họ và Tên",
      dataIndex: "fullName",
      width: "15%",
    },
    {
      title: "Email",
      dataIndex: "email",
      width: "25%",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: "20%",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: "15%",
      render: (status, record) => {
        const options = [
          {
            value: "active",
            label: <span className="text-green-500">Hoạt động</span>,
          },
          {
            value: "blocked",
            label: <span className="text-orange-500">Đã khóa</span>,
          },
          {
            value: "deleted",
            label: <span className="text-red-500">Đã xóa</span>,
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
      render: (role) => (role === "Member" ? "Thành viên" : role),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={localData}
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          pageSizeOptions: ["5", "10", "20", "50"],
        }}
        onChange={handleTableChange}
        className="w-full"
      />

      <Modal
        title="Thông tin tài khoản"
        open={isModalVisible}
        onCancel={handleCancel}
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
                ) : (
                  <div>Không có hình đại diện</div>
                )}
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default User;
