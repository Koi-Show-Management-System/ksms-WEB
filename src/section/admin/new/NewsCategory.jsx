import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  Pagination,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import useBlog from "../../../hooks/useBlog";

function NewsCategory() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const {
    blogCategory,
    getBlogCategory,
    createBlogCategory,
    updateBlogCategory,
  } = useBlog();

  // Đảm bảo blogCategory luôn là mảng
  const categories = Array.isArray(blogCategory) ? blogCategory : [];

  // Lọc hạng mục theo từ khóa tìm kiếm
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchText.toLowerCase()) ||
      category.description.toLowerCase().includes(searchText.toLowerCase())
  );

  // Phân trang dữ liệu
  const paginatedData = filteredCategories.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  useEffect(() => {
    getBlogCategory();
  }, []);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const showModal = (record = null) => {
    setEditingCategory(record);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        description: record.description,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let result;

      if (editingCategory) {
        result = await updateBlogCategory(editingCategory.id, values);
      } else {
        result = await createBlogCategory(values);
      }

      if (result.success) {
        setIsModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const columns = [
    {
      title: "Tên chuyên mục",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            className="text-gray-500 hover:text-blue-500"
          />
          {/* <Popconfirm
            title="Bạn có chắc chắn muốn xóa hạng mục này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm> */}
        </Space>
      ),
    },
  ];

  const handleDelete = async (id) => {
    try {
      // Nếu API có endpoint xóa, hãy sử dụng nó ở đây
      getBlogCategory();
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm kiếm chuyên mục..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Thêm chuyên mục
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={paginatedData}
        rowKey="id"
        loading={categories.length === 0}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredCategories.length,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingCategory ? "Chỉnh sửa chuyên mục" : "Thêm chuyên mục mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText={editingCategory ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên chuyên mục"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên chuyên mục!",
              },
            ]}
          >
            <Input placeholder="Nhập tên chuyên mục" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mô tả!",
              },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả chuyên mục" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default NewsCategory;
