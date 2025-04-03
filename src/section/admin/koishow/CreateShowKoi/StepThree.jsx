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
  Checkbox,
  TimePicker,
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

  // Tạo danh sách tất cả các trạng thái với thời gian ban đầu là null
  const statusMapping = {
    "Mở Đăng Ký": {
      key: "RegistrationOpen",
      description: "Giai đoạn đăng ký.",
    },
    "Điểm Danh": {
      key: "CheckIn",
      description: "Giai đoạn check-in.",
    },
    "Vòng Sơ Khảo": {
      key: "Preliminary",
      description: "Vòng sơ khảo.",
    },
    "Vòng Đánh Giá Chính": {
      key: "Evaluation",
      description: "Vòng đánh giá chính.",
    },
    "Vòng Chung Kết": {
      key: "Final",
      description: "Vòng chung kết.",
    },
    "Triển Lãm": {
      key: "Exhibition",
      description: "Triển lãm cá koi.",
    },
    "Công bố kết quả": {
      key: "PublicResult",
      description: "Công bố kết quả.",
    },
    "Trao giải": {
      key: "Award",
      description: "Lễ trao giải.",
    },
    "Kết thúc sự kiện": {
      key: "Finished",
      description: "Kết thúc sự kiện.",
    },
  };

  // Tạo mảng tất cả trạng thái có sẵn
  const [availableStatuses, setAvailableStatuses] = useState(
    Object.entries(statusMapping).map(([label, { key, description }]) => ({
      label,
      statusName: key,
      description,
      startDate: null,
      endDate: null,
      selected: false, // Flag để theo dõi trạng thái có được chọn hay không
    }))
  );

  // Khởi tạo từ dữ liệu ban đầu nếu có
  useEffect(() => {
    if (initialData.createShowStatusRequests?.length > 0) {
      const updatedStatuses = [...availableStatuses];

      initialData.createShowStatusRequests.forEach((savedStatus) => {
        const index = updatedStatuses.findIndex(
          (status) => status.statusName === savedStatus.statusName
        );

        if (index !== -1) {
          updatedStatuses[index] = {
            ...updatedStatuses[index],
            startDate: savedStatus.startDate
              ? dayjs(savedStatus.startDate)
              : null,
            endDate: savedStatus.endDate ? dayjs(savedStatus.endDate) : null,
            selected: true,
          };
        }
      });

      setAvailableStatuses(updatedStatuses);
    }
  }, []);

  // Cập nhật form data mỗi khi có thay đổi
  useEffect(() => {
    // Chỉ gửi lên các trạng thái được chọn (có selected = true)
    const selectedStatuses = availableStatuses
      .filter((status) => status.selected && status.startDate)
      .map((status) => ({
        statusName: status.statusName,
        description: status.description,
        startDate: status.startDate
          ? dayjs(status.startDate).tz("Asia/Ho_Chi_Minh").format()
          : null,
        endDate:
          // Use the endDate for all statuses if it exists
          status.endDate
            ? dayjs(status.endDate).tz("Asia/Ho_Chi_Minh").format()
            : status.startDate
              ? dayjs(status.startDate).tz("Asia/Ho_Chi_Minh").format()
              : null,
      }));

    updateFormData({
      createShowRuleRequests: rules,
      createShowStatusRequests: selectedStatuses,
    });

    setFilteredRules(rules);
  }, [rules, availableStatuses]);

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

  // Cập nhật trạng thái được chọn
  const handleStatusSelection = (index) => {
    const updatedStatuses = [...availableStatuses];
    updatedStatuses[index].selected = !updatedStatuses[index].selected;

    // Nếu bỏ chọn, xóa ngày
    if (!updatedStatuses[index].selected) {
      updatedStatuses[index].startDate = null;
      updatedStatuses[index].endDate = null;
    }

    setAvailableStatuses(updatedStatuses);
  };

  // Cập nhật ngày cho trạng thái
  const handleDateChange = (index, dateType, value) => {
    const updatedStatuses = [...availableStatuses];
    updatedStatuses[index][dateType] = value;

    // Nếu đặt ngày, tự động chọn trạng thái đó
    if (value) {
      updatedStatuses[index].selected = true;
    }

    setAvailableStatuses(updatedStatuses);
  };

  // Kiểm tra xem có lỗi về ngày không
  const getDateError = (status, dateType) => {
    if (!status.selected) return null;

    if (dateType === "startDate" && !status.startDate) {
      return status.statusName === "Finished"
        ? "Thời gian kết thúc là bắt buộc"
        : "Ngày là bắt buộc";
    }

    if (status.statusName === "RegistrationOpen") {
      if (dateType === "endDate" && !status.endDate) {
        return "Ngày kết thúc là bắt buộc";
      }
      if (
        dateType === "endDate" &&
        status.startDate &&
        status.endDate &&
        status.endDate.isBefore(status.startDate)
      ) {
        return "Ngày kết thúc phải sau ngày bắt đầu";
      }
    } else if (status.statusName !== "Finished") {
      // For other statuses (except Finished), we need both startDate and endDate
      if (dateType === "endDate" && !status.endDate) {
        return "Giờ kết thúc là bắt buộc";
      }
    }

    return null;
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
      <Title level={3} className="text-blue-500 mt-8">
        Trạng Thái Chương Trình
      </Title>
      <Divider />
      

      {/* Hiển thị lỗi nếu chưa có ít nhất 3 trạng thái */}
      {showErrors && availableStatuses.filter((s) => s.selected).length < 3 && (
        <p className="text-red-500 text-sm font-medium mb-4">
          Cần chọn ít nhất 3 trạng thái cho chương trình.
        </p>
      )}

      {/* Bảng trạng thái */}
      <List
        className="bg-white rounded-lg shadow p-3"
        itemLayout="horizontal"
        dataSource={availableStatuses}
        renderItem={(status, index) => (
          <List.Item
            className={`border-b ${status.selected ? "bg-blue-50" : ""}`}
          >
            <div className="grid grid-cols-12 gap-4 w-full items-center">
              {/* Checkbox chọn trạng thái - show only description */}
              <div className="col-span-3">
                <Checkbox
                  checked={status.selected}
                  onChange={() => handleStatusSelection(index)}
                  className="font-medium"
                >
                  {status.description}
                </Checkbox>
              </div>

              {/* For Registration Open - Show Start and End Date */}
              {status.statusName === "RegistrationOpen" ? (
                <>
                  {/* Ngày bắt đầu */}
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <DatePicker
                      showTime
                      className="w-full"
                      disabled={!status.selected}
                      value={status.startDate}
                      onChange={(value) =>
                        handleDateChange(index, "startDate", value)
                      }
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="Chọn ngày bắt đầu"
                    />
                    {getDateError(status, "startDate") && (
                      <p className="text-red-500 text-xs mt-1">
                        {getDateError(status, "startDate")}
                      </p>
                    )}
                  </div>

                  {/* Ngày kết thúc */}
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <DatePicker
                      showTime
                      className="w-full"
                      disabled={!status.selected}
                      value={status.endDate}
                      onChange={(value) =>
                        handleDateChange(index, "endDate", value)
                      }
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="Chọn ngày kết thúc"
                    />
                    {getDateError(status, "endDate") && (
                      <p className="text-red-500 text-xs mt-1">
                        {getDateError(status, "endDate")}
                      </p>
                    )}
                  </div>
                </>
              ) : status.statusName === "Finished" ? (
                <>
                  {/* For Finished status - Show just a single Date+Time picker */}
                  <div className="col-span-8">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Thời gian kết thúc sự kiện
                    </label>
                    <DatePicker
                      showTime
                      className="w-full"
                      disabled={!status.selected}
                      value={status.startDate}
                      onChange={(value) => {
                        // Update both startDate and endDate with the same value
                        handleDateChange(index, "startDate", value);
                        handleDateChange(index, "endDate", value);
                      }}
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="Chọn thời gian kết thúc sự kiện"
                    />
                    {getDateError(status, "startDate") && (
                      <p className="text-red-500 text-xs mt-1">
                        {getDateError(status, "startDate")}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* For other statuses - Show Date and Time Range */}
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ngày diễn ra
                    </label>
                    <DatePicker
                      className="w-full"
                      disabled={!status.selected}
                      value={status.startDate}
                      onChange={(value) => {
                        // Only update the date part, preserve the time if it exists
                        let newValue = value;
                        if (value && status.startDate) {
                          // Copy the time from existing startDate to the new date
                          newValue = value
                            .hour(status.startDate.hour())
                            .minute(status.startDate.minute())
                            .second(status.startDate.second());
                        }
                        handleDateChange(index, "startDate", newValue);

                        // Also update endDate to have the same date
                        if (value && status.endDate) {
                          const newEndDate = value
                            .hour(status.endDate.hour())
                            .minute(status.endDate.minute())
                            .second(status.endDate.second());
                          handleDateChange(index, "endDate", newEndDate);
                        } else if (value) {
                          // If no existing end date, create one with same date
                          const newEndDate = value
                            .hour(value.hour() + 1)
                            .minute(0)
                            .second(0);
                          handleDateChange(index, "endDate", newEndDate);
                        }
                      }}
                      format="YYYY-MM-DD"
                      placeholder="Chọn ngày"
                    />
                    {getDateError(status, "startDate") && (
                      <p className="text-red-500 text-xs mt-1">
                        {getDateError(status, "startDate")}
                      </p>
                    )}
                  </div>

                  {/* Thời gian bắt đầu và kết thúc */}
                  <div className="col-span-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Giờ bắt đầu
                        </label>
                        <TimePicker
                          className="w-full"
                          disabled={!status.selected || !status.startDate}
                          value={status.startDate}
                          onChange={(value) => {
                            if (value && status.startDate) {
                              // Keep the date but update the time
                              const newDate = status.startDate
                                .hour(value.hour())
                                .minute(value.minute())
                                .second(value.second());
                              handleDateChange(index, "startDate", newDate);
                            }
                          }}
                          format="HH:mm"
                          placeholder="Giờ bắt đầu"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Giờ kết thúc
                        </label>
                        <TimePicker
                          className="w-full"
                          disabled={!status.selected || !status.startDate}
                          value={status.endDate}
                          onChange={(value) => {
                            if (value && status.startDate) {
                              // This creates a new date with the same date as startDate but with the time from the time picker
                              const newEndDate = status.startDate
                                .hour(value.hour())
                                .minute(value.minute())
                                .second(value.second());

                              // This updates the endDate state with the time picked from the TimePicker
                              handleDateChange(index, "endDate", newEndDate);
                            }
                          }}
                          format="HH:mm"
                          placeholder="Giờ kết thúc"
                        />
                        {status.startDate &&
                          status.endDate &&
                          status.endDate.isBefore(status.startDate) && (
                            <p className="text-red-500 text-xs mt-1">
                              Giờ kết thúc phải sau giờ bắt đầu
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

export default StepThree;
