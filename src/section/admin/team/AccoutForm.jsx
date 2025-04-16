import { Button, Form, Input, Modal, Select, notification, Upload } from "antd";
import React, { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import useAccountTeam from "../../../hooks/useAccountTeam";

function AccountForm({ isVisible, onCancel, title = "Thêm Tài Khoản Mới" }) {
  const [form] = Form.useForm();
  const { createAccount, isLoading, fetchAccountTeam } = useAccountTeam();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");

  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append("Email", values.email);
    formData.append("FullName", values.fullName);
    formData.append("Username", values.userName);
    formData.append("Phone", values.phone);
    formData.append("Role", values.role);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("AvatarUrl", fileList[0].originFileObj);
    }

    console.log("🔥 Dữ liệu gửi lên:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    await createAccount(formData);
    fetchAccountTeam(1, 10);
    form.resetFields();
    setFileList([]);
    setPreviewImage("");
    onCancel();
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
    if (fileList.length > 0) {
      setPreviewImage(URL.createObjectURL(fileList[0].originFileObj));
    } else {
      setPreviewImage("");
    }
  };

  return (
    <Modal
      title={title}
      open={isVisible}
      okText="Thêm"
      cancelText="Đóng"
      onCancel={() => {
        form.resetFields();
        setFileList([]);
        setPreviewImage("");
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
          label="Tên"
          name="userName"
          rules={[{ required: true, message: "Vui lòng nhập tên !" }]}
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
            <Select.Option value="Manager">Quản lý </Select.Option>
            <Select.Option value="Staff">Nhân viên</Select.Option>
            <Select.Option value="Referee">Trọng tài</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Ảnh đại diện">
          <div className="flex items-center">
            <div>
              <Upload
                listType="picture-card"
                fileList={fileList}
                beforeUpload={() => false}
                onChange={handleUploadChange}
              >
                {fileList.length > 0 ? null : <PlusOutlined />}
              </Upload>
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
  );
}

export default AccountForm;
