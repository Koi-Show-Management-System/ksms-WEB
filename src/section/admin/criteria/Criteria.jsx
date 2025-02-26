import React, { useState } from "react";
import { Table, Input, Button, Modal, Form } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const Criteria = () => {
  const [criteriaData, setCriteriaData] = useState([
    {
      key: 1,
      name: "Màu sắc",
      description: "Đánh giá chất lượng màu sắc của cá",
    },
    {
      key: 2,
      name: "Hình dáng cơ thể",
      description: "Đánh giá hình dáng tổng thể của cá",
    },
    { key: 3, name: "Hoa văn", description: "Đánh giá hoa văn trên thân cá" },
    { key: 4, name: "Kích thước", description: "Đánh giá kích thước của cá" },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState(null);
  const [form] = Form.useForm();

  const showModal = (criteria = null) => {
    if (criteria) {
      setCurrentCriteria(criteria);
      form.setFieldsValue(criteria);
    } else {
      setCurrentCriteria(null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSave = (values) => {
    if (currentCriteria) {
      const updatedData = criteriaData.map((item) =>
        item.key === currentCriteria.key ? { ...item, ...values } : item
      );
      setCriteriaData(updatedData);
    } else {
      const newKey = criteriaData.length + 1;
      setCriteriaData([...criteriaData, { key: newKey, ...values }]);
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleDelete = (key) => {
    const updatedData = criteriaData.filter((item) => item.key !== key);
    setCriteriaData(updatedData);
  };

  const columns = [
    {
      title: "Tên Tiêu Chí",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name), // Thêm chức năng sắp xếp
    },
    {
      title: "Mô Tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          {/* Nút Sửa */}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            className="text-gray-500 hover:text-blue-500"
          />
          {/* Nút Xóa */}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
            className="text-gray-500 hover:text-red-500"
            danger
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className=" flex justify-end relative top-[-40px] right-0">
        <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
          Thêm mới
        </Button>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-md">
        <Table
          columns={columns}
          dataSource={criteriaData}
          pagination={{ pageSize: 5 }}
          rowKey="key"
        />

        <Modal
          title={currentCriteria ? "Cập Nhật Tiêu Chí" : "Thêm Tiêu Chí"}
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{}}
          >
            <Form.Item
              name="name"
              label="Tên Tiêu Chí"
              rules={[
                { required: true, message: "Vui lòng nhập tên tiêu chí!" },
              ]}
            >
              <Input placeholder="Nhập tên tiêu chí" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô Tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
            >
              <Input placeholder="Nhập mô tả tiêu chí" />
            </Form.Item>

            <div className="flex justify-end">
              <Button onClick={handleCancel} className="mr-2">
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {currentCriteria ? "Cập Nhật" : "Thêm"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Criteria;
