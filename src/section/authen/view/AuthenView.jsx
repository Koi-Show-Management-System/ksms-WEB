import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Typography } from "antd";
import Carousel from "../Carousel";
import Authen from "../Authen";

const { Title, Text } = Typography;

function AuthenView() {
  const navigate = useNavigate();

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
      } else if (role === "Referee") {
        navigate("/referee");
      }
    }
  }, [navigate]);

  return (
    <div className="background w-full min-h-screen flex justify-center items-center bg-gray-100">
      <div className="max-w-[900px] mx-5 w-full bg-white grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-5 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-10 py-8 my-auto">
          <div className="text-center mb-6">
            <Title level={2} className="mb-2">
              Đăng nhập
            </Title>
            <Text type="secondary">Vui lòng đăng nhập để tiếp tục</Text>
          </div>
          <Authen />
        </div>
        <div className="hidden md:block">
          <Carousel />
        </div>
      </div>
    </div>
  );
}

export default AuthenView;
