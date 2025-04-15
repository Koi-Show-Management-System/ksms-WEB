import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Layout, Menu, notification } from "antd";
import {
  UsergroupAddOutlined,
  HomeOutlined,
  CalendarOutlined,
  BookOutlined,
  UserAddOutlined,
  ReadOutlined,
  ContainerOutlined,
  FolderOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import logo from "../assets/file.png";
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

const AdminDashboard = React.memo(({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { infoUser, fetchUserInfo, logout } = useAuth();
  const navigate = useNavigate();
  const userId = Cookies.get("__id");
  const userInfo = infoUser?.data;

  // Theo dõi kích thước màn hình để đáp ứng thiết bị
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Kiểm tra kích thước ban đầu

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const items = useMemo(
    () => [
      getItem("Tổng Quan", "1", <HomeOutlined />, null, "/admin/overview"),
      getItem(
        "Danh Sách Triển Lãm",
        "2",
        <CalendarOutlined />,
        null,
        "/admin/showList"
      ),
      getItem("Người Dùng", "sub2", <UserAddOutlined />, null, "/admin/users"),
      getItem(
        "Quản Lý Nhóm",
        "sub3",
        <UsergroupAddOutlined />,
        null,
        "/admin/teams"
      ),
      getItem(
        "Tin Tức",
        "sub4",
        <ReadOutlined />,
        [
          getItem(
            "Tin tức tổng hợp",
            "news_overview",
            <FileTextOutlined />,
            null,
            "/admin/news/overview"
          ),
          getItem(
            "Thông tin hạng mục",
            "news_category",
            <FileTextOutlined />,
            null,
            "/admin/news/category"
          ),
        ],
        null
      ),
      getItem("Tiêu chí", "sub5", <BookOutlined />, null, "/admin/criteria"),
      getItem(
        "Giống Koi",
        "sub6",
        <ContainerOutlined />,
        null,
        "/admin/variety"
      ),
    ],
    []
  );

  const fetchUserCallback = useCallback(() => {
    if (userId) {
      fetchUserInfo(userId);
    }
  }, [fetchUserInfo, userId]);

  useEffect(() => {
    fetchUserCallback();
  }, [fetchUserCallback]);

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
    <Layout className="min-h-screen">
      <Sider
        width={230}
        breakpoint="lg"
        collapsedWidth={isMobile ? "0" : "70"}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        className="fixed h-full z-10 shadow-md"
        trigger={null}
      >
        <div className="flex justify-center py-4">
          <img
            className={`object-cover select-none transition-all duration-300 ${collapsed ? "w-10 h-10" : "w-1/2"}`}
            src={logo}
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

      <Layout
        className={`transition-all duration-300 ${collapsed ? "ml-[70px]" : "ml-[230px]"} ${isMobile && collapsed ? "ml-0" : ""}`}
      >
        <header className="header pr-4 flex justify-between items-center fixed z-50 h-16 backdrop-blur-[5px] bg-[#f9fafba8] transition duration-200 ease-in-out w-full">
          <div className="pl-4">
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                className: "text-xl cursor-pointer",
                onClick: () => setCollapsed(!collapsed),
              }
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="">
              <img
                src="https://i.pinimg.com/474x/88/6b/91/886b91d5032c6c2e824a5c4daad32144.jpg"
                alt="User Avatar"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <strong className="text-sm md:text-base">
                {userInfo?.fullName}
              </strong>
              <Link
                to="#"
                onClick={handleLogout}
                className="text-[#65b3fd] hover:underline text-xs md:text-sm"
              >
                Đăng xuất
              </Link>
            </div>
          </div>
        </header>

        <Content className="mt-[70px] px-4 py-5">{children}</Content>
      </Layout>
    </Layout>
  );
});

AdminDashboard.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminDashboard;
