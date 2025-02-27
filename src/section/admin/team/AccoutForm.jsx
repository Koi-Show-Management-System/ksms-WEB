import { Button, Form, Input, Modal, Select, message, Upload, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import useAccountTeam from "../../../hooks/useAccountTeam";

function AccountForm({ isVisible, onCancel, title = "Thêm Tài Khoản Mới" }) {
  const [form] = Form.useForm();
  const { createAccount, isLoading } = useAccountTeam();
  const [avatarUrl, setAvatarUrl] = useState("");

  const handleSubmit = async (values) => {
    const accountData = {
      email: values.email,
      hashedPassword: values.password,
      fullName: values.fullName,
      userName: values.userName,
      phone: values.phone,
      role: values.role,
      avatar: avatarUrl || null,
    };

    const result = await createAccount(accountData);

    if (result.success) {
      notification.success({
        message: "Thành công",
        description: "Tài khoản được tạo thành công",
        placement: "topRight",
      });
      form.resetFields();
      setAvatarUrl("");
      onCancel();
    } else {
      notification.error({
        message: "Lỗi",
        description: result.error || "Không thể tạo tài khoản",
        placement: "topRight",
      });
    }
  };

  const handleAvatarUpload = async ({ fileList }) => {
    try {
      if (fileList && fileList.length > 0) {
        const file = fileList[0]; // Take only the first file

        if (file.url) {
          setAvatarUrl(file.url);
        } else if (file.originFileObj) {
          const formData = new FormData();
          formData.append("file", file.originFileObj);
          formData.append("upload_preset", "ml_default");

          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dphupjpqt/image/upload",
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.error("Cloudinary upload error:", data);
            throw new Error(data.error.message || "Image upload failed");
          }

          setAvatarUrl(data.secure_url);
        }

        message.success("Avatar đã được tải lên thành công!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      message.error("Lỗi khi tải avatar lên!");
    }
  };

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={() => {
        form.resetFields();
        setAvatarUrl("");
        onCancel();
      }}
      onOk={() => form.submit()}
      confirmLoading={isLoading}
    >
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Tên "
          name="userName"
          rules={[{ required: true, message: "Vui lòng nhập tên đầy đủ!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Tên đầy đủ"
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập tên đầy đủ!" }]}
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
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role"
          rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
        >
          <Select placeholder="Chọn vai trò">
            <Select.Option value="Admin">Admin</Select.Option>
            <Select.Option value="Manager">Manager</Select.Option>
            <Select.Option value="Staff">Staff</Select.Option>
            <Select.Option value="Referee">Referee</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Avatar">
          <Upload
            accept=".jpg,.jpeg,.png"
            listType="picture-card"
            fileList={
              avatarUrl
                ? [
                    {
                      uid: "-1",
                      name: "avatar.png",
                      status: "done",
                      url: avatarUrl,
                    },
                  ]
                : []
            }
            onChange={handleAvatarUpload}
            multiple={false}
          >
            <div>
              <UploadOutlined />
              <div className="mt-2">Upload Avatar</div>
            </div>
          </Upload>
          {avatarUrl && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">Avatar URL: {avatarUrl}</p>
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AccountForm;
