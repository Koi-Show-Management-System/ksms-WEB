import React, { useState } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Select,
  Typography,
  Form,
  Modal,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

function Category() {
  const [searchText, setSearchText] = useState("");
  const [filterVariety, setFilterVariety] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [data, setData] = useState([
    {
      key: "1",
      categoryName: "Mini Kohaku",
      sizeCategory: "Dưới 20 cm",
      variety: "Kohaku",
      participatingKoi: 120,
      status: "Hoạt động",
    },
    {
      key: "2",
      categoryName: "Standard Showa",
      sizeCategory: "20-30 cm",
      variety: "Showa",
      participatingKoi: 80,
      status: "Không hoạt động",
    },
    {
      key: "3",
      categoryName: "Premium Taisho Sanke",
      sizeCategory: "30-50 cm",
      variety: "Sanke",
      participatingKoi: 50,
      status: "Hoạt động",
    },
  ]);

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const handleFilterVariety = (value) => {
    setFilterVariety(value);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleCreate = (values) => {
    const newCategory = {
      key: String(data.length + 1),
      ...values,
      participatingKoi: 0,
    };
    setData([...data, newCategory]);
    setIsModalVisible(false);
    form.resetFields();
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.categoryName.toLowerCase().includes(searchText) ||
      item.sizeCategory.toLowerCase().includes(searchText) ||
      item.variety.toLowerCase().includes(searchText);
    const matchesVariety = filterVariety
      ? item.variety === filterVariety
      : true;
    return matchesSearch && matchesVariety;
  });

  const columns = [
    {
      title: "Tên Danh Mục",
      dataIndex: "categoryName",
      key: "categoryName",
      sorter: (a, b) => a.categoryName.localeCompare(b.categoryName),
    },
    {
      title: "Danh Mục Kích Thước",
      dataIndex: "sizeCategory",
      key: "sizeCategory",
      sorter: (a, b) => a.sizeCategory.localeCompare(b.sizeCategory),
    },
    {
      title: "Giống",
      dataIndex: "variety",
      key: "variety",
      filters: [
        { text: "Kohaku", value: "Kohaku" },
        { text: "Showa", value: "Showa" },
        { text: "Sanke", value: "Sanke" },
      ],
      onFilter: (value, record) => record.variety === value,
    },
    {
      title: "Số Cá Koi Tham Gia",
      dataIndex: "participatingKoi",
      key: "participatingKoi",
      sorter: (a, b) => a.participatingKoi - b.participatingKoi,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "Hoạt động" ? "green" : "red"}
          className="rounded-full px-3 py-1"
        >
          {status}
        </Tag>
      ),
      filters: [
        { text: "Hoạt động", value: "Hoạt động" },
        { text: "Không hoạt động", value: "Không hoạt động" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-gray-500 hover:text-blue-500"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-gray-500 hover:text-red-500"
            danger
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center space-x-2 mb-2 md:mb-0">
          <Search
            placeholder="Tìm kiếm danh mục..."
            onSearch={handleSearch}
            className="w-full md:w-64"
            allowClear
          />
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showModal}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Tạo mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{ pageSize: 5 }}
        className="bg-white rounded-lg"
      />

      <Modal
        title="Tạo Danh Mục Mới"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="categoryName"
            label="Tên Danh Mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            name="sizeCategory"
            label="Danh Mục Kích Thước"
            rules={[
              { required: true, message: "Vui lòng chọn danh mục kích thước!" },
            ]}
          >
            <Select placeholder="Chọn danh mục kích thước">
              <Option value="Dưới 20 cm">Dưới 20 cm</Option>
              <Option value="20-30 cm">20-30 cm</Option>
              <Option value="30-50 cm">30-50 cm</Option>
              <Option value="Trên 50 cm">Trên 50 cm</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="variety"
            label="Giống"
            rules={[{ required: true, message: "Vui lòng chọn giống!" }]}
          >
            <Select placeholder="Chọn giống">
              <Option value="Kohaku">Kohaku</Option>
              <Option value="Showa">Showa</Option>
              <Option value="Sanke">Sanke</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng Thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="Hoạt động">Hoạt động</Option>
              <Option value="Không hoạt động">Không hoạt động</Option>
            </Select>
          </Form.Item>

          <Form.Item className="flex justify-end mb-0">
            <Button onClick={handleCancel} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-blue-500">
              Tạo mới
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
export default Category;
