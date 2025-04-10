import { useEffect, useState } from "react";
import {
  HomeOutlined,
  CalendarOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  ReadOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Cookies from "js-cookie";

const { Content, Sider, Footer } = Layout;

function getItem(label, key, icon, children, path) {
  return {
    key,
    icon,
    children,
    label: path ? <Link to={path}>{label}</Link> : label,
  };
}

// Modified items array to only include required menu items
const items = [
  getItem("Tổng Quan", "1", <HomeOutlined />, null, "/manager/overview"),
  getItem(
    "Danh Sách Triển Lãm",
    "2",
    <CalendarOutlined />,
    null,
    "/manager/showList"
  ),
  getItem(
    "Quản Lý Nhóm",
    "sub3",
    <UsergroupAddOutlined />,
    null,
    "/manager/teams"
  ),
  getItem("Tin Tức", "sub4", <ReadOutlined />, null, "/manager/news"),
  // getItem("Tiêu chí", "sub5", <BookOutlined />, null, "/manager/criteria"),
];

const ManagerDashboard = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { infoUser, fetchUserInfo, logout } = useAuth();
  const userId = Cookies.get("__id");
  const userInfo = infoUser?.data;

  useEffect(() => {
    if (userId) {
      fetchUserInfo(userId);
    }
  }, [fetchUserInfo, userId]);

  const handleLogout = () => {
    logout();
    notification.success({
      message: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi hệ thống.",
    });
    navigate("/");
  };

  return (
    <Layout className="h-screen">
      <Sider
        width={230}
        breakpoint="lg"
        collapsedWidth="55"
        defaultCollapsed
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
      >
        <div className="demo-logo-vertical" />
        <div className="flex justify-center ">
          <img
            className="w-5/12 object-cover select-none"
            src="https://i.pinimg.com/236x/9e/ed/23/9eed2356a1d7cc36ff77e160869b09d7.jpg"
            alt=""
          />
        </div>
        <Menu
          theme="light"
          defaultSelectedKeys={["1"]}
          mode="inline"
          className="select-none"
          items={items}
        />
      </Sider>
      <Layout className="overflow-y-auto md:ml-0 ">
        <header className="header mr-3 pr-4 flex justify-end gap-2 items-center fixed z-50 h-16 backdrop-blur-[5px] bg-[#f9fafba8] transition duration-200 ease-in-out">
          <div className="">
            <img
              src="https://anhcute.net/wp-content/uploads/2024/08/Tranh-chibi-Capybara-sieu-de-thuong.jpg"
              alt="User Avatar"
              className="w-12 h-12 rounded-full"
            />
          </div>
          <div className="flex flex-col">
            <strong>{userInfo?.fullName}</strong>
            <Link
              to="#"
              onClick={handleLogout}
              className="text-[#65b3fd] hover:underline"
            >
              Đăng xuất
            </Link>
          </div>
        </header>
        <Content className="mt-[80px] mx-4 ">{children}</Content>
      </Layout>
    </Layout>
  );
};

ManagerDashboard.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ManagerDashboard;
