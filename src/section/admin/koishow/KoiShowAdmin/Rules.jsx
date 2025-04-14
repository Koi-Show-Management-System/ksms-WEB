import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  notification,
  Empty,
  Popconfirm,
  List,
  Typography,
  Divider,
  Pagination,
  Select,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import useShowRule from "../../../../hooks/useShowRule";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const Rules = ({ showId, showRule = [] }) => {
  const {
    rules,
    setRules,
    createRule,
    updateRule,
    deleteRule,
    loading,
    isLoading,
    fetchShowRule,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    setShowId,
  } = useShowRule();

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [localRules, setLocalRules] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (showId) {
      setShowId(showId);
    }
  }, [showId, setShowId]);

  useEffect(() => {
    if (showId) {
      fetchShowRule(showId, 1, 10);
    }
  }, [showId]);

  useEffect(() => {
    if (showRule && showRule.length > 0) {
      const validRules = showRule.filter((rule) => rule.title && rule.content);
      setRules(validRules);
      setLocalRules(validRules);
    }
  }, [showRule, setRules]);

  useEffect(() => {
    if (rules && rules.length > 0) {
      const validRules = rules.filter((rule) => rule.title && rule.content);
      setLocalRules(validRules);
    } else {
      setLocalRules([]);
    }
  }, [rules]);

  const showModal = (rule = null) => {
    setEditingRule(rule);
    form.resetFields();
    if (rule) {
      form.setFieldsValue({
        title: rule.title,
        content: rule.content,
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRule(null);
  };

  const handlePageChange = (page, pageSize) => {
    fetchShowRule(showId, page, pageSize || get().pageSize);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Ensure both title and content are not empty
      if (!values.title.trim() || !values.content.trim()) {
        notification.error({
          message: "Lỗi xác thực",
          description: "Tiêu đề và nội dung không được để trống.",
          icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
          placement: "topRight",
          duration: 4,
        });

        return;
      }

      if (editingRule) {
        // Update existing rule
        await updateRule(editingRule.id, values);
        notification.success({
          message: "Cập nhật quy tắc",
          description: "Quy tắc đã được cập nhật thành công.",
          placement: "topRight",
          duration: 4,
        });
      } else {
        // Create new rule
        await createRule(showId, values);
        notification.success({
          message: "Tạo quy tắc",
          description: "Quy tắc mới đã được tạo thành công.",
          placement: "topRight",
          duration: 4,
        });
      }

      setIsModalVisible(false);
      setEditingRule(null);
    } catch (error) {
      console.error("Form submission failed:", error);
      notification.open({
        message: "Operation Failed",
        description:
          error.response?.data?.message ||
          "Failed to save rule. Please try again.",
        icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
        placement: "topRight",
        duration: 4,
      });
    }
  };

  // Delete a rule
  const handleDelete = async (id) => {
    try {
      setDeleteLoading(true);
      await deleteRule(id);

      notification.open({
        message: "Rule Deleted",
        description: "The rule has been successfully deleted.",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        placement: "topRight",
        duration: 4,
      });
    } catch (error) {
      notification.open({
        message: "Delete Failed",
        description:
          error.response?.data?.message ||
          "Failed to delete the rule. Please try again.",
        icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
        placement: "topRight",
        duration: 4,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // If no rules are available yet, show a placeholder
  if (!localRules || localRules.length === 0) {
    return (
      <div className="relative p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm">
        <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-200">
          <Empty
            description={
              <span className="text-gray-500 text-lg">
                Chưa có quy tắc nào được thêm
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="mt-4 px-5 h-9"
          >
            Thêm Quy Tắc
          </Button>
        </div>

        {/* Create Modal */}
        <Modal
          title="Create New Rule"
          open={isModalVisible}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={loading || isLoading}
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-600"
            >
              Create
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical" name="ruleForm">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Please enter a title" }]}
            >
              <Input placeholder="Enter rule title" />
            </Form.Item>
            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: "Please enter content" }]}
            >
              <TextArea
                placeholder="Enter rule content"
                rows={4}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="relative p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} className="m-0 text-gray-700 font-medium">
          <span className=" ">Quy Tắc</span>
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          className="px-3 h-8 "
        >
          Thêm Quy Tắc
        </Button>
      </div>

      <List
        loading={isLoading || loading}
        itemLayout="vertical"
        dataSource={localRules}
        renderItem={(rule, index) => (
          <List.Item
            key={rule.id}
            className="bg-white rounded-xl shadow mb-3 overflow-hidden transform hover:translate-y-[-2px] transition-all duration-300"
          >
            <div className="relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-500"></div>
              <div className="pl-4">
                <div className="flex items-center justify-between ">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3 mb-2.5">
                      {(currentPage - 1) * pageSize + index + 1}
                    </div>
                    <Title level={4} className="m-0 text-gray-800 font-medium">
                      {rule.title}
                    </Title>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => showModal(rule)}
                      className="text-gray-500  rounded-full h-8 w-8 flex items-center justify-center"
                    />
                    <Popconfirm
                      title="Xóa Quy Tắc"
                      description="Bạn có chắc muốn xóa quy tắc này không?"
                      onConfirm={() => handleDelete(rule.id)}
                      okText="Đồng ý"
                      cancelText="Hủy"
                      okButtonProps={{
                        className: "bg-red-500 hover:bg-red-600 border-0",
                        loading: deleteLoading,
                      }}
                    >
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 flex items-center justify-center"
                      />
                    </Popconfirm>
                  </div>
                </div>
                <Divider className="my-2 bg-gray-100" />
                <Paragraph className="text-gray-600 whitespace-pre-line leading-relaxed mb-0">
                  {rule.content}
                </Paragraph>
              </div>
            </div>
          </List.Item>
        )}
      />

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-end mt-4 mb-2 px-3 py-2 bg-white rounded-lg shadow-sm">
          <span className="text-gray-600 text-sm">
            {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalItems)} trong {totalItems}
          </span>
          <div className="flex items-center mx-2">
            <button
              onClick={() =>
                currentPage > 1 && handlePageChange(currentPage - 1, pageSize)
              }
              className="px-2 text-blue-500"
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            <div className="px-3 py-1 mx-1 border border-blue-500 rounded-md text-blue-500">
              {currentPage}
            </div>
            <button
              onClick={() =>
                currentPage < totalPages &&
                handlePageChange(currentPage + 1, pageSize)
              }
              className="px-2 text-blue-500"
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
          <div className="flex items-center">
            <Select
              value={pageSize}
              onChange={(value) => handlePageChange(1, value)}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
              ]}
              size="small"
              popupMatchSelectWidth={false}
              className="w-16"
            />
            <span className="ml-1 text-gray-600 text-sm">/ page</span>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={
          <div className="text-lg font-medium text-gray-800 border-b pb-2">
            {editingRule ? "Chỉnh Sửa Quy Tắc" : "Thêm Quy Tắc Mới"}
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={500}
        className="custom-modal"
        footer={[
          <Button key="cancel" onClick={handleCancel} className="px-4">
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading || isLoading}
            onClick={handleSubmit}
            className="px-4"
          >
            {editingRule ? "Cập Nhật" : "Tạo Mới"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" name="ruleForm" className="pt-3">
          <Form.Item
            name="title"
            label={<span className="text-gray-700 font-medium">Tiêu đề</span>}
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input
              placeholder="Nhập tiêu đề quy tắc"
              className="rounded-md py-1"
            />
          </Form.Item>
          <Form.Item
            name="content"
            label={<span className="text-gray-700 font-medium">Nội dung</span>}
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea
              placeholder="Nhập nội dung quy tắc"
              rows={5}
              showCount
              maxLength={500}
              className="rounded-md"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rules;
