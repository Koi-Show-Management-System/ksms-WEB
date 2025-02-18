import { useState } from "react";
import {
  SettingOutlined,
  UsergroupAddOutlined,
  HomeOutlined,
  CalendarOutlined,
  FileMarkdownOutlined,
  BankOutlined,
  BookOutlined,
  FileSearchOutlined,
  UserAddOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";

import PropTypes from "prop-types";
import { Link } from "react-router-dom";
const { Content, Sider, Footer } = Layout;
function getItem(label, key, icon, children, path) {
  return {
    key,
    icon,
    children,
    label,
    path,
  };
}
const items = [
  getItem("Overview", "1", <HomeOutlined />, null, "/admin/overview"),
  getItem("Koi Show", "sub1", <CalendarOutlined />, [
    getItem("Show List", "2", null, null, "/admin/showList"),
    getItem("My Show", "3", null, null, "/admin/myShow"),
  ]),
  getItem("Users", "sub2", <UserAddOutlined />, null, "/admin/users"),
  //   [
  //     getItem("User List", "5", null, null, "/users/list"),
  //     getItem("User Roles", "6", null, null, "/users/roles"),
  //   ]),
  getItem(
    "Team Management",
    "sub3",
    <UsergroupAddOutlined />,
    null,
    "/admin/teams"
  ),
  //     [
  //     // getItem("Teams", "7", null, null, "/teams"),
  //     // getItem("Members", "8", null, null, "/members"),
  //     // getItem("Assignments", "9", null, null, "/assignments"),
  //   ]),
  getItem("News", "sub4", <ReadOutlined />, null, "/admin/news"),
];

console.log(items);

const renderMenuItems = (items) => {
  return items.map((item) => {
    if (item.children && item.children.length > 0) {
      return (
        <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
          {renderMenuItems(item.children)}
        </Menu.SubMenu>
      );
    } else {
      return (
        <Menu.Item key={item.key} icon={item.icon}>
          <Link to={item.path}>{item.label}</Link>
        </Menu.Item>
      );
    }
  });
};

const AdminDashboard = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  AdminDashboard.propTypes = {
    children: PropTypes.node.isRequired,
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
        >
          {renderMenuItems(items)}
        </Menu>
      </Sider>
      <Layout className="overflow-y-auto md:ml-0 ">
        <header className="header mr-3 pr-4 flex justify-end gap-2 items-center fixed z-50 h-16 backdrop-blur-[5px] bg-[#f9fafba8] transition duration-200 ease-in-out">
          <div className="">
            <img
              src="https://i.pinimg.com/474x/ed/b6/e6/edb6e65a8643e81577b46e9192af6810.jpg"
              alt=""
              className="w-[50px] h-[50px] rounded-[50%] border object-cover"
            />
          </div>
          <div className="flex flex-col">
            <strong>Admin</strong>
            <Link to="/" className="text-[#65b3fd] hover:underline">
              Log out
            </Link>
          </div>
        </header>
        <Content className="mt-[80px] mx-4 ">{children}</Content>
      </Layout>
    </Layout>
  );
};
export default AdminDashboard;
