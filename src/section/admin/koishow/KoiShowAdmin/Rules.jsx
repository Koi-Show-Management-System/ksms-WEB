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
        notification.open({
          message: "Validation Error",
          description: "Title and content cannot be empty",
          icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
          placement: "topRight",
          duration: 4,
        });
        return;
      }

      if (editingRule) {
        // Update existing rule
        await updateRule(editingRule.id, values);

        notification.open({
          message: "Rule Updated",
          description: "The rule has been successfully updated.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          placement: "topRight",
          duration: 4,
        });
      } else {
        // Create new rule
        await createRule(showId, values);

        notification.open({
          message: "Rule Created",
          description: "New rule has been successfully created.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
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
      <div className="relative p-5">
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <Empty
            description="No rules have been added yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="mt-4 bg-green-500 hover:bg-green-600"
          >
            Add First Rule
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
    <div className="relative p-5">
      <List
        loading={isLoading || loading}
        itemLayout="vertical"
        dataSource={localRules}
        renderItem={(rule, index) => (
          <List.Item
            key={rule.id}
            className="bg-white rounded-lg shadow-md mb-4 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Title level={4} className="text-green-600 m-0">
                  {(currentPage - 1) * pageSize + index + 1}. {rule.title}
                </Title>
                <div className="flex space-x-2">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => showModal(rule)}
                    className="text-green-600 hover:bg-green-50"
                  />
                  <Popconfirm
                    title="Delete Rule"
                    description="Are you sure you want to delete this rule?"
                    onConfirm={() => handleDelete(rule.id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{
                      className: "bg-red-500 hover:bg-red-600",
                      loading: deleteLoading,
                    }}
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      className="text-red-600 hover:bg-red-50"
                    />
                  </Popconfirm>
                </div>
              </div>
              <Divider className="my-3 bg-green-200" />
              <Paragraph className="text-gray-700 whitespace-pre-line">
                {rule.content}
              </Paragraph>
            </div>
          </List.Item>
        )}
      />

      {/* Pagination */}
      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-center mt-4 text-sm">
          <span className="mr-2 text-gray-600">
            {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalItems)} trong {totalItems}
          </span>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={handlePageChange}
            size="small"
            simple
            showSizeChanger={false}
            className="mx-2"
          />
          <div className="flex items-center ml-2">
            <span className="mr-2">{pageSize} / page</span>
            <Select
              value={pageSize}
              onChange={(value) => handlePageChange(1, value)}
              options={[
                { value: 10, label: "10 / page" },
                { value: 20, label: "20 / page" },
                { value: 50, label: "50 / page" },
              ]}
              size="small"
              dropdownMatchSelectWidth={false}
              className="w-28"
            />
          </div>
        </div>
      )}

      {/* Add Rule Button */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal()}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 flex items-center justify-center shadow-lg bg-green-500 hover:bg-green-600 border-none"
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingRule ? "Edit Rule" : "Create New Rule"}
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
            {editingRule ? "Update" : "Create"}
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
};

export default Rules;
