import { Button, Form, Input, Modal, Select, notification } from "antd";
import React from "react";
import useAccountTeam from "../../../hooks/useAccountTeam";

function AccountForm({ isVisible, onCancel, title = "Thêm Tài Khoản Mới" }) {
  const [form] = Form.useForm();
  const { createAccount, isLoading, fetchAccountTeam } = useAccountTeam();

  const handleSubmit = async (values) => {
    const accountData = {
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      userName: values.userName,
      phone: values.phone,
      role: values.role,
    };

    const result = await createAccount(accountData);
    fetchAccountTeam(1, 10, role);

    if (result.success) {
      notification.success({
        message: "Thành công",
        description: "Tài khoản được tạo thành công",
        placement: "topRight",
      });
      form.resetFields();
      onCancel();
    } else {
      notification.error({
        message: "Lỗi",
        description: result.error || "Không thể tạo tài khoản",
        placement: "topRight",
      });
    }
  };

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={() => {
        form.resetFields();
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
            <Select.Option value="Manager">Manager</Select.Option>
            <Select.Option value="Staff">Staff</Select.Option>
            <Select.Option value="Referee">Referee</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AccountForm;
