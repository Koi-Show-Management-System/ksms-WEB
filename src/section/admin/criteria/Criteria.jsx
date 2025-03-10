import React, { useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  Pagination,
  notification,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useCriteria from "../../../hooks/useCriteria";

const Criteria = () => {
  const {
    criteria,
    fetchCriteria,
    createCriteria,
    updateCriteria,
    currentPage,
    totalItems,
    pageSize,
    totalPages,
    isLoading,
  } = useCriteria();

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [currentCriteria, setCurrentCriteria] = React.useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCriteria(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const showModal = (criteria = null) => {
    if (criteria) {
      setCurrentCriteria(criteria);
      form.setFieldsValue(criteria);
    } else {
      setCurrentCriteria(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSave = async (values) => {
    if (currentCriteria) {
      // Update existing criteria
      const result = await updateCriteria(currentCriteria.id, values);

      if (result) {
        notification.success({
          message: "Cập nhật tiêu chí thành công",
          description: "Tiêu chí đã được cập nhật thành công.",
          placement: "topRight",
        });
      } else {
        notification.error({
          message: "Cập nhật tiêu chí thất bại",
          description: "Không thể cập nhật tiêu chí. Vui lòng thử lại!",
          placement: "topRight",
        });
      }
    } else {
      // Create new criteria
      const newOrder =
        criteria.length > 0
          ? Math.max(...criteria.map((c) => c.order || 0)) + 1
          : 1;
      const newCriteria = { ...values, order: newOrder };

      const result = await createCriteria(newCriteria);

      if (result) {
        notification.success({
          message: "Thêm tiêu chí thành công",
          description: "Tiêu chí đã được thêm thành công.",
          placement: "topRight",
        });

        await fetchCriteria(1, pageSize);
      } else {
        notification.error({
          message: "Thêm tiêu chí thất bại",
          description: "Không thể thêm tiêu chí. Vui lòng thử lại!",
          placement: "topRight",
        });
      }
    }

    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: "Tên Tiêu Chí",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
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
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
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
    <div>
      <div className="flex justify-end relative top-[-40px] right-0">
        <Button
          type="primary"
          onClick={() => showModal()}
          icon={<PlusOutlined />}
        >
          Thêm mới
        </Button>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-md">
        <Table
          columns={columns}
          dataSource={criteria}
          pagination={false}
          loading={isLoading}
          rowKey="id"
        />

        <div className="flex justify-end items-center mt-4">
          <span>{`${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalItems)} của ${totalItems}`}</span>
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            showSizeChanger
            onChange={(page, size) => fetchCriteria(page, size)}
          />
        </div>

        <Modal
          title={currentCriteria ? "Cập Nhật Tiêu Chí" : "Thêm Tiêu Chí"}
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
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
