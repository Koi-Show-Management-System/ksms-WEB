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
  Form,
  Select,
  Upload,
  Tooltip,
  Typography,
  Divider,
  Image,
  Avatar,
  Space,
  notification,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  UploadOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useBlog from "../../../hooks/useBlog";
import { formatDate } from "../../../util/dateUtils";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// Modules và các tùy chọn cho React Quill
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    [{ color: [] }],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "link",
  "image",
  "color",
];

const NewsOverview = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create" hoặc "edit"
  const [editingBlog, setEditingBlog] = useState(null);
  const [viewingBlog, setViewingBlog] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    createBlog,
    updateBlog,
    deleteBlog,
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

  const showCreateModal = () => {
    setModalType("create");
    setEditingBlog(null);
    setFileList([]);
    setUploadedImageUrl("");
    setEditorContent("");
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (blog) => {
    setModalType("edit");
    setEditingBlog(blog);

    form.setFieldsValue({
      title: blog.title,
      blogCategoryId: blog.blogCategory?.id,
    });

    // Thiết lập nội dung editor
    setEditorContent(blog.content || "");

    if (blog.imgUrl) {
      setUploadedImageUrl(blog.imgUrl);
      setFileList([
        {
          uid: "-1",
          name: "image.png",
          status: "done",
          url: blog.imgUrl,
        },
      ]);
    } else {
      setFileList([]);
      setUploadedImageUrl("");
    }

    setIsModalVisible(true);
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

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditorContent("");
    setIsSubmitting(false);
  };

  const handleDetailCancel = () => {
    setIsDetailModalVisible(false);
    setViewingBlog(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();

      // Kiểm tra nội dung
      if (!editorContent || editorContent === "<p><br></p>") {
        Modal.error({
          title: "Lỗi",
          content: "Vui lòng nhập nội dung tin tức",
        });
        setIsSubmitting(false);
        return;
      }

      const blogData = {
        ...values,
        content: editorContent,
        imgUrl: uploadedImageUrl || "string",
      };

      let result;
      if (modalType === "create") {
        result = await createBlog(blogData);
      } else {
        result = await updateBlog(editingBlog.id, blogData);
      }

      if (result.success) {
        setIsModalVisible(false);
        form.resetFields();
        setEditorContent("");

        // Tải lại danh sách tin tức sau khi tạo/cập nhật thành công
        await getBlogs(currentPage, pageSize);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa tin tức này?",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const result = await deleteBlog(id);
          if (result.success) {
            // Tải lại danh sách tin tức sau khi xóa
            await getBlogs(currentPage, pageSize);
          }
        } catch (error) {
          console.error("Lỗi khi xóa:", error);
        }
      },
    });
  };

  const handleImageUpload = async ({ fileList }) => {
    try {
      if (fileList.length === 0) {
        setUploadedImageUrl("");
        setFileList([]);
        return;
      }

      const file = fileList[0];

      // Nếu đã có URL (ảnh đã upload trước đó)
      if (file.url && !file.originFileObj) {
        setUploadedImageUrl(file.url);
        setFileList(fileList);
        return;
      }

      // Upload lên Cloudinary
      if (file.originFileObj) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file.originFileObj);
        formData.append("upload_preset", "ml_default");

        try {
          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dphupjpqt/image/upload",
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.error("Lỗi tải ảnh lên Cloudinary:", data);
            notification.error({
              message: "Lỗi",
              description: "Không thể tải ảnh lên. Vui lòng thử lại!",
            });
            setFileList([]);
            setIsUploading(false);
            return;
          }

          const imageUrl = data.secure_url;
          setUploadedImageUrl(imageUrl);

          setFileList([
            {
              uid: file.uid,
              name: file.name,
              status: "done",
              url: imageUrl,
            },
          ]);

          notification.success({
            message: "Thành công",
            description: "Tải ảnh lên thành công!",
          });
        } catch (error) {
          console.error("Lỗi tải ảnh:", error);
          notification.error({
            message: "Lỗi",
            description: "Lỗi khi tải ảnh lên! Vui lòng thử lại.",
          });
          setFileList([]);
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      setIsUploading(false);
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi tải ảnh lên! Vui lòng thử lại.",
      });
    }
  };

  const uploadProps = {
    accept: ".jpg,.jpeg,.png",
    listType: "picture-card",
    fileList,
    onChange: handleImageUpload,
    onRemove: () => {
      setFileList([]);
      setUploadedImageUrl("");
    },
    beforeUpload: () => false, // Ngăn upload mặc định
    maxCount: 1,
    disabled: isUploading,
  };

  const handleEditorChange = (content) => {
    setEditorContent(content);
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
    <div className="news-container p-4">
      {/* Header với tìm kiếm và các nút lọc */}
      <div className="header-actions mb-6 flex flex-col md:flex-row md:justify-between gap-5">
        <div className="search-and-filter flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <Input
            placeholder="Tìm kiếm tin tức..."
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            value={searchText}
            style={{ width: "100%", maxWidth: "300px" }}
            allowClear
          />

          <Select
            placeholder="Lọc theo danh mục"
            value={selectedCategory}
            onChange={handleCategoryChange}
            allowClear
            style={{ width: "100%", maxWidth: "300px" }}
          >
            <Select.Option value="">Tất cả chuyên mục</Select.Option>
            {blogCategory.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
          className="mt-3 md:mt-0"
        >
          Thêm tin mới
        </Button>
      </div>

      {/* Hiển thị tin tức dạng lưới */}
      <Spin spinning={isLoadingBlogs} tip="Đang tải...">
        {filteredBlogs.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredBlogs.map((blog) => (
              <Col xs={24} sm={12} md={12} lg={8} xl={8} key={blog.id}>
                <Card
                  hoverable
                  className="news-card h-full"
                  cover={
                    <div
                      className="news-card-image-container"
                      style={{ height: 180, overflow: "hidden" }}
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
                        <Tooltip title="Chỉnh sửa">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              showEditModal(blog);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(blog.id);
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
        width={"95%"}
        style={{ maxWidth: "900px" }}
        footer={[
          <Button key="close" onClick={handleDetailCancel}>
            Đóng
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              handleDetailCancel();
              showEditModal(viewingBlog);
            }}
          >
            Chỉnh sửa
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

      {/* Modal tạo/chỉnh sửa tin tức */}
      <Modal
        title={modalType === "create" ? "Tạo tin tức mới" : "Chỉnh sửa tin tức"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {modalType === "create" ? "Tạo" : "Cập nhật"}
          </Button>,
        ]}
        width={"95%"}
        style={{ maxWidth: "900px" }}
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề tin tức" />
          </Form.Item>

          <Form.Item
            name="blogCategoryId"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select placeholder="Chọn danh mục">
              {blogCategory.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Hình ảnh">
            <Upload {...uploadProps} className="upload-container">
              {fileList.length < 1 && !isUploading && (
                <div>
                  <UploadOutlined />
                  <div className="mt-2">Tải ảnh lên</div>
                </div>
              )}
              {isUploading && <div>Đang tải...</div>}
            </Upload>
          </Form.Item>

          <Form.Item label="Nội dung" required tooltip="Nội dung tin tức">
            <ReactQuill
              theme="snow"
              value={editorContent}
              onChange={handleEditorChange}
              modules={modules}
              formats={formats}
              style={{ height: "300px", marginBottom: "50px" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NewsOverview;
