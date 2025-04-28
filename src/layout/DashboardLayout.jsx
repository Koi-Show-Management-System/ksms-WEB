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
  Tooltip,
  Progress,
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
  CheckCircleFilled,
  CloseCircleFilled,
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
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024
  );
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
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Theo dõi kích thước màn hình để đáp ứng thiết bị
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto collapse sidebar on mobile only
      if (width < 768) {
        setCollapsed(true);
      }
      // On tablet and desktop, keep user preference
      // Only auto-collapse on first load or refresh
      else if (
        width >= 768 &&
        width < 1024 &&
        !localStorage.getItem("sidebarState")
      ) {
        setCollapsed(true);
        localStorage.setItem("sidebarState", "collapsed");
      } else if (width >= 1024 && !localStorage.getItem("sidebarState")) {
        setCollapsed(false);
        localStorage.setItem("sidebarState", "expanded");
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Kiểm tra kích thước ban đầu

    // On first load, try to get user preference
    const savedState = localStorage.getItem("sidebarState");
    if (savedState === "collapsed") {
      setCollapsed(true);
    } else if (savedState === "expanded") {
      setCollapsed(false);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Thêm hàm toggle sidebar riêng
  const toggleSidebar = useCallback(() => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebarState", newState ? "collapsed" : "expanded");
  }, [collapsed]);

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

  // Kiểm tra độ mạnh của mật khẩu
  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password?.length >= 6,
      uppercase: /[A-Z]/.test(password || ""),
      lowercase: /[a-z]/.test(password || ""),
      number: /[0-9]/.test(password || ""),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || ""),
    };

    // Tính số yêu cầu đã đạt được
    const strength = Object.values(requirements).filter(Boolean).length;
    return { strength, requirements };
  };

  // Component hiển thị các yêu cầu mật khẩu
  const PasswordRequirementsList = ({ password }) => {
    // Chỉ hiển thị khi người dùng đã bắt đầu nhập
    if (!password || password.length === 0) {
      return null;
    }

    // Tính toán các yêu cầu ở đây mà không cập nhật state
    const { strength, requirements } = checkPasswordStrength(password);

    // Đếm số lượng yêu cầu chưa được đáp ứng
    const unmetRequirements = Object.values(requirements).filter(
      (req) => !req
    ).length;

    return (
      <div className="mb-2">
        {/* Thanh tiến trình */}
        <div className="">
          <Progress
            percent={strength * 20}
            showInfo={false}
            strokeColor={
              strength < 3 ? "#ff4d4f" : strength < 5 ? "#faad14" : "#52c41a"
            }
            size="small"
          />
        </div>

        {/* Hiển thị status */}
        {strength === 5 ? (
          <div className="text-xs text-green-500 flex items-center">
            <CheckCircleFilled className="mr-1" /> Mật khẩu đáp ứng tất cả yêu
            cầu
          </div>
        ) : (
          <div className="text-xs text-orange-500">
            Còn {unmetRequirements} yêu cầu chưa đáp ứng:
          </div>
        )}

        {/* Chỉ hiển thị các yêu cầu chưa đáp ứng */}
        <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5">
          {!requirements.length && (
            <div className="text-red-500 flex items-center">
              <CloseCircleFilled className="mr-1 text-[10px]" /> Ít nhất 6 ký tự
            </div>
          )}
          {!requirements.uppercase && (
            <div className="text-red-500 flex items-center">
              <CloseCircleFilled className="mr-1 text-[10px]" /> Ít nhất một chữ
              in hoa
            </div>
          )}
          {!requirements.lowercase && (
            <div className="text-red-500 flex items-center">
              <CloseCircleFilled className="mr-1 text-[10px]" /> Ít nhất một chữ
              thường
            </div>
          )}
          {!requirements.number && (
            <div className="text-red-500 flex items-center">
              <CloseCircleFilled className="mr-1 text-[10px]" /> Ít nhất một chữ
              số
            </div>
          )}
          {!requirements.special && (
            <div className="text-red-500 flex items-center">
              <CloseCircleFilled className="mr-1 text-[10px]" /> Ít nhất một ký
              tự đặc biệt
            </div>
          )}
        </div>
      </div>
    );
  };

  // Sửa lại hàm xử lý đổi mật khẩu để kiểm tra tất cả các yêu cầu
  const handlePasswordChange = async (values) => {
    setIsSubmitting(true);

    try {
      const { strength } = checkPasswordStrength(values.newPassword);
      if (strength < 5) {
        notification.error({
          message: "Lỗi",
          description: "Mật khẩu không đáp ứng đủ các yêu cầu về bảo mật!",
        });
        setIsSubmitting(false);
        return;
      }

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
        onCollapse={(value) => {
          setCollapsed(value);
          localStorage.setItem(
            "sidebarState",
            value ? "collapsed" : "expanded"
          );
        }}
        theme="light"
        className="fixed h-full z-10 shadow-md transition-all duration-300 ease-in-out"
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
        className={`transition-all duration-300 ${
          collapsed ? (isMobile ? "ml-0" : "ml-[70px]") : "ml-[230px]"
        }`}
      >
        <header className="header px-4 flex justify-between items-center fixed z-50 h-16 backdrop-blur-[5px] bg-[#f9fafba8] transition duration-200 ease-in-out w-full shadow-sm">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              {collapsed ? (
                <MenuUnfoldOutlined className="text-xl" />
              ) : (
                <MenuFoldOutlined className="text-xl" />
              )}
            </button>
          </div>
          <div className="flex items-center">
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
                  size={isMobile ? "default" : "large"}
                  src={
                    userInfo?.avatar ||
                    "https://anhcute.net/wp-content/uploads/2024/08/Tranh-chibi-Capybara-sieu-de-thuong.jpg"
                  }
                  icon={!userInfo?.avatar && <UserOutlined />}
                />
                <div
                  className={`flex flex-col ${isMobile ? "hidden" : "block"}`}
                >
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

        <Content className="mt-[70px] p-4 md:p-5 transition-all duration-300">
          {children}
        </Content>

        {/* Modal Đổi mật khẩu */}
        <Modal
          title="Đổi mật khẩu"
          open={isPasswordModalVisible}
          onCancel={handlePasswordCancel}
          footer={null}
          width={isMobile ? "90%" : 520}
          centered
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            className="max-w-full"
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
                  validator: (_, value) => {
                    const { strength } = checkPasswordStrength(value);
                    return strength === 5
                      ? Promise.resolve()
                      : Promise.resolve(); // Vẫn cho phép submit nhưng hiển thị trạng thái yêu cầu
                  },
                },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) => (
                <PasswordRequirementsList
                  password={getFieldValue("newPassword")}
                />
              )}
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
              <div className="flex flex-wrap justify-end gap-2">
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
          width={isMobile ? "95%" : isTablet ? "80%" : 500}
          centered
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
              className="max-w-full"
            >
              <Form.Item label="Ảnh đại diện">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                <div className="flex flex-wrap justify-end gap-2">
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
            <Card bordered={false} className="overflow-hidden">
              <div className="text-center mb-6">
                <Avatar
                  size={isMobile ? 100 : 120}
                  src={
                    userInfo?.avatar ||
                    "https://anhcute.net/wp-content/uploads/2024/08/Tranh-chibi-Capybara-sieu-de-thuong.jpg"
                  }
                  icon={!userInfo?.avatar && <UserOutlined />}
                />
                <h2 className="mt-3 text-lg md:text-xl font-bold break-words">
                  {userInfo?.fullName}
                </h2>
                <Text type="secondary">{userRole || "Khách"}</Text>
              </div>

              <Divider style={{ marginTop: 0 }} />

              <Row className="mb-3">
                <Col span={24}>
                  <Space className="flex-wrap" align="start">
                    <UserOutlined className="mt-1" />
                    <div>
                      <Text strong>Tên đăng nhập: </Text>
                      <Text className="break-all">
                        {userInfo?.username ?? "Chưa có"}
                      </Text>
                    </div>
                  </Space>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col span={24}>
                  <Space className="flex-wrap" align="start">
                    <PhoneOutlined className="mt-1" />
                    <div>
                      <Text strong>Số điện thoại: </Text>
                      <Text>{userInfo?.phone ?? "N/A"}</Text>
                    </div>
                  </Space>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col span={24}>
                  <Space className="flex-wrap" align="start">
                    <MailOutlined className="mt-1" />
                    <div>
                      <Text strong>Email: </Text>
                      <Text className="break-all">{userInfo?.email}</Text>
                    </div>
                  </Space>
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
