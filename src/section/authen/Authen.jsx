import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Form, Input, Button, Checkbox, notification, Spin } from "antd";
import {
  UserOutlined,
  LockOutlined,
  LoadingOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { login } from "../../api/authenApi";
import useAuth from "../../hooks/useAuth";

function Authen() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Kiểm tra nếu người dùng đã đăng nhập
  useEffect(() => {
    const token = Cookies.get("__token");
    const role = Cookies.get("__role");

    if (token && role) {
      // Nếu đã đăng nhập, chuyển hướng dựa vào role
      if (role === "Admin") {
        navigate("/admin");
      } else if (role === "Manager") {
        navigate("/manager");
      } else if (role === "Staff") {
        navigate("/staff");
      } else if (role === "Referee") {
        navigate("/referee");
      }
    }
  }, [navigate, isAuthenticated]);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSignin = async (formValues) => {
    setIsLoggingIn(true);

    try {
      const { email, password } = formValues;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        notification.error({
          message: "Email không hợp lệ",
          description: "Vui lòng nhập đúng định dạng email.",
        });
        setIsLoggingIn(false);
        return;
      }

      const response = await login(email, password);

      if (!response?.data?.data) {
        throw new Error("Dữ liệu phản hồi không hợp lệ");
      }

      const { token, id, role } = response.data.data;

      // Cài đặt cookies tự động hết hạn sau 1 giờ
      const expiresIn = 5 / 24; // 5 giờ (5/24 của 1 ngày)

      Cookies.set("__token", token, { expires: expiresIn, secure: true });
      Cookies.set("__role", role, { expires: expiresIn, secure: true });
      Cookies.set("__id", id, { expires: expiresIn, secure: true });
      // Gọi phương thức login và kiểm tra kết quả
      const loginSuccess = useAuth.getState().login();

      // Nếu login thất bại (vai trò Member), dừng xử lý tại đây
      if (!loginSuccess) {
        setIsLoggingIn(false);
        return;
      }

      notification.success({
        message: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });

      if (role === "Admin") {
        navigate("/admin");
      } else if (role === "Manager") {
        navigate("/manager");
      } else if (role === "Staff") {
        navigate("/staff");
      } else if (role === "Referee") {
        navigate("/referee");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);

      notification.error({
        message: "Đăng nhập không thành công",
        description: error?.response?.data?.Error || "Đăng nhập thất bại",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Form
      form={form}
      name="login_form"
      className="login-form"
      onFinish={handleSignin}
      layout="vertical"
    >
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Vui lòng nhập email!" },
          { type: "email", message: "Email không hợp lệ!" },
        ]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder="Nhập email của bạn"
          size="large"
          autoFocus
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[
          { required: true, message: "Vui lòng nhập mật khẩu!" },
          { min: 3, message: "Mật khẩu phải có ít nhất 3 ký tự!" },
        ]}
      >
        <Input
          prefix={<LockOutlined className="text-gray-400" />}
          type={showPassword ? "text" : "password"}
          placeholder="Nhập mật khẩu của bạn"
          size="large"
          suffix={
            showPassword ? (
              <EyeInvisibleOutlined onClick={togglePassword} />
            ) : (
              <EyeOutlined onClick={togglePassword} />
            )
          }
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          className="w-full h-10 text-base"
          loading={isLoggingIn}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default Authen;
