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
  message,
} from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

// Cài đặt plugins cho dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
// Thiết lập timezone mặc định là UTC+7
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

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

  // CSS cho thông báo múi giờ
  const timezoneCss = `
    .timezone-popup .ant-picker-footer {
      padding: 4px 8px;
    }
  `;

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
              ? dayjs(savedStatus.startDate).tz("Asia/Ho_Chi_Minh")
              : null,
            endDate: savedStatus.endDate
              ? dayjs(savedStatus.endDate).tz("Asia/Ho_Chi_Minh")
              : null,
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
          ? dayjs(status.startDate)
              .tz("Asia/Ho_Chi_Minh")
              .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
          : null,
        endDate:
          // Use the endDate for all statuses if it exists
          status.endDate
            ? dayjs(status.endDate)
                .tz("Asia/Ho_Chi_Minh")
                .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
            : status.startDate
              ? dayjs(status.startDate)
                  .tz("Asia/Ho_Chi_Minh")
                  .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
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
    const currentStatus = updatedStatuses[index];
    const statusName = currentStatus.statusName;

    // Kiểm tra tính hợp lệ của ngày tháng
    if (value) {
      // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
      if (
        dateType === "endDate" &&
        currentStatus.startDate &&
        value.isBefore(currentStatus.startDate)
      ) {
        message.error("Giờ kết thúc phải sau giờ bắt đầu");
        return;
      }

      // Kiểm tra ngày bắt đầu phải trước ngày kết thúc
      if (
        dateType === "startDate" &&
        currentStatus.endDate &&
        value.isAfter(currentStatus.endDate)
      ) {
        message.error("Ngày bắt đầu phải trước ngày kết thúc");
        return;
      }

      // Lấy danh sách các trạng thái đã được chọn và sắp xếp theo thời gian
      const selectedStatuses = updatedStatuses.filter(
        (s) => s.selected && s.startDate && s !== currentStatus
      );

      // Kiểm tra thứ tự thời gian
      if (dateType === "startDate") {
        // Kiểm tra thời gian bắt đầu của trạng thái hiện tại không được trước thời gian kết thúc của trạng thái trước đó
        for (const status of selectedStatuses) {
          if (status.endDate && status.selected) {
            // Nếu thời gian bắt đầu của trạng thái hiện tại trước thời gian kết thúc của một trạng thái khác
            // và đồng thời thời gian kết thúc của trạng thái hiện tại sau thời gian bắt đầu của trạng thái đó
            // => có chồng chéo
            if (
              value.isBefore(status.endDate) &&
              currentStatus.endDate &&
              currentStatus.endDate.isAfter(status.startDate)
            ) {
              message.error(
                `Thời gian không được chồng chéo với trạng thái khác (${status.label})`
              );
              return;
            }
          }
        }
      } else if (dateType === "endDate") {
        // Kiểm tra thời gian kết thúc không tạo ra chồng chéo
        for (const status of selectedStatuses) {
          if (status.startDate && status.selected) {
            // Nếu thời gian kết thúc của trạng thái hiện tại sau thời gian bắt đầu của một trạng thái khác
            // và đồng thời thời gian bắt đầu của trạng thái hiện tại trước thời gian kết thúc của trạng thái đó
            // => có chồng chéo
            if (
              value.isAfter(status.startDate) &&
              currentStatus.startDate &&
              currentStatus.startDate.isBefore(status.endDate)
            ) {
              message.error(
                `Thời gian không được chồng chéo với trạng thái khác (${status.label})`
              );
              return;
            }
          }
        }
      }

      // Kiểm tra thứ tự các trạng thái đặc biệt
      if (statusName === "RegistrationOpen") {
        // Ngày bắt đầu đăng ký phải trước ngày kết thúc đăng ký
        if (dateType === "startDate") {
          const checkInStatus = availableStatuses.find(
            (s) => s.statusName === "CheckIn" && s.selected
          );
          if (
            checkInStatus?.startDate &&
            value.isAfter(checkInStatus.startDate)
          ) {
            message.error("Ngày bắt đầu đăng ký phải trước ngày điểm danh");
            return;
          }
        }
      } else if (statusName === "CheckIn") {
        // Ngày điểm danh phải sau ngày kết thúc đăng ký
        const registrationStatus = availableStatuses.find(
          (s) => s.statusName === "RegistrationOpen" && s.selected
        );
        if (
          registrationStatus?.endDate &&
          value.isBefore(registrationStatus.endDate)
        ) {
          message.error("Ngày điểm danh phải sau ngày kết thúc đăng ký");
          return;
        }
      } else if (statusName === "Finished") {
        // Ngày kết thúc phải sau tất cả các ngày khác
        const otherStatuses = availableStatuses.filter(
          (s) => s.statusName !== "Finished" && s.selected
        );
        for (const status of otherStatuses) {
          if (status.endDate && value.isBefore(status.endDate)) {
            message.error("Ngày kết thúc phải sau tất cả các ngày khác");
            return;
          }
        }
      }
    }

    updatedStatuses[index][dateType] = value;
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
      <style>{timezoneCss}</style>
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
                      showTime={{ defaultValue: null }}
                      className="w-full"
                      disabled={!status.selected}
                      value={status.startDate}
                      onChange={(value) =>
                        handleDateChange(index, "startDate", value)
                      }
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="Chọn ngày bắt đầu"
                      showNow={false}
                      popupClassName="timezone-popup"
                      renderExtraFooter={() => (
                        <div className="text-xs text-gray-500 text-right">
                          Giờ Việt Nam (UTC+7)
                        </div>
                      )}
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
                      showTime={{ defaultValue: null }}
                      className="w-full"
                      disabled={!status.selected}
                      value={status.endDate}
                      onChange={(value) =>
                        handleDateChange(index, "endDate", value)
                      }
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="Chọn ngày kết thúc"
                      showNow={false}
                      popupClassName="timezone-popup"
                      renderExtraFooter={() => (
                        <div className="text-xs text-gray-500 text-right">
                          Giờ Việt Nam (UTC+7)
                        </div>
                      )}
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
                      showTime={{ defaultValue: null }}
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
                      showNow={false}
                      popupClassName="timezone-popup"
                      renderExtraFooter={() => (
                        <div className="text-xs text-gray-500 text-right">
                          Giờ Việt Nam (UTC+7)
                        </div>
                      )}
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
                        // Chỉ cập nhật phần ngày, giữ nguyên giờ nếu đã có
                        let newValue = value;
                        if (value && status.startDate) {
                          // Giữ lại thời gian từ startDate nếu đã có
                          newValue = value
                            .hour(status.startDate.hour())
                            .minute(status.startDate.minute())
                            .second(status.startDate.second());
                        }
                        handleDateChange(index, "startDate", newValue);

                        // Cập nhật cùng ngày cho endDate nếu đã có
                        if (value && status.endDate) {
                          const newEndDate = value
                            .hour(status.endDate.hour())
                            .minute(status.endDate.minute())
                            .second(status.endDate.second());
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
                              // Chỉ cập nhật giờ, giữ nguyên ngày
                              const newDate = status.startDate
                                .hour(value.hour())
                                .minute(value.minute())
                                .second(value.second());

                              // Kiểm tra xem giờ bắt đầu có trước giờ kết thúc không nếu đã có giờ kết thúc
                              if (
                                status.endDate &&
                                (newDate.isAfter(status.endDate) ||
                                  newDate.isSame(status.endDate))
                              ) {
                                message.error(
                                  "Giờ bắt đầu phải trước giờ kết thúc"
                                );
                                return;
                              }

                              handleDateChange(index, "startDate", newDate);
                            } else if (status.startDate) {
                              // Trường hợp xoá giờ
                              const newDate = status.startDate
                                .hour(0)
                                .minute(0)
                                .second(0);
                              handleDateChange(index, "startDate", newDate);
                            }
                          }}
                          format="HH:mm"
                          placeholder="Giờ bắt đầu"
                          popupClassName="timezone-popup"
                          renderExtraFooter={() => (
                            <div className="text-xs text-gray-500 text-right">
                              Giờ Việt Nam (UTC+7)
                            </div>
                          )}
                          allowClear={true}
                          disabledHours={() => {
                            const hoursDisabled = [];

                            // Vô hiệu hóa giờ đã qua trong ngày hiện tại
                            const now = dayjs().tz("Asia/Ho_Chi_Minh");
                            const isToday =
                              status.startDate &&
                              now.date() === status.startDate.date() &&
                              now.month() === status.startDate.month() &&
                              now.year() === status.startDate.year();

                            if (isToday) {
                              // Vô hiệu hóa tất cả các giờ đã qua trong ngày hiện tại
                              for (let i = 0; i < now.hour(); i++) {
                                hoursDisabled.push(i);
                              }
                            }

                            // Kiểm tra tất cả các trạng thái có cùng ngày
                            if (status.startDate) {
                              const sameDay = availableStatuses.filter(
                                (s) =>
                                  s.selected &&
                                  s.endDate &&
                                  s.statusName !== status.statusName &&
                                  s.endDate.format("YYYY-MM-DD") ===
                                    status.startDate.format("YYYY-MM-DD")
                              );

                              // Vô hiệu hóa các giờ đã được sử dụng bởi các trạng thái khác
                              sameDay.forEach((otherStatus) => {
                                // Thời gian kết thúc của trạng thái khác là thời gian sớm nhất có thể bắt đầu trạng thái hiện tại
                                // Vô hiệu hóa tất cả các giờ TRƯỚC giờ kết thúc của trạng thái khác
                                for (
                                  let i = 0;
                                  i < otherStatus.endDate.hour();
                                  i++
                                ) {
                                  if (!hoursDisabled.includes(i)) {
                                    hoursDisabled.push(i);
                                  }
                                }

                                // Nếu giờ kết thúc của trạng thái khác trùng với giờ bắt đầu hiện tại
                                // thì sẽ kiểm tra phút ở hàm disabledMinutes
                              });
                            }

                            return hoursDisabled;
                          }}
                          disabledMinutes={(selectedHour) => {
                            const minutesDisabled = [];

                            // Vô hiệu hóa phút đã qua trong giờ hiện tại
                            const now = dayjs().tz("Asia/Ho_Chi_Minh");
                            const isToday =
                              status.startDate &&
                              now.date() === status.startDate.date() &&
                              now.month() === status.startDate.month() &&
                              now.year() === status.startDate.year();

                            if (isToday && selectedHour === now.hour()) {
                              // Vô hiệu hóa tất cả các phút đã qua trong giờ hiện tại
                              for (let i = 0; i < now.minute(); i++) {
                                minutesDisabled.push(i);
                              }
                            }

                            // Kiểm tra tất cả các trạng thái có cùng ngày
                            if (status.startDate) {
                              const sameDay = availableStatuses.filter(
                                (s) =>
                                  s.selected &&
                                  s.endDate &&
                                  s.statusName !== status.statusName &&
                                  s.endDate.format("YYYY-MM-DD") ===
                                    status.startDate.format("YYYY-MM-DD")
                              );

                              // Với mỗi trạng thái cùng ngày, kiểm tra
                              sameDay.forEach((otherStatus) => {
                                // Nếu đang xem giờ trùng với giờ kết thúc của trạng thái khác
                                if (
                                  selectedHour === otherStatus.endDate.hour()
                                ) {
                                  // Vô hiệu hóa tất cả các phút <= phút kết thúc của trạng thái đó
                                  for (
                                    let i = 0;
                                    i <= otherStatus.endDate.minute();
                                    i++
                                  ) {
                                    if (!minutesDisabled.includes(i)) {
                                      minutesDisabled.push(i);
                                    }
                                  }
                                }
                              });
                            }

                            return minutesDisabled;
                          }}
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
                              // Tạo ngày kết thúc với ngày giống startDate nhưng giờ từ timepicker
                              const newEndDate = status.startDate
                                .hour(value.hour())
                                .minute(value.minute())
                                .second(value.second());

                              // Kiểm tra xem giờ kết thúc có sau giờ bắt đầu không
                              if (
                                newEndDate.isBefore(status.startDate) ||
                                newEndDate.isSame(status.startDate)
                              ) {
                                message.error(
                                  "Giờ kết thúc phải sau giờ bắt đầu"
                                );
                                return;
                              }

                              handleDateChange(index, "endDate", newEndDate);
                            } else if (status.startDate) {
                              // Trường hợp xoá giờ
                              const newEndDate = status.startDate
                                .hour(0)
                                .minute(0)
                                .second(0);
                              handleDateChange(index, "endDate", newEndDate);
                            }
                          }}
                          format="HH:mm"
                          placeholder="Giờ kết thúc"
                          popupClassName="timezone-popup"
                          renderExtraFooter={() => (
                            <div className="text-xs text-gray-500 text-right">
                              Giờ Việt Nam (UTC+7)
                            </div>
                          )}
                          allowClear={true}
                          disabledHours={() => {
                            const hoursDisabled = [];

                            // Vô hiệu hóa giờ đã qua trong ngày hiện tại
                            const now = dayjs().tz("Asia/Ho_Chi_Minh");
                            const isToday =
                              status.startDate &&
                              now.date() === status.startDate.date() &&
                              now.month() === status.startDate.month() &&
                              now.year() === status.startDate.year();

                            if (isToday) {
                              // Vô hiệu hóa tất cả các giờ đã qua trong ngày hiện tại
                              for (let i = 0; i < now.hour(); i++) {
                                hoursDisabled.push(i);
                              }
                            }

                            // Kiểm tra tất cả các trạng thái có cùng ngày
                            if (status.startDate) {
                              const sameDay = availableStatuses.filter(
                                (s) =>
                                  s.selected &&
                                  s.endDate &&
                                  s.statusName !== status.statusName &&
                                  s.endDate.format("YYYY-MM-DD") ===
                                    status.startDate.format("YYYY-MM-DD")
                              );

                              // Vô hiệu hóa các giờ đã được sử dụng bởi các trạng thái khác
                              sameDay.forEach((otherStatus) => {
                                // Thời gian kết thúc của trạng thái khác là thời gian sớm nhất có thể bắt đầu trạng thái hiện tại
                                // Vô hiệu hóa tất cả các giờ TRƯỚC giờ kết thúc của trạng thái khác
                                for (
                                  let i = 0;
                                  i < otherStatus.endDate.hour();
                                  i++
                                ) {
                                  if (!hoursDisabled.includes(i)) {
                                    hoursDisabled.push(i);
                                  }
                                }

                                // Nếu giờ kết thúc của trạng thái khác trùng với giờ bắt đầu hiện tại
                                // thì sẽ kiểm tra phút ở hàm disabledMinutes
                              });
                            }

                            return hoursDisabled;
                          }}
                          disabledMinutes={(selectedHour) => {
                            const minutesDisabled = [];

                            // Vô hiệu hóa phút đã qua trong giờ hiện tại
                            const now = dayjs().tz("Asia/Ho_Chi_Minh");
                            const isToday =
                              status.startDate &&
                              now.date() === status.startDate.date() &&
                              now.month() === status.startDate.month() &&
                              now.year() === status.startDate.year();

                            if (isToday && selectedHour === now.hour()) {
                              // Vô hiệu hóa tất cả các phút đã qua trong giờ hiện tại
                              for (let i = 0; i < now.minute(); i++) {
                                minutesDisabled.push(i);
                              }
                            }

                            // Kiểm tra tất cả các trạng thái có cùng ngày
                            if (status.startDate) {
                              const sameDay = availableStatuses.filter(
                                (s) =>
                                  s.selected &&
                                  s.endDate &&
                                  s.statusName !== status.statusName &&
                                  s.endDate.format("YYYY-MM-DD") ===
                                    status.startDate.format("YYYY-MM-DD")
                              );

                              // Với mỗi trạng thái cùng ngày, kiểm tra
                              sameDay.forEach((otherStatus) => {
                                // Nếu đang xem giờ trùng với giờ kết thúc của trạng thái khác
                                if (
                                  selectedHour === otherStatus.endDate.hour()
                                ) {
                                  // Vô hiệu hóa tất cả các phút <= phút kết thúc của trạng thái đó
                                  for (
                                    let i = 0;
                                    i <= otherStatus.endDate.minute();
                                    i++
                                  ) {
                                    if (!minutesDisabled.includes(i)) {
                                      minutesDisabled.push(i);
                                    }
                                  }
                                }
                              });
                            }

                            return minutesDisabled;
                          }}
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
