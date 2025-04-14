import { Button, Result } from "antd";
import { Link } from "react-router-dom";
const Error = () => (
  <Result
    status="404"
    title="404"
    subTitle="Trang bạn đang tìm kiếm không tồn tại."
    extra={
      <Button type="primary" className="bg-[#1677ff]">
        <Link to="/admin/dashboard">Trang chủ</Link>
      </Button>
    }
  />
);
export default Error;
