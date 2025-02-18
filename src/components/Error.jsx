import { Button, Result } from "antd";
import { Link } from "react-router-dom";
const Error = () => (
  <Result
    status="404"
    title="404"
    subTitle="Sorry, the page you visited does not exist."
    extra={
      <Button type="primary" className="bg-[#1677ff]">
        <Link to="/admin/dashboard">Back home</Link>
      </Button>
    }
  />
);
export default Error;
