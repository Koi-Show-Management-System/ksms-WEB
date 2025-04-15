import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Card,
  Tag,
  Row,
  Col,
  Pagination,
  Empty,
  Spin,
  Modal,
  Typography,
  Divider,
  Image,
  Avatar,
  Space,
  Select,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useBlog from "../../../hooks/useBlog";
import { formatDate } from "../../../util/dateUtils";
import "react-quill/dist/quill.snow.css";

const { Title, Text, Paragraph } = Typography;

const New = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [viewingBlog, setViewingBlog] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Sử dụng hook useBlog
  const {
    blogs,
    totalBlogs,
    currentPage,
    pageSize,
    isLoadingBlogs,
    blogCategory,
    getBlogs,
    getBlogCategory,
    getBlogDetail,
    currentBlog,
  } = useBlog();

  useEffect(() => {
    getBlogs(1, 10);
    getBlogCategory();
  }, []);

  // Lọc blogs theo searchText và danh mục
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = blog.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory
      ? blog.blogCategory?.id === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handlePageChange = (page, pageSize) => {
    getBlogs(page, pageSize);
  };

  const showDetailModal = async (blog) => {
    setViewingBlog(blog);
    setIsDetailModalVisible(true);

    // Tải chi tiết blog nếu cần
    if (blog.id) {
      const result = await getBlogDetail(blog.id);
      if (result.success) {
        setViewingBlog(result.data);
      }
    }
  };

  const handleDetailCancel = () => {
    setIsDetailModalVisible(false);
    setViewingBlog(null);
  };

  // Hàm hiển thị nội dung HTML trong card
  const renderContentPreview = (content) => {
    if (!content) return "";

    // Chỉ hiển thị văn bản thuần túy, loại bỏ các thẻ HTML
    const tempElement = document.createElement("div");
    tempElement.innerHTML = content;
    const text = tempElement.textContent || tempElement.innerText || "";

    // Giới hạn đoạn text ở 100 ký tự
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  };

  return (
    <div className="news-container">
      {/* Header với tìm kiếm và các nút lọc */}
      <div className="header-actions mb-6 flex flex-wrap justify-between gap-5">
        <div className="search-and-filter flex flex-wrap items-center gap-3 flex-grow">
          <Input
            placeholder="Tìm kiếm tin tức..."
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            value={searchText}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            placeholder="Lọc theo danh mục"
            value={selectedCategory}
            onChange={handleCategoryChange}
            allowClear
          >
            <Select.Option value="">Tất cả danh mục</Select.Option>
            {blogCategory.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Hiển thị tin tức dạng lưới */}
      <Spin spinning={isLoadingBlogs} tip="Đang tải...">
        {filteredBlogs.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filteredBlogs.map((blog) => (
              <Col xs={24} sm={12} md={8} lg={8} xl={8} key={blog.id}>
                <Card
                  hoverable
                  className="news-card h-full"
                  cover={
                    <div
                      className="news-card-image-container"
                      style={{ height: 200, overflow: "hidden" }}
                    >
                      <img
                        alt={blog.title}
                        src={
                          blog.imgUrl || "https://via.placeholder.com/400x250"
                        }
                        className="news-card-image w-full h-full object-cover"
                      />
                    </div>
                  }
                  onClick={() => showDetailModal(blog)}
                  style={{
                    maxWidth: "100%",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <Tag color="blue" className="mb-2">
                      {blog.blogCategory?.name || "Không phân loại"}
                    </Tag>

                    <div className="news-card-actions flex justify-end">
                      <Space>
                        <Tooltip title="Xem chi tiết">
                          <Button
                            type="text"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              showDetailModal(blog);
                            }}
                          />
                        </Tooltip>
                      </Space>
                    </div>
                  </div>

                  <Card.Meta
                    title={
                      <div
                        className="text-lg break-words"
                        style={{
                          whiteSpace: "normal",
                          lineHeight: "1.5",
                          overflow: "visible",
                        }}
                      >
                        {blog.title}
                      </div>
                    }
                    description={
                      <div
                        className="text-base"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {renderContentPreview(blog.content)}
                      </div>
                    }
                    className="mb-3"
                  />

                  <div className="news-card-footer flex items-center justify-between mt-3 text-gray-500 text-sm">
                    <div className="flex items-center">
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        className="mr-1"
                      />
                      <span>{blog.account?.fullName || "Quản trị viên"}</span>
                    </div>
                    <div className="flex items-center">
                      <ClockCircleOutlined className="mr-1" />
                      <span>
                        {blog.createdAt ? formatDate(blog.createdAt) : ""}
                      </span>
                    </div>
                  </div>

                  <Divider style={{ margin: "12px 0" }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Không có tin tức nào" />
        )}
      </Spin>

      {/* Phân trang */}
      {filteredBlogs.length > 0 && (
        <div className="pagination-container mt-6 flex justify-end">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalBlogs}
            onChange={handlePageChange}
            showSizeChanger
            showTotal={(total) => `${total} bài viết`}
          />
        </div>
      )}

      {/* Modal xem chi tiết tin tức */}
      <Modal
        title={null}
        open={isDetailModalVisible}
        onCancel={handleDetailCancel}
        width={900}
        footer={[
          <Button key="close" onClick={handleDetailCancel}>
            Đóng
          </Button>,
        ]}
      >
        {viewingBlog && (
          <div className="blog-detail">
            <Title level={3} className="mb-4">
              {viewingBlog.title}
            </Title>

            <Space className="mb-4 text-gray-500">
              <Tag color="blue">
                {viewingBlog.blogCategory?.name || "Không phân loại"}
              </Tag>
              <span>
                <UserOutlined className="mr-1" />
                {viewingBlog.account?.fullName || "Quản trị viên"}
              </span>
              <span>
                <CalendarOutlined className="mr-1" />
                {viewingBlog.createdAt ? formatDate(viewingBlog.createdAt) : ""}
              </span>
            </Space>

            {viewingBlog.imgUrl && (
              <div className="mb-4">
                <Image
                  src={viewingBlog.imgUrl}
                  alt={viewingBlog.title}
                  style={{ maxWidth: "100%" }}
                />
              </div>
            )}

            <Divider />

            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: viewingBlog.content }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default New;
