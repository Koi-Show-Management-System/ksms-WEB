import { Form, Input, Button, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

function Authen() {
  const handleSubmit = (e) => {
    e.preventDefault();
    form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
      }
    });
  };

  const [form] = Form.useForm();

  return (
    <Form form={form} onSubmit={handleSubmit} className="login-form">
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Input
          prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
          placeholder="Username"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input
          prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
          type="password"
          placeholder="Password"
        />
      </Form.Item>
      <Form.Item name="remember" valuePropName="checked" initialValue={true}>
        <Checkbox>Remember me</Checkbox>
        <Link
          to="#"
          className="login-form-forgot float-right text-[#3094ff] hover:underline"
        >
          Forgot password
        </Link>
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        className="login-form-button bg-[#1677ff] block mx-auto w-full"
        size="middle"
      >
        <Link to="/admin/overview" className="block">
          Login
        </Link>
      </Button>
    </Form>
  );
}

export default Authen;
