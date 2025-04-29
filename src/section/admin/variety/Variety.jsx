import React, { useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  Pagination,
  notification,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import useVariety from "../../../hooks/useVariety";

const Variety = () => {
  const {
    variety,
    fetchVariety,
    createVariety,
    updateVariety,
    currentPage,
    totalItems,
    pageSize,
    totalPages,
    isLoading,
  } = useVariety();

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [currentVariety, setCurrentVariety] = React.useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchVariety(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const showModal = (variety = null) => {
    if (variety) {
      setCurrentVariety(variety);
      form.setFieldsValue(variety);
    } else {
      setCurrentVariety(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSave = async (values) => {
    try {
      if (currentVariety) {
        // Update existing variety
        await updateVariety(currentVariety.id, values);
      } else {
        // Create new variety
        await createVariety(values);
        notification.success({
          message: "Thành công",
          description: "Thêm giống Koi mới thành công",
        });
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchVariety(currentPage, pageSize);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: `Đã xảy ra lỗi khi ${currentVariety ? "cập nhật" : "thêm"} giống Koi`,
      });
      console.error(
        `Lỗi khi ${currentVariety ? "cập nhật" : "thêm"} giống Koi:`,
        error
      );
    }
  };

  const columns = [
    {
      title: "Tên Giống Koi",
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
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          ></Button>
        </Space>
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
          dataSource={variety}
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
            onChange={(page, size) => fetchVariety(page, size)}
          />
        </div>

        <Modal
          title={currentVariety ? "Cập nhật Giống Koi" : "Thêm Giống Koi"}
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="name"
              label="Tên Giống Koi"
              rules={[
                { required: true, message: "Vui lòng nhập tên giống koi!" },
              ]}
            >
              <Input placeholder="Nhập tên giống koi" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô Tả"
              rules={[
                { required: true, message: "Vui lòng nhập mô tả giống koi!" },
              ]}
            >
              <Input placeholder="Nhập mô tả giống koi" />
            </Form.Item>

            <div className="flex justify-end">
              <Button onClick={handleCancel} className="mr-2">
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {currentVariety ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Variety;
