import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { useNavigate } from "react-router-dom";

function Authen() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSignin = async (formValues) => {
    setIsLoggingIn(true);

    try {
      const { email, password } = formValues;
      const response = await login(email, password);
      const { token, id, role } = response.data.data;

      if (rememberMe) {
        Cookies.set("__token", token, { expires: 1 });
        Cookies.set("__role", role, { expires: 1 });
        Cookies.set("__id", id, { expires: 1 });
      } else {
        Cookies.set("__token", token, { expires: 1 });
        Cookies.set("__role", role, { expires: 1 });
        Cookies.set("__id", id, { expires: 1 });
      }

      useAuth.getState().login();

      notification.success({
        message: "Đăng nhập thành công",
        description: "Bạn đã đăng nhập thành công!",
      });

      if (role === "Admin") {
        navigate("/admin");
      } else if (role === "Manager") {
        navigate("/manager");
      } else if (role === "Referee") {
        navigate("/referee");
      } else {
        navigate("/");
      }
    } catch (error) {
      notification.error({
        message: "Đăng nhập không thành công",
        description: "Email hoặc mật khẩu không hợp lệ. Vui lòng thử lại.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Form name="normal_login" className="login-form" onFinish={handleSignin}>
      <Form.Item
        name="email"
        rules={[{ required: true, message: "Please input your Email!" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Email" autoFocus />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input
          prefix={<LockOutlined />}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
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
        <Checkbox onChange={(e) => setRememberMe(e.target.checked)}>
          Remember me
        </Checkbox>
        <Link to="#" className="float-right text-[#3094ff] hover:underline">
          Forgot password
        </Link>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="w-full">
          {isLoggingIn ? <Spin indicator={<LoadingOutlined />} /> : "Login"}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default Authen;
