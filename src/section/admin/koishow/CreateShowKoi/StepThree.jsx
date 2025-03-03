import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  List,
  Typography,
  Space,
  Modal,
  Divider,
  DatePicker,
  Select,
  Collapse,
} from "antd";
import dayjs from "dayjs";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

function StepThree({ updateFormData, initialData }) {
  // Lấy danh sách quy tắc từ initialData
  const [rules, setRules] = useState(initialData.createShowRuleRequests || []);
  const [filteredRules, setFilteredRules] = useState(rules);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newRule, setNewRule] = useState({ title: "", content: "" });
  const [searchText, setSearchText] = useState("");
  const [showStatusList, setShowStatusList] = useState(
    initialData.createShowStatusRequests || []
  );
  const [newShowStatus, setNewShowStatus] = useState({
    statusName: "",
    description: "",
    startDate: null,
    endDate: null,
  });
  
  useEffect(() => {
    updateFormData({
      createShowRuleRequests: rules,
      createShowStatusRequests: showStatusList,
    });
    setFilteredRules(rules);
  }, [rules, showStatusList]);

  // Lọc danh sách theo search
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredRules(rules);
    } else {
      setFilteredRules(
        rules.filter((rule) =>
          rule.title.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, rules]);

  const statusOptions = [
    {
      value: "Chờ duyệt",
      description: "Chương trình đang chờ duyệt từ ban tổ chức.",
    },
    {
      value: "Đang diễn ra",
      description: "Chương trình đang được tổ chức và diễn ra bình thường.",
    },
    {
      value: "Đã kết thúc",
      description: "Chương trình đã hoàn thành và kết thúc.",
    },
  ];

  const handleStatusChange = (value) => {
    const selectedStatus = statusOptions.find(
      (status) => status.value === value
    );

    setNewShowStatus((prev) => ({
      ...prev,
      statusName: value,
      description: selectedStatus ? selectedStatus.description : "",
    }));
  };

  const addRule = () => {
    if (newRule.title.trim() && newRule.content.trim()) {
      setRules([...rules, newRule]);
      setNewRule({ title: "", content: "" });
      setIsAddModalVisible(false);
    } else {
      Modal.error({
        title: "Lỗi",
        content: "Vui lòng nhập tiêu đề và nội dung quy tắc!",
      });
    }
  };

  // Hiển thị modal xác nhận xóa
  const showDeleteConfirm = (index) => {
    setRuleToDelete(index);
    setIsDeleteModalVisible(true);
  };

  // Xóa quy tắc sau khi xác nhận
  const deleteRule = () => {
    if (ruleToDelete !== null) {
      setRules(rules.filter((_, idx) => idx !== ruleToDelete));
      setIsDeleteModalVisible(false);
    }
  };

  // Chỉnh sửa quy tắc trực tiếp
  const handleEditRule = (index, field, value) => {
    const updatedRules = [...rules];
    updatedRules[index][field] = value;
    setRules(updatedRules);
  };

  const handleAddStatus = () => {
    if (
      !newShowStatus.statusName ||
      !newShowStatus.startDate ||
      !newShowStatus.endDate
    ) {
      Modal.error({
        title: "Lỗi",
        content: "Vui lòng chọn trạng thái và nhập thời gian hợp lệ!",
      });
      return;
    }

    setShowStatusList((prev) => [...prev, { ...newShowStatus }]);

    // Reset form nhập trạng thái mới
    setNewShowStatus({
      statusName: "",
      description: "",
      startDate: null,
      endDate: null,
    });
  };

  const handleRemoveStatus = (index) => {
    setShowStatusList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Title level={3} className="text-blue-500">
        Bước 3: Quy Tắc & Quy Định
      </Title>
      <Divider />

      {/* Thanh tìm kiếm & nút thêm quy tắc */}
      <div className="flex items-center gap-4 mb-4">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm quy tắc..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalVisible(true)}
        >
          Thêm Quy Tắc
        </Button>
      </div>

      {/* Danh sách quy tắc */}
      <List
        dataSource={filteredRules}
        renderItem={(rule, index) => (
          <List.Item className="hover:bg-gray-100 transition-all rounded-lg ">
            <div className="w-full flex items-center justify-between p-3 mb-5">
              {editingIndex === index ? (
                <Space direction="vertical" className="w-full">
                  <Input
                    value={rule.title}
                    onChange={(e) =>
                      handleEditRule(index, "title", e.target.value)
                    }
                    className="mb-2"
                  />
                  <Input.TextArea
                    value={rule.content}
                    onChange={(e) =>
                      handleEditRule(index, "content", e.target.value)
                    }
                    className="mb-2"
                    autoSize={{ minRows: 2, maxRows: 5 }}
                  />
                  <Button
                    type="default"
                    onClick={() => setEditingIndex(null)}
                    className="bg-green-500 text-white"
                  >
                    Lưu
                  </Button>
                </Space>
              ) : (
                <div className="w-full">
                  <Title level={5}>{rule.title}</Title>
                  <Text type="secondary">{rule.content}</Text>
                </div>
              )}
            </div>
            <Space>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => setEditingIndex(index)}
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => showDeleteConfirm(index)}
                danger
              />
            </Space>
          </List.Item>
        )}
      />

      {/* Modal Thêm Quy Tắc */}
      <Modal
        title="Thêm Quy Tắc Mới"
        open={isAddModalVisible}
        onOk={addRule}
        onCancel={() => setIsAddModalVisible(false)}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Space direction="vertical" className="w-full">
          <Input
            value={newRule.title}
            onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
            placeholder="Tiêu đề quy tắc..."
          />
          <Input.TextArea
            value={newRule.content}
            onChange={(e) =>
              setNewRule({ ...newRule, content: e.target.value })
            }
            placeholder="Nhập nội dung quy tắc..."
            autoSize={{ minRows: 2, maxRows: 5 }}
          />
        </Space>
      </Modal>

      {/* Modal Xóa Quy Tắc */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalVisible}
        onOk={deleteRule}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa quy tắc này không?</p>
      </Modal>
      <div>
        <Title level={3} className="text-blue-500">
          Trạng Thái Chương Trình
        </Title>
        <Divider />

        <Space direction="vertical" className="w-full">
          {/* Chọn trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tên trạng thái
            </label>
            <Select
              placeholder="Chọn trạng thái"
              className="w-full"
              value={newShowStatus.statusName || null}
              onChange={handleStatusChange}
            >
              {statusOptions.map((status) => (
                <Select.Option key={status.value} value={status.value}>
                  {status.value}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Mô tả trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mô tả trạng thái
            </label>
            <Input.TextArea
              rows={2}
              placeholder="Mô tả trạng thái"
              value={newShowStatus.description}
              disabled
            />
          </div>

          {/* Người dùng chọn thời gian */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Ngày bắt đầu
              </label>
              <DatePicker
                showTime
                className="w-full"
                value={
                  newShowStatus.startDate
                    ? dayjs(newShowStatus.startDate)
                    : null
                }
                onChange={(value) =>
                  setNewShowStatus((prev) => ({ ...prev, startDate: value }))
                }
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="Chọn ngày bắt đầu"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Ngày kết thúc
              </label>
              <DatePicker
                showTime
                className="w-full"
                value={
                  newShowStatus.endDate ? dayjs(newShowStatus.endDate) : null
                }
                onChange={(value) =>
                  setNewShowStatus((prev) => ({ ...prev, endDate: value }))
                }
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="Chọn ngày kết thúc"
              />
            </div>
          </div>

          {/* Nút Thêm Trạng Thái */}
          <Button
            type="primary"
            onClick={handleAddStatus}
            icon={<PlusOutlined />}
          >
            Thêm Trạng Thái
          </Button>
        </Space>

        {/* Danh sách Trạng Thái */}
        <Collapse className="mt-4">
          {showStatusList.map((status, index) => (
            <Collapse.Panel
              key={index}
              header={`${status.statusName} (${dayjs(status.startDate).format("DD/MM/YYYY HH:mm")} - ${dayjs(status.endDate).format("DD/MM/YYYY HH:mm")})`}
              extra={
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveStatus(index);
                  }}
                />
              }
            >
              <p>
                <strong>Mô tả:</strong> {status.description}
              </p>
              <p>
                <strong>Ngày bắt đầu:</strong>{" "}
                {dayjs(status.startDate).format("YYYY-MM-DD HH:mm:ss")}
              </p>
              <p>
                <strong>Ngày kết thúc:</strong>{" "}
                {dayjs(status.endDate).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </Collapse.Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
}

export default StepThree;
