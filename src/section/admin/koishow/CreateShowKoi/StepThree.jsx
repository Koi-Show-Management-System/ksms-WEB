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
  Card,
  Row,
  Col,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  FormOutlined,
  SolutionOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  FlagOutlined,
  InfoCircleOutlined,
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
      key: "KoiCheckIn",
      description: "Giai đoạn check-in cá koi.",
    },
    "Vé vào": {
      key: "TicketCheckIn",
      description: "Giai đoạn check-in vé.",
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
      selected: true, // Mặc định chọn tất cả trạng thái
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
    // Chỉ gửi lên các trạng thái được chọn (có selected = true) và có đầy đủ thông tin
    const selectedStatuses = availableStatuses
      .filter(
        (status) =>
          status.selected &&
          status.startDate &&
          // Nếu là RegistrationOpen hoặc các trạng thái khác (trừ Finished), cần cả startDate và endDate
          (status.statusName === "RegistrationOpen" ||
          status.statusName !== "Finished"
            ? status.endDate
            : true)
      )
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
      availableStatuses: availableStatuses, // Thêm truyền toàn bộ thông tin trạng thái
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

  // Cập nhật trạng thái được chọn - Không còn cần thiết nhưng giữ lại cho tương thích ngược
  const handleStatusSelection = (index) => {
    // Không làm gì cả vì tất cả trạng thái đều phải được chọn
    return;
  };

  // Cập nhật ngày cho trạng thái
  const handleDateChange = (index, dateType, value) => {
    const updatedStatuses = [...availableStatuses];
    const currentStatus = updatedStatuses[index];
    const statusName = currentStatus.statusName;

    // Nếu đang set giá trị null hoặc undefined, cập nhật và return luôn
    if (!value) {
      updatedStatuses[index][dateType] = value;
      setAvailableStatuses(updatedStatuses);
      return;
    }

    // Kiểm tra tính hợp lệ của ngày tháng
    if (value) {
      // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
      if (
        dateType === "endDate" &&
        currentStatus.startDate &&
        currentStatus.startDate.format("HH:mm:ss") !== "00:00:00" &&
        value.format("HH:mm:ss") !== "00:00:00" &&
        value.isBefore(currentStatus.startDate)
      ) {
        message.error("Giờ kết thúc phải sau giờ bắt đầu");
        return;
      }

      // Kiểm tra ngày bắt đầu phải trước ngày kết thúc
      if (
        dateType === "startDate" &&
        currentStatus.endDate &&
        currentStatus.endDate.format("HH:mm:ss") !== "00:00:00" &&
        value.format("HH:mm:ss") !== "00:00:00" &&
        value.isAfter(currentStatus.endDate)
      ) {
        message.error("Ngày bắt đầu phải trước ngày kết thúc");
        return;
      }

      // Định nghĩa thứ tự các trạng thái
      const statusOrder = {
        RegistrationOpen: 1,
        KoiCheckIn: 2,
        TicketCheckIn: 3,
        Preliminary: 4,
        Evaluation: 5,
        Final: 6,
        Exhibition: 7,
        PublicResult: 8,
        Award: 9,
        Finished: 10,
      };

      // Lấy thứ tự của trạng thái hiện tại
      const currentOrder = statusOrder[statusName];

      // Tìm trạng thái ngay trước đó
      const prevStatusName = Object.keys(statusOrder).find(
        (key) => statusOrder[key] === currentOrder - 1
      );

      // Tìm trạng thái ngay tiếp theo
      const nextStatusName = Object.keys(statusOrder).find(
        (key) => statusOrder[key] === currentOrder + 1
      );

      // Kiểm tra thứ tự thời gian với trạng thái trước
      if (prevStatusName) {
        const prevStatus = availableStatuses.find(
          (s) => s.statusName === prevStatusName && s.selected
        );

        if (prevStatus?.endDate && dateType === "startDate") {
          // Nếu có trạng thái trước và có thời gian kết thúc, thì thời gian bắt đầu của trạng thái hiện tại không được trước thời gian kết thúc đó
          if (
            prevStatus.endDate.format("HH:mm:ss") !== "00:00:00" &&
            value.format("HH:mm:ss") !== "00:00:00" &&
            value.isBefore(prevStatus.endDate)
          ) {
            message.error(
              `Thời gian bắt đầu phải sau thời gian kết thúc của "${prevStatus.label}"`
            );
            return;
          }
        }
      }

      // Kiểm tra thứ tự thời gian với trạng thái tiếp theo
      if (nextStatusName) {
        const nextStatus = availableStatuses.find(
          (s) => s.statusName === nextStatusName && s.selected
        );

        if (nextStatus?.startDate && dateType === "endDate") {
          // Nếu có trạng thái tiếp theo và có thời gian bắt đầu, thì thời gian kết thúc của trạng thái hiện tại không được sau thời gian bắt đầu đó
          if (
            nextStatus.startDate.format("HH:mm:ss") !== "00:00:00" &&
            value.format("HH:mm:ss") !== "00:00:00" &&
            value.isAfter(nextStatus.startDate)
          ) {
            message.error(
              `Thời gian kết thúc phải trước thời gian bắt đầu của "${nextStatus.label}"`
            );
            return;
          }
        }
      }

      // Các kiểm tra đặc biệt theo loại trạng thái
      if (statusName === "Finished") {
        // Đối với trạng thái "Kết thúc sự kiện", chỉ cho phép chọn thời gian kết thúc
        // Thời gian bắt đầu sẽ được tự động lấy từ thời gian kết thúc của trạng thái trước

        // Kiểm tra thời gian kết thúc phải sau tất cả các trạng thái khác
        if (dateType === "endDate") {
          // Tìm trạng thái ngay trước Finished
          const lastStatusName = Object.keys(statusOrder).find(
            (key) => statusOrder[key] === statusOrder["Finished"] - 1
          );

          if (lastStatusName) {
            const lastStatus = availableStatuses.find(
              (s) => s.statusName === lastStatusName && s.selected
            );

            if (
              lastStatus?.endDate &&
              lastStatus.endDate.format("HH:mm:ss") !== "00:00:00" &&
              value.format("HH:mm:ss") !== "00:00:00" &&
              value.isBefore(lastStatus.endDate)
            ) {
              message.error(
                `Thời gian kết thúc sự kiện phải sau thời gian kết thúc của "${lastStatus.label}"`
              );
              return;
            }

            // Tự động cập nhật thời gian bắt đầu từ thời gian kết thúc của trạng thái trước đó
            if (lastStatus?.endDate) {
              updatedStatuses[index].startDate = lastStatus.endDate.clone();
            }
          }
        }
      } else if (statusName === "Award" && dateType === "endDate") {
        // Khi thay đổi thời gian kết thúc của Award, cập nhật thời gian bắt đầu của Finished
        const finishedStatus = updatedStatuses.find(
          (s) => s.statusName === "Finished" && s.selected
        );

        if (finishedStatus) {
          const finishedIndex = updatedStatuses.findIndex(
            (s) => s.statusName === "Finished" && s.selected
          );

          if (finishedIndex !== -1) {
            // Cập nhật thời gian bắt đầu của Finished bằng thời gian kết thúc của Award
            updatedStatuses[finishedIndex].startDate = value.clone();

            // Nếu chưa có endDate hoặc endDate trước startDate mới, cập nhật endDate
            if (
              !updatedStatuses[finishedIndex].endDate ||
              (updatedStatuses[finishedIndex].endDate &&
                updatedStatuses[finishedIndex].endDate.isBefore(value))
            ) {
              // Tự động đặt giờ kết thúc +1 giờ so với giờ bắt đầu
              updatedStatuses[finishedIndex].endDate = value
                .clone()
                .add(1, "hour");
            }
          }
        }
      }
    }

    // Cập nhật giá trị cho trạng thái hiện tại
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

  // Lấy biểu tượng phù hợp với trạng thái
  const getStatusIcon = (statusName) => {
    switch (statusName) {
      case "RegistrationOpen":
        return <FormOutlined />;
      case "KoiCheckIn":
        return <SolutionOutlined />;
      case "TicketCheckIn":
        return <AuditOutlined />;
      case "Preliminary":
        return <FileSearchOutlined />;
      case "Evaluation":
        return <FileTextOutlined />;
      case "Final":
        return <TrophyOutlined />;
      case "Exhibition":
        return <ExperimentOutlined />;
      case "PublicResult":
        return <CheckCircleOutlined />;
      case "Award":
        return <FlagOutlined />;
      case "Finished":
        return <ClockCircleOutlined />;
      default:
        return <CalendarOutlined />;
    }
  };

  // Lấy màu nền phù hợp với trạng thái
  const getStatusColor = (statusName) => {
    switch (statusName) {
      case "RegistrationOpen":
        return "#e6f7ff"; // Xanh nhạt
      case "KoiCheckIn":
        return "#f6ffed"; // Xanh lá nhạt
      case "TicketCheckIn":
        return "#fff7e6"; // Cam nhạt
      case "Preliminary":
        return "#fcffe6"; // Vàng nhạt
      case "Evaluation":
        return "#f9f0ff"; // Tím nhạt
      case "Final":
        return "#fff0f6"; // Hồng nhạt
      case "Exhibition":
        return "#f5f5f5"; // Xám nhạt
      case "PublicResult":
        return "#e6fffb"; // Ngọc lam nhạt
      case "Award":
        return "#fffbe6"; // Vàng đậm nhạt
      case "Finished":
        return "#fff1f0"; // Đỏ nhạt
      default:
        return "#f0f2f5"; // Màu mặc định
    }
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
      <Title level={3} className="text-blue-500 mt-8 mb-4">
        Trạng Thái Chương Trình
      </Title>

      {/* Redesigned Status Cards */}
      <div className="mb-8">
        <p className="mb-4 text-gray-600">
          Thiết lập thời gian cho tất cả các trạng thái của chương trình. Thời
          gian các trạng thái phải được thiết lập theo đúng thứ tự diễn ra sự
          kiện.
        </p>

        <Row gutter={[16, 16]}>
          {availableStatuses.map((status, index) => (
            <Col xs={24} md={12} key={index}>
              <Card
                title={
                  <div className="flex items-center">
                    <span className="mr-2">
                      {getStatusIcon(status.statusName)}
                    </span>
                    <span>{status.description}</span>
                  </div>
                }
                style={{
                  backgroundColor: getStatusColor(status.statusName),
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {status.statusName === "Finished" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CalendarOutlined className="mr-1" /> Ngày kết thúc
                      </label>
                      <DatePicker
                        className="w-full"
                        disabled={!status.selected}
                        value={status.endDate}
                        onChange={(value) => {
                          // Nếu đã có giờ từ trước, giữ nguyên giờ đó
                          let newValue = value;
                          if (value && status.endDate) {
                            newValue = value
                              .hour(status.endDate.hour())
                              .minute(status.endDate.minute())
                              .second(status.endDate.second());
                          }
                          handleDateChange(index, "endDate", newValue);
                        }}
                        format="YYYY-MM-DD"
                        placeholder="Chọn ngày"
                        disabledDate={(current) => {
                          // Mặc định vô hiệu hóa ngày trong quá khứ
                          if (current && current.isBefore(dayjs(), "day")) {
                            return true;
                          }

                          // Tìm trạng thái Award (Lễ trao giải)
                          const awardStatus = availableStatuses.find(
                            (s) =>
                              s.statusName === "Award" &&
                              s.selected &&
                              s.endDate
                          );

                          // Nếu có trạng thái Award, chỉ cho phép chọn từ ngày của Award trở đi
                          if (awardStatus && awardStatus.endDate) {
                            return (
                              current &&
                              current.isBefore(awardStatus.endDate, "day")
                            );
                          }

                          return false;
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <ClockCircleOutlined className="mr-1" /> Giờ kết thúc
                      </label>
                      <TimePicker
                        className="w-full"
                        disabled={!status.endDate}
                        value={status.endDate}
                        onChange={(value) => {
                          if (value && status.endDate) {
                            // Tạo ngày kết thúc với ngày hiện tại và giờ mới
                            const newEndDate = status.endDate
                              .hour(value.hour())
                              .minute(value.minute())
                              .second(value.second());

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
                            status.endDate &&
                            now.date() === status.endDate.date() &&
                            now.month() === status.endDate.month() &&
                            now.year() === status.endDate.year();

                          if (isToday) {
                            for (let i = 0; i < now.hour(); i++) {
                              hoursDisabled.push(i);
                            }
                          }

                          // Tìm trạng thái Award
                          const awardStatus = availableStatuses.find(
                            (s) =>
                              s.statusName === "Award" &&
                              s.selected &&
                              s.endDate
                          );

                          // Nếu có trạng thái Award và cùng ngày
                          if (
                            awardStatus &&
                            awardStatus.endDate &&
                            status.endDate &&
                            status.endDate.format("YYYY-MM-DD") ===
                              awardStatus.endDate.format("YYYY-MM-DD")
                          ) {
                            // Vô hiệu hóa tất cả các giờ trước giờ kết thúc của Award
                            for (
                              let i = 0;
                              i < awardStatus.endDate.hour();
                              i++
                            ) {
                              if (!hoursDisabled.includes(i)) {
                                hoursDisabled.push(i);
                              }
                            }
                          }

                          return hoursDisabled;
                        }}
                        disabledMinutes={(selectedHour) => {
                          const minutesDisabled = [];

                          // Vô hiệu hóa phút đã qua trong giờ hiện tại
                          const now = dayjs().tz("Asia/Ho_Chi_Minh");
                          const isToday =
                            status.endDate &&
                            now.date() === status.endDate.date() &&
                            now.month() === status.endDate.month() &&
                            now.year() === status.endDate.year();

                          if (isToday && selectedHour === now.hour()) {
                            for (let i = 0; i < now.minute(); i++) {
                              minutesDisabled.push(i);
                            }
                          }

                          // Tìm trạng thái Award
                          const awardStatus = availableStatuses.find(
                            (s) =>
                              s.statusName === "Award" &&
                              s.selected &&
                              s.endDate
                          );

                          // Nếu có Award và cùng ngày và cùng giờ
                          if (
                            awardStatus &&
                            awardStatus.endDate &&
                            status.endDate &&
                            status.endDate.format("YYYY-MM-DD") ===
                              awardStatus.endDate.format("YYYY-MM-DD") &&
                            selectedHour === awardStatus.endDate.hour()
                          ) {
                            // Vô hiệu hóa tất cả các phút trước hoặc bằng phút kết thúc của Award
                            for (
                              let i = 0;
                              i <= awardStatus.endDate.minute();
                              i++
                            ) {
                              if (!minutesDisabled.includes(i)) {
                                minutesDisabled.push(i);
                              }
                            }
                          }

                          return minutesDisabled;
                        }}
                      />
                    </div>
                  </div>
                ) : status.statusName === "RegistrationOpen" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CalendarOutlined className="mr-1" /> Ngày bắt đầu
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <ClockCircleOutlined className="mr-1" /> Ngày kết thúc
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CalendarOutlined className="mr-1" /> Ngày diễn ra
                      </label>
                      <DatePicker
                        className="w-full"
                        disabled={!status.selected}
                        value={status.startDate}
                        onChange={(value) => {
                          // Chỉ cập nhật phần ngày, KHÔNG tự động thêm giờ 00:00
                          let newValue = value;
                          if (
                            value &&
                            status.startDate &&
                            status.startDate.format("HH:mm:ss") !== "00:00:00"
                          ) {
                            // Chỉ giữ lại thời gian từ startDate nếu đã có giờ được thiết lập rõ ràng (khác 00:00:00)
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
                        // Không cho phép chọn ngày trước ngày KoiCheckIn nếu là trạng thái sau KoiCheckIn
                        disabledDate={(current) => {
                          // Mặc định vô hiệu hóa ngày trong quá khứ
                          if (current && current.isBefore(dayjs(), "day")) {
                            return true;
                          }

                          // Tìm trạng thái đăng ký
                          const registrationStatus = availableStatuses.find(
                            (s) =>
                              s.statusName === "RegistrationOpen" &&
                              s.selected &&
                              s.endDate
                          );

                          // Nếu đây không phải là trạng thái đăng ký và trạng thái đăng ký đã được thiết lập
                          if (
                            status.statusName !== "RegistrationOpen" &&
                            registrationStatus &&
                            registrationStatus.endDate
                          ) {
                            // Vô hiệu hóa tất cả các ngày trước hoặc bằng ngày kết thúc đăng ký
                            // Nghĩa là chỉ cho phép chọn từ ngày sau ngày kết thúc đăng ký trở đi
                            if (
                              current &&
                              (current.isSame(
                                registrationStatus.endDate,
                                "day"
                              ) ||
                                current.isBefore(
                                  registrationStatus.endDate,
                                  "day"
                                ))
                            ) {
                              return true;
                            }
                          }

                          // Các điều kiện bổ sung cho các trạng thái cụ thể sau KoiCheckIn
                          const koiCheckInStatus = availableStatuses.find(
                            (s) =>
                              s.statusName === "KoiCheckIn" &&
                              s.selected &&
                              s.startDate
                          );

                          // Nếu trạng thái KoiCheckIn được chọn và có ngày bắt đầu
                          if (koiCheckInStatus && koiCheckInStatus.startDate) {
                            // Danh sách các trạng thái phải diễn ra sau KoiCheckIn
                            const statusesAfterKoiCheckIn = [
                              "Preliminary",
                              "Evaluation",
                              "Final",
                              "Exhibition",
                              "PublicResult",
                              "Award",
                            ];

                            // Nếu trạng thái hiện tại nằm trong danh sách phải diễn ra sau KoiCheckIn
                            // và ngày bắt đầu KoiCheckIn là sau ngày kết thúc đăng ký
                            // thì vô hiệu hóa cả ngày trước KoiCheckIn
                            if (
                              statusesAfterKoiCheckIn.includes(
                                status.statusName
                              )
                            ) {
                              return (
                                current &&
                                current.isBefore(
                                  koiCheckInStatus.startDate,
                                  "day"
                                )
                              );
                            }
                          }

                          return false;
                        }}
                      />
                      {getDateError(status, "startDate") && (
                        <p className="text-red-500 text-xs mt-1">
                          {getDateError(status, "startDate")}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <ClockCircleOutlined className="mr-1" /> Giờ bắt đầu
                        </label>
                        <TimePicker
                          className="w-full"
                          disabled={!status.startDate}
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
                                status.endDate.format("HH:mm:ss") !==
                                  "00:00:00" &&
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
                              // Trường hợp người dùng xoá giờ (clear)
                              handleDateChange(
                                index,
                                "startDate",
                                status.startDate.startOf("day")
                              );
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

                            // Tìm trạng thái trước đó dựa vào thứ tự các trạng thái
                            const statusOrder = {
                              RegistrationOpen: 1,
                              KoiCheckIn: 2,
                              TicketCheckIn: 3,
                              Preliminary: 4,
                              Evaluation: 5,
                              Final: 6,
                              Exhibition: 7,
                              PublicResult: 8,
                              Award: 9,
                              Finished: 10,
                            };

                            // Lấy thứ tự của trạng thái hiện tại
                            const currentOrder = statusOrder[status.statusName];

                            // Tìm trạng thái trước đó
                            const prevStatus = availableStatuses.find(
                              (s) =>
                                s.selected &&
                                s.endDate &&
                                statusOrder[s.statusName] === currentOrder - 1
                            );

                            // Nếu có trạng thái trước đó và cùng ngày với trạng thái hiện tại
                            if (prevStatus && prevStatus.endDate) {
                              if (
                                status.startDate &&
                                status.startDate.format("YYYY-MM-DD") ===
                                  prevStatus.endDate.format("YYYY-MM-DD")
                              ) {
                                // Vô hiệu hóa tất cả các giờ TRƯỚC giờ kết thúc của trạng thái trước đó
                                for (
                                  let i = 0;
                                  i < prevStatus.endDate.hour();
                                  i++
                                ) {
                                  if (!hoursDisabled.includes(i)) {
                                    hoursDisabled.push(i);
                                  }
                                }
                                // Nếu phút kết thúc của trạng thái trước là 59, vô hiệu hóa luôn giờ kết thúc
                                if (prevStatus.endDate.minute() === 59) {
                                  if (
                                    !hoursDisabled.includes(
                                      prevStatus.endDate.hour()
                                    )
                                  ) {
                                    hoursDisabled.push(
                                      prevStatus.endDate.hour()
                                    );
                                  }
                                }
                              }
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
                              for (let i = 0; i < now.minute(); i++) {
                                minutesDisabled.push(i);
                              }
                            }

                            // Tìm trạng thái trước đó dựa vào thứ tự các trạng thái
                            const statusOrder = {
                              RegistrationOpen: 1,
                              KoiCheckIn: 2,
                              TicketCheckIn: 3,
                              Preliminary: 4,
                              Evaluation: 5,
                              Final: 6,
                              Exhibition: 7,
                              PublicResult: 8,
                              Award: 9,
                              Finished: 10,
                            };

                            // Lấy thứ tự của trạng thái hiện tại
                            const currentOrder = statusOrder[status.statusName];

                            // Tìm trạng thái trước đó
                            const prevStatus = availableStatuses.find(
                              (s) =>
                                s.selected &&
                                s.endDate &&
                                statusOrder[s.statusName] === currentOrder - 1
                            );

                            // Nếu có trạng thái trước đó và nếu giờ được chọn trùng với giờ kết thúc của trạng thái trước
                            if (
                              prevStatus &&
                              prevStatus.endDate &&
                              selectedHour === prevStatus.endDate.hour() &&
                              status.startDate &&
                              status.startDate.format("YYYY-MM-DD") ===
                                prevStatus.endDate.format("YYYY-MM-DD")
                            ) {
                              // Vô hiệu hóa tất cả các phút từ 0 đến phút kết thúc của trạng thái trước
                              for (
                                let i = 0;
                                i <= prevStatus.endDate.minute();
                                i++
                              ) {
                                if (!minutesDisabled.includes(i)) {
                                  minutesDisabled.push(i);
                                }
                              }
                            }

                            return minutesDisabled;
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <ClockCircleOutlined className="mr-1" /> Giờ kết thúc
                        </label>
                        <TimePicker
                          className="w-full"
                          disabled={!status.startDate}
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
                                status.startDate.format("HH:mm:ss") !==
                                  "00:00:00" &&
                                (newEndDate.isBefore(status.startDate) ||
                                  newEndDate.isSame(status.startDate))
                              ) {
                                message.error(
                                  "Giờ kết thúc phải sau giờ bắt đầu"
                                );
                                return;
                              }

                              handleDateChange(index, "endDate", newEndDate);
                            } else if (status.startDate) {
                              // Trường hợp người dùng xoá giờ (clear)
                              handleDateChange(
                                index,
                                "endDate",
                                status.startDate.startOf("day")
                              );
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

                            // Tìm trạng thái trước đó dựa vào thứ tự các trạng thái
                            const statusOrder = {
                              RegistrationOpen: 1,
                              KoiCheckIn: 2,
                              TicketCheckIn: 3,
                              Preliminary: 4,
                              Evaluation: 5,
                              Final: 6,
                              Exhibition: 7,
                              PublicResult: 8,
                              Award: 9,
                              Finished: 10,
                            };

                            // Lấy thứ tự của trạng thái hiện tại
                            const currentOrder = statusOrder[status.statusName];

                            // Tìm trạng thái trước đó
                            const prevStatus = availableStatuses.find(
                              (s) =>
                                s.selected &&
                                s.endDate &&
                                statusOrder[s.statusName] === currentOrder - 1
                            );

                            // Nếu có trạng thái trước đó và cùng ngày với trạng thái hiện tại
                            if (prevStatus && prevStatus.endDate) {
                              if (
                                status.startDate &&
                                status.startDate.format("YYYY-MM-DD") ===
                                  prevStatus.endDate.format("YYYY-MM-DD")
                              ) {
                                // Vô hiệu hóa tất cả các giờ TRƯỚC giờ kết thúc của trạng thái trước đó
                                for (
                                  let i = 0;
                                  i < prevStatus.endDate.hour();
                                  i++
                                ) {
                                  if (!hoursDisabled.includes(i)) {
                                    hoursDisabled.push(i);
                                  }
                                }
                              }
                            }

                            // Kiểm tra tất cả các trạng thái có cùng ngày
                            if (status.startDate) {
                              // Tìm trạng thái tiếp theo dựa vào thứ tự các trạng thái
                              const statusOrder = {
                                RegistrationOpen: 1,
                                KoiCheckIn: 2,
                                TicketCheckIn: 3,
                                Preliminary: 4,
                                Evaluation: 5,
                                Final: 6,
                                Exhibition: 7,
                                PublicResult: 8,
                                Award: 9,
                                Finished: 10,
                              };

                              // Lấy thứ tự của trạng thái hiện tại
                              const currentOrder =
                                statusOrder[status.statusName];

                              // Tìm trạng thái tiếp theo
                              const nextStatus = availableStatuses.find(
                                (s) =>
                                  s.selected &&
                                  s.startDate &&
                                  statusOrder[s.statusName] === currentOrder + 1
                              );

                              // Nếu có trạng thái tiếp theo và cùng ngày với trạng thái hiện tại
                              if (nextStatus && nextStatus.startDate) {
                                if (
                                  status.startDate.format("YYYY-MM-DD") ===
                                  nextStatus.startDate.format("YYYY-MM-DD")
                                ) {
                                  // Chỉ vô hiệu hóa tất cả các giờ SAU giờ bắt đầu của trạng thái tiếp theo
                                  // KHÔNG vô hiệu hóa chính giờ bắt đầu, để người dùng có thể chọn đến đúng giờ đó
                                  for (
                                    let i = nextStatus.startDate.hour() + 1;
                                    i < 24;
                                    i++
                                  ) {
                                    if (!hoursDisabled.includes(i)) {
                                      hoursDisabled.push(i);
                                    }
                                  }
                                }
                              }
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
                              for (let i = 0; i < now.minute(); i++) {
                                minutesDisabled.push(i);
                              }
                            }

                            // Nếu đây là thời gian bắt đầu và cùng giờ với thời gian bắt đầu đã chọn
                            if (
                              status.startDate &&
                              selectedHour === status.startDate.hour()
                            ) {
                              for (
                                let i = 0;
                                i <= status.startDate.minute();
                                i++
                              ) {
                                if (!minutesDisabled.includes(i)) {
                                  minutesDisabled.push(i);
                                }
                              }
                            }

                            // Tìm trạng thái trước đó dựa vào thứ tự các trạng thái
                            const statusOrder = {
                              RegistrationOpen: 1,
                              KoiCheckIn: 2,
                              TicketCheckIn: 3,
                              Preliminary: 4,
                              Evaluation: 5,
                              Final: 6,
                              Exhibition: 7,
                              PublicResult: 8,
                              Award: 9,
                              Finished: 10,
                            };

                            // Lấy thứ tự của trạng thái hiện tại
                            const currentOrder = statusOrder[status.statusName];

                            // Tìm trạng thái trước đó
                            const prevStatus = availableStatuses.find(
                              (s) =>
                                s.selected &&
                                s.endDate &&
                                statusOrder[s.statusName] === currentOrder - 1
                            );

                            // Nếu có trạng thái trước đó và nếu giờ được chọn trùng với giờ kết thúc của trạng thái trước
                            if (
                              prevStatus &&
                              prevStatus.endDate &&
                              selectedHour === prevStatus.endDate.hour() &&
                              status.startDate &&
                              status.startDate.format("YYYY-MM-DD") ===
                                prevStatus.endDate.format("YYYY-MM-DD")
                            ) {
                              // Vô hiệu hóa tất cả các phút trước và bằng phút kết thúc của trạng thái trước
                              for (
                                let i = 0;
                                i <= prevStatus.endDate.minute();
                                i++
                              ) {
                                if (!minutesDisabled.includes(i)) {
                                  minutesDisabled.push(i);
                                }
                              }
                            }

                            return minutesDisabled;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default StepThree;
