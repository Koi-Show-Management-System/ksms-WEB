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

function StepThree({ updateFormData, initialData, showErrors }) {
  // Lấy danh sách quy tắc từ initialData
  const [rules, setRules] = useState(initialData.createShowRuleRequests || []);
  const [filteredRules, setFilteredRules] = useState(rules);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newRule, setNewRule] = useState({ title: "", content: "" });
  const [searchText, setSearchText] = useState("");
  const [timeErrors, setTimeErrors] = useState({ startDate: "", endDate: "" });
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

  const statusMapping = {
    "Mở Đăng Ký": {
      key: "RegistrationOpen",
      description: "Cho phép người tham gia đăng ký sự kiện.",
    },
    "Đóng Đăng Ký": {
      key: "RegistrationClosed",
      description: "Không còn cho phép đăng ký tham gia.",
    },
    "Điểm Danh": {
      key: "CheckIn",
      description: "Người tham gia thực hiện điểm danh trước sự kiện.",
    },
    "Vòng Sơ Loại": {
      key: "Preliminary",
      description: "Vòng sơ tuyển để lọc ra các ứng viên phù hợp.",
    },
    "Vòng Đánh Giá": {
      key: "Evaluation",
      description: "Ban giám khảo tiến hành chấm điểm.",
    },
    "Vòng Chung Kết": {
      key: "Final",
      description: "Vòng thi cuối cùng để tìm ra người chiến thắng.",
    },
    "Grand Champion": {
      key: "GrandChampion",
      description: "Xác định người chiến thắng chung cuộc.",
    },
    "Hoàn Thành": {
      key: "Completed",
      description: "Sự kiện đã kết thúc thành công.",
    },
    "Triển Lãm": {
      key: "Exhibition",
      description: "Trưng bày hoặc giới thiệu sản phẩm, dịch vụ.",
    },
    "Kết Thúc": {
      key: "Finished",
      description: "Sự kiện đã kết thúc hoàn toàn.",
    },
  };

  const statusOptions = Object.entries(statusMapping).map(
    ([label, { key, description }]) => ({
      label,
      value: key,
      description,
    })
  );

  const handleStatusChange = (value) => {
    const selectedStatus = statusOptions.find(
      (status) => status.value === value
    );

    if (selectedStatus) {
      setNewShowStatus({
        statusName: selectedStatus.value,
        description: selectedStatus.description,
        startDate: null,
        endDate: null,
      });
    }
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
    let errors = { startDate: "", endDate: "" };

    if (!newShowStatus.startDate) {
      errors.startDate = "Vui lòng chọn ngày bắt đầu.";
    }
    if (!newShowStatus.endDate) {
      errors.endDate = "Vui lòng chọn ngày kết thúc.";
    } else if (
      newShowStatus.startDate &&
      newShowStatus.endDate.isBefore(newShowStatus.startDate)
    ) {
      errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu.";
    }

    setTimeErrors(errors);

    if (!errors.startDate && !errors.endDate) {
      const startDateVN = dayjs(newShowStatus.startDate)
        .tz("Asia/Ho_Chi_Minh")
        .format();
      const endDateVN = dayjs(newShowStatus.endDate)
        .tz("Asia/Ho_Chi_Minh")
        .format();

      setShowStatusList((prev) => [
        ...prev,
        { ...newShowStatus, startDate: startDateVN, endDate: endDateVN },
      ]);

      setNewShowStatus({
        statusName: "",
        description: "",
        startDate: null,
        endDate: null,
      });
      setTimeErrors({ startDate: "", endDate: "" }); // Reset lỗi sau khi thêm thành công
    }
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
      {showErrors && rules.length < 3 && (
        <p className="text-red-500 text-xs mt-1">
          Cần có ít nhất 3 quy tắc cho chương trình.
        </p>
      )}
      {/* Danh sách quy tắc */}
      <List
        dataSource={filteredRules}
        renderItem={(rule, index) => (
          <List.Item className="bg-white shadow-sm rounded-lg p-3 mb-3 border border-gray-200 flex justify-between items-center hover:shadow-md transition-all">
            <div className="w-full mx-4">
              {editingIndex === index ? (
                <Space direction="vertical" className="w-full">
                  <Input
                    value={rule.title}
                    onChange={(e) =>
                      handleEditRule(index, "title", e.target.value)
                    }
                    className="mb-2 text-sm"
                  />
                  <Input.TextArea
                    value={rule.content}
                    onChange={(e) =>
                      handleEditRule(index, "content", e.target.value)
                    }
                    className="mb-2 text-sm"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                  />
                  <Button
                    type="primary"
                    onClick={() => setEditingIndex(null)}
                    className="px-3 py-1 text-xs"
                  >
                    Lưu
                  </Button>
                </Space>
              ) : (
                <div className="w-full">
                  <p className="font-semibold text-gray-800 text-sm">
                    {rule.title}
                  </p>
                  <p className="text-gray-600 text-xs">{rule.content}</p>
                </div>
              )}
            </div>

            <Space size="middle">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => setEditingIndex(index)}
                className="text-gray-500 hover:text-blue-500"
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => showDeleteConfirm(index)}
                danger
                className="hover:text-red-500"
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

      {/* Tiêu đề */}
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
            value={
              statusOptions.find(
                (option) => option.value === newShowStatus.statusName
              )?.label || null
            }
            onChange={(value) => {
              const selectedStatus = statusOptions.find(
                (status) => status.value === value
              );
              if (selectedStatus) {
                setNewShowStatus({
                  statusName: selectedStatus.value, // Lưu giá trị tiếng Anh
                  description: selectedStatus.description, // Lưu mô tả trạng thái
                  startDate: null,
                  endDate: null,
                });
              }
            }}
          >
            {statusOptions.map((status) => (
              <Select.Option key={status.value} value={status.value}>
                {status.label} {/* Hiển thị tiếng Việt */}
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

        {/* Ngày bắt đầu và kết thúc */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Ngày bắt đầu
            </label>
            <DatePicker
              showTime
              className="w-full"
              value={
                newShowStatus.startDate ? dayjs(newShowStatus.startDate) : null
              }
              onChange={(value) =>
                setNewShowStatus((prev) => ({ ...prev, startDate: value }))
              }
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Chọn ngày bắt đầu"
            />
            {timeErrors.startDate && (
              <p className="text-red-500 text-xs mt-1">
                {timeErrors.startDate}
              </p>
            )}
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
            {timeErrors.endDate && (
              <p className="text-red-500 text-xs mt-1">{timeErrors.endDate}</p>
            )}
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

      {/* Hiển thị lỗi nếu chưa có ít nhất 3 trạng thái */}
      {showErrors && showStatusList.length < 3 && (
        <p className="text-red-500 text-xs mt-2">
          Cần chọn ít nhất 3 trạng thái cho chương trình.
        </p>
      )}

      {/* Danh sách Trạng Thái */}
      <Collapse className="mt-4">
        {showStatusList.map((status, index) => {
          const statusInVietnamese = Object.keys(statusMapping).find(
            (key) => statusMapping[key].key === status.statusName
          );

          return (
            <Collapse.Panel
              key={index}
              header={`${statusInVietnamese || status.statusName} (${status.startDate ? dayjs(status.startDate).format("DD/MM/YYYY HH:mm") : "Chưa có"} - ${status.endDate ? dayjs(status.endDate).format("DD/MM/YYYY HH:mm") : "Chưa có"})`}
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
          );
        })}
      </Collapse>
    </div>
  );
}

export default StepThree;
