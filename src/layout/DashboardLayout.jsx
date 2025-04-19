import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layout,
  Menu,
  notification,
  Modal,
  Form,
  Input,
  Button,
  Upload,
  Dropdown,
  Avatar,
  Space,
  Divider,
  Card,
  Typography,
  Row,
  Col,
} from "antd";
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
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  LockOutlined,
  PlusOutlined,
  DownOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAccountTeam from "../hooks/useAccountTeam";
import logo from "../assets/file.png";
import SignalRService from "../config/signalRService";

const { Sider, Content } = Layout;
const { Text } = Typography;

const getItem = (label, key, icon, children, path) => {
  const item = {
    key,
    icon,
    children,
    label: path ? <Link to={path}>{label}</Link> : label,
  };

  return item;
};

const DashboardLayout = React.memo(({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { infoUser, fetchUserInfo, logout, checkAccountStatus } = useAuth();
  const { updateAccountPassword, updateAccountTeam } = useAccountTeam();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const navigate = useNavigate();
  const userId = Cookies.get("__id");
  const userRole = Cookies.get("__role");
  const userInfo = infoUser?.data;
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");

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

  // Thiết lập kiểm tra trạng thái tài khoản định kỳ
  useEffect(() => {
    // Kiểm tra trạng thái tài khoản ngay khi component được mount
    checkAccountStatus();

    // Thiết lập interval để kiểm tra định kỳ (2 phút một lần)
    const statusCheckInterval = setInterval(
      () => {
        checkAccountStatus();
      },
      2 * 60 * 1000
    ); // 2 phút

    // Xóa interval khi component unmount
    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [checkAccountStatus]);

  // Thiết lập SignalR cho tất cả vai trò
  useEffect(() => {
    // Bắt đầu kết nối với SignalR khi component được mount
    SignalRService.start()
      .then(() => {
        console.log("SignalR kết nối thành công");
      })
      .catch((err) => {
        console.error("Lỗi kết nối SignalR:", err);
      });

    // Cleanup khi component unmount
    return () => {
      // Ngắt kết nối có thể được thực hiện trong tương lai nếu cần
    };
  }, []);

  // Menu items cho Admin
  const adminItems = useMemo(
    () => [
      getItem("Tổng Quan", "1", <HomeOutlined />, null, "/admin/overview"),
      getItem(
        "Triển Lãm Của Tôi",
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
            "Chuyên mục",
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

  // Menu items cho Manager
  const managerItems = useMemo(
    () => [
      getItem(
        "Triển Lãm Của Tôi",
        "1",
        <CalendarOutlined />,
        null,
        "/manager/showList"
      ),
      getItem(
        "Quản Lý Nhóm",
        "2",
        <UsergroupAddOutlined />,
        null,
        "/manager/teams"
      ),
      getItem("Tin Tức", "3", <ReadOutlined />, null, "/manager/news"),
    ],
    []
  );

  // Menu items cho Staff
  const staffItems = useMemo(
    () => [
      getItem(
        "Triển Lãm Của Tôi",
        "1",
        <CalendarOutlined />,
        null,
        "/staff/showList"
      ),
      getItem("Tin Tức", "2", <ReadOutlined />, null, "/staff/news"),
    ],
    []
  );

  // Menu items cho Referee
  const refereeItems = useMemo(
    () => [
      getItem(
        "Triển Lãm Của Tôi",
        "1",
        <CalendarOutlined />,
        null,
        "/referee/showList"
      ),
      getItem("Tin Tức", "2", <ReadOutlined />, null, "/referee/news"),
    ],
    []
  );

  // Xác định menu items dựa trên vai trò
  const getMenuItemsByRole = () => {
    switch (userRole) {
      case "Admin":
        return adminItems;
      case "Manager":
        return managerItems;
      case "Staff":
        return staffItems;
      case "Referee":
        return refereeItems;
      default:
        return []; // Trả về menu trống nếu không xác định được vai trò
    }
  };

  const fetchUserCallback = useCallback(() => {
    if (userId) {
      fetchUserInfo(userId);
    }
  }, [fetchUserInfo, userId]);

  useEffect(() => {
    fetchUserCallback();
  }, [fetchUserCallback]);

  const handleLogout = () => {
    // Gọi hàm logout từ hook (giả định rằng notification đã được xử lý trong hook)
    logout();
    // Chuyển hướng về trang đăng nhập
    navigate("/");
  };

  // Xác định đường dẫn dashboard dựa vào vai trò
  const getDashboardPath = () => {
    switch (userRole) {
      case "admin":
        return "/admin";
      case "manager":
        return "/manager";
      case "staff":
        return "/staff";
      case "referee":
        return "/referee";
      default:
        return "/";
    }
  };

  // Mở modal chỉnh sửa thông tin cá nhân
  const showProfileModal = () => {
    if (userInfo) {
      setAvatarUrl(userInfo.avatar || "");

      // Nếu có avatar, hiển thị trong danh sách uploaded
      if (userInfo.avatar) {
        setUploadedAvatar([
          {
            uid: "-1",
            name: "avatar.png",
            status: "done",
            url: userInfo.avatar,
          },
        ]);
      } else {
        setUploadedAvatar([]);
      }

      // Reset form với đúng tên trường theo Form.Item
      profileForm.setFieldsValue({
        FullName: userInfo.fullName,
        Username: userInfo.username,
        Phone: userInfo.phone,
      });
    }
    setIsEditMode(false);
    setIsProfileModalVisible(true);
  };

  // Chuyển sang chế độ chỉnh sửa
  const enableEditMode = () => {
    setIsEditMode(true);
  };

  // Đóng modal chỉnh sửa thông tin cá nhân
  const handleProfileCancel = () => {
    setIsProfileModalVisible(false);
    setIsEditMode(false);
    profileForm.resetFields();
  };

  // Đóng modal đổi mật khẩu
  const handlePasswordCancel = () => {
    setIsPasswordModalVisible(false);
    passwordForm.resetFields();
  };

  // Xử lý đổi mật khẩu
  const handlePasswordChange = async (values) => {
    setIsSubmitting(true);

    try {
      if (values.newPassword !== values.confirmNewPassword) {
        notification.error({
          message: "Lỗi",
          description: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp!",
        });
        setIsSubmitting(false);
        return;
      }

      // Gọi API đổi mật khẩu - notification được xử lý trong hook
      const response = await updateAccountPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });

      // Chỉ xử lý UI nếu thành công
      if (response.success) {
        setIsPasswordModalVisible(false);
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      // Không cần hiển thị notification ở đây, đã được xử lý trong hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thêm hàm urlToBlob để chuyển URL thành File
  const urlToBlob = async (url) => {
    try {
      console.log("🔄 Đang tải ảnh từ URL:", url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Không thể tải ảnh từ URL!");
      }

      const blob = await response.blob();
      return new File([blob], "avatar.jpg", { type: blob.type });
    } catch (error) {
      console.error("🚨 Lỗi khi chuyển URL thành file:", error);
      return null;
    }
  };

  // Sửa hàm xử lý upload ảnh để lưu trữ file gốc thay vì upload lên Cloudinary
  const handleAvatarUpload = ({ fileList }) => {
    if (fileList.length > 0) {
      // Xóa ảnh cũ trước khi cập nhật
      setUploadedAvatar(fileList);
      // Hiển thị preview
      const file = fileList[0];
      if (file.originFileObj) {
        const previewUrl = URL.createObjectURL(file.originFileObj);
        // Lưu trữ file để sử dụng khi cập nhật
        setAvatarUrl(previewUrl);
      } else if (file.url) {
        setAvatarUrl(file.url);
      }
    } else {
      setUploadedAvatar([]);
      setAvatarUrl("");
    }
  };

  // Sửa hàm xử lý cập nhật profile để sử dụng FormData và gửi file trực tiếp
  const handleProfileUpdate = async (values) => {
    setIsProfileSubmitting(true);

    try {
      console.log("Giá trị form trước khi tạo FormData:", values);

      // Kiểm tra các trường bắt buộc
      if (!values.FullName || !values.Username || !values.Phone) {
        // Không cần hiển thị notification ở đây, chỉ trả về để tránh gọi API
        setIsProfileSubmitting(false);
        return;
      }

      // Tạo FormData
      const formData = new FormData();

      // Thêm các trường thông tin với đầy đủ giá trị
      formData.append("FullName", values.FullName);
      formData.append("Username", values.Username);
      formData.append("Phone", values.Phone);

      // Xử lý ảnh đại diện
      let avatarFile = null;

      if (uploadedAvatar.length > 0 && uploadedAvatar[0].originFileObj) {
        // Nếu có file mới upload
        avatarFile = uploadedAvatar[0].originFileObj;
      } else if (userInfo?.avatar) {
        // Nếu dùng ảnh cũ từ URL
        avatarFile = await urlToBlob(userInfo.avatar);
      }

      if (avatarFile) {
        formData.append("AvatarUrl", avatarFile);
      }

      // Log rõ ràng các giá trị trong FormData
      console.log("🔥 FormData được gửi lên:");
      for (let pair of formData.entries()) {
        if (pair[0] === "AvatarUrl") {
          console.log(
            pair[0],
            "File hình ảnh:",
            pair[1].name,
            pair[1].size,
            "bytes",
            pair[1].type
          );
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      // Gọi API cập nhật thông tin - Thông báo được xử lý trong hook
      const response = await updateAccountTeam(userId, formData);
      console.log("Kết quả từ API:", response);

      // Chỉ xử lý UI nếu thành công
      if (response.success) {
        // Cập nhật lại thông tin người dùng
        fetchUserInfo(userId);
        setIsProfileModalVisible(false);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error);
      // Không cần hiển thị notification ở đây, đã được xử lý trong hook
    } finally {
      setIsProfileSubmitting(false);
    }
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
          items={getMenuItemsByRole()}
        />
      </Sider>

      <Layout
        className={`transition-all duration-300 ${collapsed ? "ml-[70px]" : "ml-[230px]"} ${isMobile && collapsed ? "ml-0" : ""}`}
      >
        <header className="header pr-4 flex justify-between items-center fixed z-50 h-16 backdrop-blur-[5px] bg-[#f9fafba8] transition duration-200 ease-in-out w-full shadow-sm">
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
            <Dropdown
              menu={{
                items: [
                  {
                    key: "1",
                    icon: <UserOutlined />,
                    label: "Thông tin cá nhân",
                    onClick: showProfileModal,
                  },
                  {
                    key: "2",
                    icon: <LockOutlined />,
                    label: "Đổi mật khẩu",
                    onClick: () => setIsPasswordModalVisible(true),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "3",
                    icon: <LogoutOutlined />,
                    label: "Đăng xuất",
                    onClick: handleLogout,
                    danger: true,
                  },
                ],
              }}
              placement="bottomRight"
              arrow
            >
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-full transition-all">
                <Avatar
                  size="large"
                  src={
                    userInfo?.avatar ||
                    "https://anhcute.net/wp-content/uploads/2024/08/Tranh-chibi-Capybara-sieu-de-thuong.jpg"
                  }
                  icon={!userInfo?.avatar && <UserOutlined />}
                />
                <div className="flex flex-col">
                  <strong className="text-sm md:text-base">
                    {userInfo?.fullName || "Người dùng"}
                  </strong>
                  <span className="text-gray-500 text-xs">
                    {userRole || "Khách"}
                  </span>
                </div>
                <DownOutlined style={{ fontSize: "12px" }} />
              </div>
            </Dropdown>
          </div>
        </header>

        <Content className="mt-[70px] py-5">{children}</Content>

        {/* Modal Đổi mật khẩu */}
        <Modal
          title="Đổi mật khẩu"
          open={isPasswordModalVisible}
          onCancel={handlePasswordCancel}
          footer={null}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
          >
            <Form.Item
              name="oldPassword"
              label="Mật khẩu hiện tại"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu hiện tại!",
                },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu mới!",
                },
                {
                  min: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự!",
                },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item
              name="confirmNewPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Vui lòng xác nhận mật khẩu mới!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "Mật khẩu xác nhận không khớp với mật khẩu mới!"
                      )
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Xác nhận mật khẩu mới" />
            </Form.Item>

            <Form.Item className="mb-0">
              <div className="flex justify-end gap-2">
                <Button onClick={handlePasswordCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  Đổi mật khẩu
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal Cập nhật thông tin cá nhân */}
        <Modal
          title="Thông tin cá nhân"
          open={isProfileModalVisible}
          onCancel={handleProfileCancel}
          footer={
            isEditMode
              ? null
              : [
                  <Button
                    key="edit"
                    type="primary"
                    onClick={enableEditMode}
                    icon={<EditOutlined />}
                  >
                    Chỉnh sửa
                  </Button>,
                  <Button key="close" onClick={handleProfileCancel}>
                    Đóng
                  </Button>,
                ]
          }
          width={500}
        >
          {isEditMode ? (
            // Chế độ chỉnh sửa
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileUpdate}
              initialValues={
                userInfo
                  ? {
                      FullName: userInfo.fullName,
                      Username: userInfo.userName,
                      Phone: userInfo.phone,
                    }
                  : {}
              }
            >
              <Form.Item label="Ảnh đại diện">
                <div className="flex items-center">
                  <div>
                    <Upload
                      accept=".jpg,.jpeg,.png"
                      listType="picture-card"
                      fileList={uploadedAvatar}
                      onChange={handleAvatarUpload}
                      beforeUpload={() => false}
                      maxCount={1}
                    >
                      {uploadedAvatar.length > 0 ? null : <PlusOutlined />}
                    </Upload>
                  </div>

                  <div>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </Form.Item>

              <Form.Item
                name="FullName"
                label="Họ và tên"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập họ và tên!",
                  },
                ]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item
                name="Username"
                label="Tên đăng nhập"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên đăng nhập!",
                  },
                ]}
              >
                <Input placeholder="Nhập tên đăng nhập" />
              </Form.Item>

              <Form.Item
                name="Phone"
                label="Số điện thoại"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số điện thoại!",
                  },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ!",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end gap-2">
                  <Button onClick={handleProfileCancel}>Hủy</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isProfileSubmitting}
                  >
                    Cập nhật
                  </Button>
                </div>
              </Form.Item>
            </Form>
          ) : (
            // Chế độ xem
            <Card bordered={false}>
              <div className="text-center mb-6">
                <Avatar
                  size={120}
                  src={
                    userInfo?.avatar ||
                    "https://anhcute.net/wp-content/uploads/2024/08/Tranh-chibi-Capybara-sieu-de-thuong.jpg"
                  }
                  icon={!userInfo?.avatar && <UserOutlined />}
                />
                <h2 className="mt-3 text-xl font-bold">{userInfo?.fullName}</h2>
                <Text type="secondary">{userRole || "Khách"}</Text>
              </div>

              <Divider style={{ marginTop: 0 }} />

              <Row className="mb-3">
                <Col span={24}>
                  <Space>
                    <UserOutlined />
                    <Text strong>Tên đăng nhập: </Text>
                  </Space>
                  <Text className="mx-1">
                    {userInfo?.username ?? "Chưa có"}
                  </Text>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col span={24}>
                  <Space>
                    <PhoneOutlined />
                    <Text strong>Số điện thoại: </Text>
                  </Space>
                  <Text className="mx-1">{userInfo?.phone ?? "N/A"}</Text>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col span={24}>
                  <Space>
                    <MailOutlined />
                    <Text strong>Email: </Text>
                  </Space>
                  <Text className="mx-1">{userInfo?.email}</Text>
                </Col>
              </Row>
            </Card>
          )}
        </Modal>
      </Layout>
    </Layout>
  );
});

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
