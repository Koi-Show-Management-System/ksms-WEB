import { useState, useEffect, useMemo } from "react";
import {
  HomeOutlined,
  CalendarOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Layout, Menu, notification } from "antd";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Cookies from "js-cookie";
import SignalRService from "../config/signalRService";

const { Sider, Content } = Layout;

const getItem = (label, key, icon, children, path) => {
  const item = {
    key,
    icon,
    children,
    label: path ? <Link to={path}>{label}</Link> : label,
  };

  return item;
};

const StaffDashboard = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { infoUser, fetchUserInfo, logout } = useAuth();
  const userId = Cookies.get("__id");
  const userInfo = infoUser?.data;

  useEffect(() => {
    if (userId) {
      fetchUserInfo(userId);
    }
    SignalRService.start()
      .then(() => {
        // console.log("SignalR connected successfully in KoiShowDetail");
        // Kiểm tra trạng thái kết nối sau 2 giây
        setTimeout(() => {
          // console.log(
          //   "Current SignalR state:",
          //   SignalRService.getConnectionState()
          // );
        }, 2000);
      })
      .catch((err) => {
        // console.error("SignalR connection error in KoiShowDetail:", err);
      });

    // Cleanup khi component unmount
    return () => {
      // console.log(
      //   "KoiShowDetail unmounting, SignalR state:",
      //   SignalRService.getConnectionState()
      // );
    };
  }, [fetchUserInfo, userId]);

  const items = useMemo(
    () => [
      getItem("Tổng Quan", "1", <HomeOutlined />, null, "/staff/overview"),
      getItem("Cuộc Thi Koi", "sub1", <CalendarOutlined />, [
        getItem("Danh Sách Triển Lãm", "2", null, null, "/staff/showList"),
        getItem("Triển Lãm Của Tôi", "3", null, null, "/staff/myShow"),
      ]),
      getItem("Tin Tức", "sub4", <ReadOutlined />, null, "/staff/news"),
    ],
    []
  );

  const handleLogout = () => {
    logout();
    notification.success({
      message: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi hệ thống.",
    });
    navigate("/");
  };

  const renderMenuItems = (items) => {
    return items.map((item) =>
      item.items && item.items.length > 0 ? (
        <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
          {renderMenuItems(item.items)}
        </Menu.SubMenu>
      ) : (
        <Menu.Item key={item.key} icon={item.icon}>
          <Link to={item.path}>{item.label}</Link>
        </Menu.Item>
      )
    );
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
            alt="Logo"
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

StaffDashboard.propTypes = {
  children: PropTypes.node.isRequired,
};

export default StaffDashboard;
