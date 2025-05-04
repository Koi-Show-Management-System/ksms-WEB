import React, { useState, useEffect, useRef } from "react";
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
  Empty,
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

function StepThree({ updateFormData, initialData, showErrors }, ref) {
  // Ref to track if initial data has been loaded
  const isInitialDataLoaded = useRef(false);

  // Lấy danh sách quy tắc từ initialData
  const [rules, setRules] = useState(initialData.createShowRuleRequests || []);
  const [filteredRules, setFilteredRules] = useState(rules);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newRule, setNewRule] = useState({ title: "", content: "" });
  const [searchText, setSearchText] = useState("");
  // Add state for validation errors
  const [titleError, setTitleError] = useState("");

  // Add constant for max title length
  const MAX_TITLE_LENGTH = 100;

  // Lấy thông tin thời gian triển lãm từ initialData - không chuyển đổi múi giờ
  const exhibitionStartDate = initialData.startDate
    ? dayjs(initialData.startDate)
    : null;
  const exhibitionEndDate = initialData.endDate
    ? dayjs(initialData.endDate)
    : null;

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
  const [availableStatuses, setAvailableStatuses] = useState(() => {
    // Trước tiên kiểm tra localStorage xem có dữ liệu đã lưu không
    const savedStatuses = localStorage.getItem("koishow_statuses");
    if (savedStatuses) {
      try {
        console.log("Khôi phục dữ liệu từ localStorage");
        const parsedStatuses = JSON.parse(savedStatuses);
        // Chuyển đổi các chuỗi ngày tháng thành đối tượng dayjs
        return parsedStatuses.map((status) => ({
          ...status,
          startDate: status.startDate ? dayjs(status.startDate) : null,
          endDate: status.endDate ? dayjs(status.endDate) : null,
        }));
      } catch (e) {
        console.error("Lỗi khôi phục dữ liệu từ localStorage:", e);
      }
    }

    // Nếu có dữ liệu sẵn từ initialData.availableStatuses, sử dụng
    if (initialData.availableStatuses?.length > 0) {
      console.log("Khởi tạo từ availableStatuses có sẵn");
      return initialData.availableStatuses.map((status) => ({
        ...status,
        startDate: status.startDate ? dayjs(status.startDate) : null,
        endDate: status.endDate ? dayjs(status.endDate) : null,
      }));
    }

    // Nếu có dữ liệu từ createShowStatusRequests, sử dụng để khởi tạo
    if (initialData.createShowStatusRequests?.length > 0) {
      console.log("Khởi tạo từ createShowStatusRequests có sẵn");
      // Tạo danh sách cơ bản trước
      const baseStatuses = Object.entries(statusMapping).map(
        ([label, { key, description }]) => ({
          label,
          statusName: key,
          description,
          startDate: null,
          endDate: null,
          selected: true,
        })
      );

      // Cập nhật từ dữ liệu đã có
      initialData.createShowStatusRequests.forEach((savedStatus) => {
        const index = baseStatuses.findIndex(
          (status) => status.statusName === savedStatus.statusName
        );

        if (index !== -1) {
          baseStatuses[index] = {
            ...baseStatuses[index],
            startDate: savedStatus.startDate
              ? dayjs(savedStatus.startDate)
              : null,
            endDate: savedStatus.endDate ? dayjs(savedStatus.endDate) : null,
          };

          // Xử lý riêng cho Finished
          if (
            savedStatus.statusName === "Finished" &&
            baseStatuses[index].startDate
          ) {
            baseStatuses[index].endDate = baseStatuses[index].startDate
              .clone()
              .add(30, "minutes");
          }
        }
      });

      return baseStatuses;
    }

    // Nếu không có dữ liệu sẵn, khởi tạo mặc định
    console.log("Khởi tạo mặc định các trạng thái");
    return Object.entries(statusMapping).map(
      ([label, { key, description }]) => ({
        label,
        statusName: key,
        description,
        startDate: null,
        endDate: null,
        selected: true,
      })
    );
  });

  // Thêm state để theo dõi trạng thái đang được điền
  const [currentActiveStatusIndex, setCurrentActiveStatusIndex] = useState(0);

  // Lưu vào localStorage mỗi khi availableStatuses thay đổi
  useEffect(() => {
    // Chuyển đổi các đối tượng dayjs thành chuỗi để có thể lưu trong localStorage
    const statusesToSave = availableStatuses.map((status) => ({
      ...status,
      startDate: status.startDate ? status.startDate.format() : null,
      endDate: status.endDate ? status.endDate.format() : null,
    }));

    localStorage.setItem("koishow_statuses", JSON.stringify(statusesToSave));
    console.log("Đã lưu trạng thái vào localStorage");
  }, [availableStatuses]);

  // Xóa dữ liệu khỏi localStorage khi component unmount
  useEffect(() => {
    return () => {
      // Không xóa dữ liệu để có thể truy cập lại sau này
      // localStorage.removeItem('koishow_statuses');
    };
  }, []);

  // Lưu các giá trị trước đó của thời gian triển lãm để so sánh
  const prevExhibitionStartDate = useRef(null);
  const prevExhibitionEndDate = useRef(null);

  // Reset tất cả trạng thái KHI VÀ CHỈ KHI thời gian triển lãm thực sự thay đổi
  useEffect(() => {
    // Chỉ reset khi thời gian triển lãm thay đổi và có giá trị
    if (!exhibitionStartDate || !exhibitionEndDate) {
      return;
    }

    // Chuyển đổi sang chuỗi để so sánh
    const currentStartStr = exhibitionStartDate.format();
    const currentEndStr = exhibitionEndDate.format();

    // So sánh với giá trị trước đó
    if (
      prevExhibitionStartDate.current === currentStartStr &&
      prevExhibitionEndDate.current === currentEndStr
    ) {
      // Không có thay đổi thực sự, bỏ qua
      return;
    }

    // Chỉ khi lần đầu khởi tạo, đừng hiển thị thông báo và không reset
    if (
      prevExhibitionStartDate.current === null &&
      prevExhibitionEndDate.current === null
    ) {
      // Lưu giá trị hiện tại để so sánh lần sau
      prevExhibitionStartDate.current = currentStartStr;
      prevExhibitionEndDate.current = currentEndStr;
      return;
    }

    // Có thay đổi thực sự, lưu giá trị mới
    prevExhibitionStartDate.current = currentStartStr;
    prevExhibitionEndDate.current = currentEndStr;

    // Hiển thị thông báo xác nhận trước khi reset
    Modal.confirm({
      title: "Thời gian triển lãm đã thay đổi",
      content:
        "Bạn có muốn cài đặt lại tất cả thời gian cho các trạng thái không?",
      okText: "Đồng ý",
      cancelText: "Không",
      onOk: () => {
        // Reset tất cả các trạng thái về null
        const resetStatuses = availableStatuses.map((status) => ({
          ...status,
          startDate: null,
          endDate: null,
        }));

        setAvailableStatuses(resetStatuses);
        message.success("Đã reset tất cả thời gian cho các trạng thái.");
      },
    });
  }, [exhibitionStartDate, exhibitionEndDate]);

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
      .map((status) => {
        // Lưu giá trị thời gian gốc, không chuyển đổi múi giờ
        // Server cần time ở định dạng ISO và sẽ xử lý múi giờ
        let formattedStartDate = status.startDate
          ? status.startDate.format("YYYY-MM-DDTHH:mm:ss.SSS")
          : null;

        let formattedEndDate = status.endDate
          ? status.endDate.format("YYYY-MM-DDTHH:mm:ss.SSS")
          : status.startDate
            ? status.startDate.format("YYYY-MM-DDTHH:mm:ss.SSS")
            : null;

        return {
          statusName: status.statusName,
          description: status.description,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        };
      });

    // Format date objects in availableStatuses không đổi múi giờ
    const formattedAvailableStatuses = availableStatuses.map((status) => ({
      ...status,
      startDate: status.startDate
        ? status.startDate.format("YYYY-MM-DDTHH:mm:ss.SSS")
        : null,
      endDate: status.endDate
        ? status.endDate.format("YYYY-MM-DDTHH:mm:ss.SSS")
        : null,
    }));

    console.log("Đang cập nhật dữ liệu form từ StepThree", {
      rulesCount: rules.length,
      selectedStatusesCount: selectedStatuses.length,
      availableStatusesCount: formattedAvailableStatuses.length,
    });

    // Luôn cập nhật để đảm bảo dữ liệu được lưu đúng cách
    updateFormData({
      createShowRuleRequests: rules,
      createShowStatusRequests: selectedStatuses,
      availableStatuses: formattedAvailableStatuses,
    });

    setFilteredRules(rules);
  }, [rules, availableStatuses]); // Depend directly on availableStatuses để lưu mỗi khi có thay đổi

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
      // Check title length
      if (newRule.title.length > MAX_TITLE_LENGTH) {
        setTitleError(`Tiêu đề không được vượt quá ${MAX_TITLE_LENGTH} ký tự`);
        return;
      }

      setRules([...rules, newRule]);
      setNewRule({ title: "", content: "" });
      setTitleError(""); // Clear error message
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
    // Validate title length when editing
    if (field === "title" && value.length > MAX_TITLE_LENGTH) {
      message.error(`Tiêu đề không được vượt quá ${MAX_TITLE_LENGTH} ký tự`);
      return;
    }

    const updatedRules = [...rules];
    updatedRules[index][field] = value;
    setRules(updatedRules);
  };

  // Cập nhật trạng thái được chọn - Không còn cần thiết nhưng giữ lại cho tương thích ngược
  const handleStatusSelection = (index) => {
    // Không làm gì cả vì tất cả trạng thái đều phải được chọn
    return;
  };

  // Kiểm tra xem trạng thái có được điền hay không
  const isStatusEnabled = (index) => {
    // Luôn cho phép điền trạng thái đầu tiên (RegistrationOpen)
    if (index === 0) return true;

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

    // Lấy trạng thái trước đó dựa trên thứ tự
    const prevStatus = availableStatuses.find(
      (status) =>
        statusOrder[status.statusName] ===
        statusOrder[availableStatuses[index].statusName] - 1
    );

    // Nếu không tìm thấy trạng thái trước, cho phép điền
    if (!prevStatus) return true;

    // Kiểm tra xem trạng thái trước đã có đầy đủ thông tin chưa
    const isPrevComplete =
      prevStatus.startDate &&
      (prevStatus.statusName === "Finished" || prevStatus.endDate);

    return isPrevComplete;
  };

  // Khi một trạng thái được điền xong, tự động chuyển sang trạng thái tiếp theo
  useEffect(() => {
    const findNextIncompleteStatusIndex = () => {
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

      // Sắp xếp lại availableStatuses theo thứ tự
      const sortedStatuses = [...availableStatuses].sort(
        (a, b) => statusOrder[a.statusName] - statusOrder[b.statusName]
      );

      // Tìm trạng thái tiếp theo cần điền
      for (let i = 0; i < sortedStatuses.length; i++) {
        const status = sortedStatuses[i];
        const isComplete =
          status.startDate &&
          (status.statusName === "Finished" || status.endDate);

        if (!isComplete) {
          return availableStatuses.findIndex(
            (s) => s.statusName === status.statusName
          );
        }
      }

      // Nếu tất cả đã hoàn thành, trả về trạng thái đầu tiên
      return 0;
    };

    // Tìm index của status không hoàn chỉnh tiếp theo
    const nextIndex = findNextIncompleteStatusIndex();

    // Chỉ cập nhật nếu cần thiết để tránh vòng lặp vô hạn
    if (nextIndex !== currentActiveStatusIndex) {
      setCurrentActiveStatusIndex(nextIndex);
    }
  }, [availableStatuses]);

  // Cập nhật hàm handleDateChange để kiểm tra nếu trạng thái được phép điền
  const handleDateChange = (index, dateType, value) => {
    // Kiểm tra xem trạng thái có được phép điền không
    if (!isStatusEnabled(index)) {
      message.warning("Bạn phải điền xong trạng thái trước đó trước");
      return;
    }

    const updatedStatuses = [...availableStatuses];
    const currentStatus = updatedStatuses[index];
    const statusName = currentStatus.statusName;

    console.log(
      `Đang cập nhật ${dateType} cho ${statusName}:`,
      value ? value.format() : "null"
    );

    // Nếu đang set giá trị null hoặc undefined, cập nhật và return luôn
    if (!value) {
      updatedStatuses[index][dateType] = value;
      setAvailableStatuses(updatedStatuses);
      return;
    }

    // Kiểm tra tính hợp lệ của ngày tháng
    if (value) {
      // Nếu đây là trạng thái Finished, chỉ thực hiện các kiểm tra cần thiết
      if (statusName === "Finished") {
        // Kiểm tra thứ tự các trạng thái
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

        // Tìm trạng thái ngay trước đó
        const prevStatusName = Object.keys(statusOrder).find(
          (key) => statusOrder[key] === statusOrder[statusName] - 1
        );

        // Kiểm tra thứ tự thời gian với trạng thái trước (chỉ áp dụng cho startDate)
        if (prevStatusName && dateType === "startDate") {
          const prevStatus = availableStatuses.find(
            (s) =>
              s.selected &&
              s.endDate &&
              statusOrder[s.statusName] === statusOrder[statusName] - 1
          );

          if (prevStatus?.endDate) {
            // Nếu có trạng thái trước và có thời gian kết thúc, thì thời gian bắt đầu của Finished không được trước thời gian kết thúc đó
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

        // Nếu đang thay đổi startDate, tự động cập nhật endDate = startDate + 30 phút
        if (dateType === "startDate") {
          updatedStatuses[index].endDate = value.clone().add(30, "minutes");
        }

        // Cập nhật giá trị
        updatedStatuses[index][dateType] = value;
        setAvailableStatuses(updatedStatuses);
        return; // Kết thúc xử lý sớm cho Finished
      }

      // Đối với các giai đoạn khác RegistrationOpen, không tự động đặt giờ 00:00:00
      // Giữ nguyên giờ có thể là null để người dùng có thể chọn sau
      if (
        statusName !== "RegistrationOpen" &&
        value.format("HH:mm:ss") === "00:00:00"
      ) {
        // Đây là trường hợp người dùng chỉ mới chọn ngày, chưa chọn giờ
        // Không làm gì, giữ nguyên value mà không set giờ 00:00:00
      } else {
        // Trường hợp người dùng đã chọn cả ngày và giờ, hoặc đây là RegistrationOpen
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
      }

      // Kiểm tra RegistrationOpen phải diễn ra trước thời gian triển lãm
      if (statusName === "RegistrationOpen" && exhibitionStartDate) {
        // Kiểm tra xem ngày có phải là trước ngày triển lãm
        const selectedDay = value.startOf("day");
        const exhibitionDay = exhibitionStartDate.startOf("day");

        if (dateType === "startDate" && !selectedDay.isBefore(exhibitionDay)) {
          message.error(
            "Ngày bắt đầu đăng ký phải trước ngày bắt đầu triển lãm"
          );
          return;
        }

        if (dateType === "endDate" && !selectedDay.isBefore(exhibitionDay)) {
          message.error(
            "Ngày kết thúc đăng ký phải trước ngày bắt đầu triển lãm"
          );
          return;
        }
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
          (s) =>
            s.selected &&
            s.endDate &&
            statusOrder[s.statusName] === currentOrder - 1
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
          (s) =>
            s.selected &&
            s.startDate &&
            statusOrder[s.statusName] === currentOrder + 1
        );

        if (
          nextStatus?.endDate &&
          dateType === "endDate" &&
          statusName !== "Finished"
        ) {
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
      if (statusName === "Award" && dateType === "endDate") {
        // Không còn tự động cập nhật thời gian bắt đầu của Finished khi thời gian kết thúc Award thay đổi
        // Để người dùng tự chọn thời gian kết thúc sự kiện
      }
    }

    // Cập nhật giá trị cho trạng thái hiện tại
    updatedStatuses[index][dateType] = value;
    console.log(`Đã cập nhật ${dateType} cho ${statusName}`);

    setAvailableStatuses(updatedStatuses);
  };

  // Kiểm tra xem có lỗi về ngày không
  const getDateError = (status, dateType) => {
    if (!status.selected) return null;

    // Bỏ qua tất cả validation cho endDate của Finished status
    if (status.statusName === "Finished" && dateType === "endDate") {
      return null;
    }

    if (dateType === "startDate" && !status.startDate) {
      return "Ngày là bắt buộc";
    }

    // Kiểm tra xem ngày/giờ có nằm trong khoảng thời gian của triển lãm không (trừ RegistrationOpen)
    if (
      status.statusName !== "RegistrationOpen" &&
      dateType === "startDate" &&
      status.startDate &&
      exhibitionStartDate &&
      exhibitionEndDate
    ) {
      if (
        status.startDate.isBefore(exhibitionStartDate) ||
        status.startDate.isAfter(exhibitionEndDate)
      ) {
        return "Thời gian phải nằm trong khoảng thời gian của triển lãm";
      }
    }

    if (
      status.statusName !== "RegistrationOpen" &&
      dateType === "endDate" &&
      status.endDate &&
      exhibitionStartDate &&
      exhibitionEndDate
    ) {
      if (
        status.endDate.isBefore(exhibitionStartDate) ||
        status.endDate.isAfter(exhibitionEndDate)
      ) {
        return "Thời gian phải nằm trong khoảng thời gian của triển lãm";
      }
    }

    // Kiểm tra RegistrationOpen phải diễn ra trước thời gian triển lãm
    if (status.statusName === "RegistrationOpen" && exhibitionStartDate) {
      const startDay = status.startDate?.startOf("day");
      const endDay = status.endDate?.startOf("day");
      const exhibitionDay = exhibitionStartDate.startOf("day");

      if (
        dateType === "startDate" &&
        status.startDate &&
        !startDay.isBefore(exhibitionDay)
      ) {
        return "Ngày bắt đầu đăng ký phải trước ngày bắt đầu triển lãm";
      }

      if (
        dateType === "endDate" &&
        status.endDate &&
        !endDay.isBefore(exhibitionDay)
      ) {
        return "Ngày kết thúc đăng ký phải trước ngày bắt đầu triển lãm";
      }
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

  // Update input change handler for new rule
  const handleNewRuleTitleChange = (e) => {
    const value = e.target.value;

    if (value.length > MAX_TITLE_LENGTH) {
      setTitleError(`Tiêu đề không được vượt quá ${MAX_TITLE_LENGTH} ký tự`);
    } else {
      setTitleError("");
    }

    setNewRule({ ...newRule, title: value });
  };

  // Xóa dữ liệu khỏi localStorage khi form đã hoàn tất
  const clearLocalStorage = () => {
    localStorage.removeItem("koishow_statuses");
    console.log("Đã xóa dữ liệu trạng thái khỏi localStorage");
  };

  // Xuất hàm clearLocalStorage để component cha có thể gọi khi cần
  React.useImperativeHandle(
    ref,
    () => ({
      clearLocalStorage,
    }),
    []
  );

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
        locale={{
          emptyText: (
            <Empty
              description="Không có dữ liệu"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: "24px 0" }}
            />
          ),
        }}
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
                    maxLength={MAX_TITLE_LENGTH}
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
        onCancel={() => {
          setIsAddModalVisible(false);
          setTitleError(""); // Clear error when closing
          setNewRule({ title: "", content: "" });
        }}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Space direction="vertical" className="w-full">
          <Input
            value={newRule.title}
            onChange={handleNewRuleTitleChange}
            placeholder="Tiêu đề quy tắc..."
            maxLength={MAX_TITLE_LENGTH}
          />
          {titleError && (
            <p className="text-red-500 text-xs mt-1">{titleError}</p>
          )}
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

        {exhibitionStartDate && exhibitionEndDate && (
          <div className="p-3 bg-blue-50 rounded-md mb-4 border border-blue-200">
            <p className="text-blue-700">
              <InfoCircleOutlined className="mr-2" />
              Thời gian triển lãm: từ{" "}
              <strong>
                {exhibitionStartDate.format("DD/MM/YYYY HH:mm")}
              </strong>{" "}
              đến{" "}
              <strong>{exhibitionEndDate.format("DD/MM/YYYY HH:mm")}</strong>.
              Các trạng thái của sự kiện phải diễn ra trong khoảng thời gian
              này. Giai đoạn đăng ký chỉ được diễn ra trước khoảng thời gian
              triển lãm.
            </p>
          </div>
        )}

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
                  opacity: isStatusEnabled(index) ? 1 : 0.7,
                  border:
                    currentActiveStatusIndex === index
                      ? "2px solid #1890ff"
                      : "",
                }}
              >
                {status.statusName === "Finished" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CalendarOutlined className="mr-1" /> Ngày diễn ra
                      </label>
                      <DatePicker
                        className="w-full"
                        disabled={!status.selected || !isStatusEnabled(index)}
                        value={status.startDate}
                        onChange={(value) =>
                          handleDateChange(index, "startDate", value)
                        }
                        format="YYYY-MM-DD"
                        placeholder="Chọn ngày"
                        disabledDate={(current) => {
                          // Vô hiệu hóa ngày nằm ngoài khoảng thời gian triển lãm
                          if (exhibitionEndDate) {
                            const startDay = exhibitionStartDate.startOf("day");
                            const endDay = exhibitionEndDate.startOf("day");

                            if (
                              current.isBefore(startDay) ||
                              current.isAfter(endDay)
                            ) {
                              return true;
                            }
                            return false;
                          }

                          // Mặc định vô hiệu hóa ngày trong quá khứ
                          if (current && current.isBefore(dayjs(), "day")) {
                            return true;
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <ClockCircleOutlined className="mr-1" /> Giờ kết thúc
                      </label>
                      <TimePicker
                        className="w-full"
                        disabled={!status.selected || !isStatusEnabled(index)}
                        value={status.startDate}
                        onChange={(value) => {
                          if (value && status.startDate) {
                            // Cập nhật giờ cho startDate
                            const newStartDate = status.startDate
                              .hour(value.hour())
                              .minute(value.minute())
                              .second(value.second());

                            // Kiểm tra giờ có nằm trong khoảng thời gian của triển lãm
                            if (exhibitionStartDate && exhibitionEndDate) {
                              if (
                                newStartDate.isBefore(exhibitionStartDate) ||
                                newStartDate.isAfter(exhibitionEndDate)
                              ) {
                                message.error(
                                  "Thời gian kết thúc phải nằm trong khoảng thời gian của triển lãm"
                                );
                                return;
                              }
                            }

                            // Định nghĩa thứ tự các trạng thái để tìm trạng thái trước đó
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

                            // Tìm trạng thái ngay trước đó
                            const prevStatusName = Object.keys(
                              statusOrder
                            ).find(
                              (key) =>
                                statusOrder[key] === statusOrder["Finished"] - 1
                            );

                            // Kiểm tra thứ tự thời gian với trạng thái trước (thường là Award)
                            if (prevStatusName) {
                              const prevStatus = availableStatuses.find(
                                (s) =>
                                  s.selected &&
                                  s.endDate &&
                                  s.statusName === prevStatusName
                              );

                              if (prevStatus?.endDate) {
                                // Nếu có trạng thái trước và có thời gian kết thúc, thì thời gian bắt đầu không được trước thời gian kết thúc đó
                                if (
                                  prevStatus.endDate.format("HH:mm:ss") !==
                                    "00:00:00" &&
                                  newStartDate.isBefore(prevStatus.endDate)
                                ) {
                                  message.error(
                                    `Giờ bắt đầu phải sau giờ kết thúc của "${prevStatus.label}"`
                                  );
                                  return;
                                }
                              }
                            }

                            handleDateChange(index, "startDate", newStartDate);
                          }
                        }}
                        format="HH:mm"
                        placeholder="Chọn giờ"
                        popupClassName="timezone-popup"
                        allowClear={true}
                        disabledTime={(selectedHour) => {
                          const disabledHours = [];
                          const now = dayjs().tz("Asia/Ho_Chi_Minh");
                          const isToday =
                            status.startDate &&
                            now.date() === status.startDate.date() &&
                            now.month() === status.startDate.month() &&
                            now.year() === status.startDate.year();

                          if (isToday) {
                            for (let i = 0; i < now.hour(); i++) {
                              disabledHours.push(i);
                            }
                          }

                          return {
                            disabledHours: () => disabledHours,
                            disabledMinutes: (selectedHour) => {
                              const minutesDisabled = [];
                              if (isToday && selectedHour === now.hour()) {
                                for (let i = 0; i < now.minute(); i++) {
                                  minutesDisabled.push(i);
                                }
                              }
                              return minutesDisabled;
                            },
                          };
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
                        disabled={!status.selected || !isStatusEnabled(index)}
                        value={status.startDate}
                        onChange={(value) =>
                          handleDateChange(index, "startDate", value)
                        }
                        format="YYYY-MM-DD HH:mm:ss"
                        placeholder="Chọn ngày bắt đầu"
                        showNow={false}
                        popupClassName="timezone-popup"
                        renderExtraFooter={() => (
                          <div className="text-xs text-gray-500 text-right"></div>
                        )}
                        disabledDate={(current) => {
                          // Không vô hiệu hóa ngày sau triển lãm, chỉ hiện thông báo lỗi
                          return false; // Cho phép chọn tất cả các ngày
                        }}
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
                        disabled={!status.selected || !isStatusEnabled(index)}
                        value={status.endDate}
                        onChange={(value) =>
                          handleDateChange(index, "endDate", value)
                        }
                        format="YYYY-MM-DD HH:mm:ss"
                        placeholder="Chọn ngày kết thúc"
                        showNow={false}
                        popupClassName="timezone-popup"
                        renderExtraFooter={() => (
                          <div className="text-xs text-gray-500 text-right"></div>
                        )}
                        disabledDate={(current) => {
                          // Chỉ vô hiệu hóa ngày trước ngày bắt đầu của giai đoạn đăng ký
                          if (
                            status.startDate &&
                            current.isBefore(status.startDate, "day")
                          ) {
                            return true;
                          }

                          // Không vô hiệu hóa ngày sau triển lãm, chỉ hiện thông báo lỗi
                          return false; // Cho phép chọn tất cả các ngày
                        }}
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
                        disabled={!status.selected || !isStatusEnabled(index)}
                        value={status.startDate}
                        onChange={(value) => {
                          // Chỉ cập nhật ngày, KHÔNG tự động thêm giờ 00:00
                          if (value) {
                            // KHÔNG tự động thêm giờ 00:00 mà để giờ là null
                            const dateOnly = value;
                            handleDateChange(index, "startDate", dateOnly);

                            // Cập nhật cùng ngày cho endDate nếu đã có
                            if (status.endDate) {
                              let newEndDate;
                              if (
                                status.endDate.hour() ||
                                status.endDate.minute() ||
                                status.endDate.second()
                              ) {
                                // Nếu endDate đã có giờ cụ thể, giữ lại giờ đó
                                newEndDate = value
                                  .hour(status.endDate.hour())
                                  .minute(status.endDate.minute())
                                  .second(status.endDate.second());
                              } else {
                                // Nếu endDate chưa có giờ, đặt cùng ngày không giờ
                                newEndDate = value;
                              }
                              handleDateChange(index, "endDate", newEndDate);
                            }
                          } else {
                            // Trường hợp xóa ngày
                            handleDateChange(index, "startDate", null);
                            // Nếu không có ngày, cũng xóa giờ
                            if (status.endDate) {
                              handleDateChange(index, "endDate", null);
                            }
                          }
                        }}
                        format="YYYY-MM-DD"
                        placeholder="Chọn ngày"
                        disabledDate={(current) => {
                          // Giới hạn ngày chỉ trong khoảng thời gian triển lãm
                          if (exhibitionStartDate && exhibitionEndDate) {
                            // Lấy ngày bắt đầu và kết thúc của triển lãm (không có giờ)
                            const startExhDay =
                              exhibitionStartDate.startOf("day");
                            const endExhDay = exhibitionEndDate.startOf("day");

                            // Chỉ cho phép chọn ngày trong khoảng của triển lãm
                            if (
                              current.isBefore(startExhDay, "day") ||
                              current.isAfter(endExhDay, "day")
                            ) {
                              return true; // Vô hiệu hóa ngày
                            }
                          } else {
                            // Nếu không có thông tin về triển lãm, chỉ vô hiệu hóa ngày trong quá khứ
                            if (current.isBefore(dayjs(), "day")) {
                              return true;
                            }
                          }

                          return false; // Cho phép chọn ngày
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
                          disabled={
                            !status.startDate || !isStatusEnabled(index)
                          }
                          value={status.startDate}
                          onChange={(value) => {
                            if (value && status.startDate) {
                              // Chỉ cập nhật giờ, giữ nguyên ngày
                              const newDate = status.startDate
                                .hour(value.hour())
                                .minute(value.minute())
                                .second(value.second());

                              // Kiểm tra giờ bắt đầu có nằm trong khoảng thời gian của triển lãm
                              if (exhibitionStartDate && exhibitionEndDate) {
                                if (
                                  newDate.isBefore(exhibitionStartDate) ||
                                  newDate.isAfter(exhibitionEndDate)
                                ) {
                                  message.error(
                                    "Giờ bắt đầu phải nằm trong khoảng thời gian của triển lãm"
                                  );
                                  return;
                                }
                              }

                              // Kiểm tra xem giờ bắt đầu có trước giờ kết thúc không nếu đã có giờ kết thúc
                              const hasEndTime =
                                status.endDate &&
                                status.endDate.format("HH:mm:ss") !==
                                  "00:00:00";
                              if (
                                hasEndTime &&
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
                                status.startDate // Giữ nguyên ngày, không có giờ
                              );
                            }
                          }}
                          format="HH:mm"
                          placeholder="Giờ bắt đầu"
                          popupClassName="timezone-popup"
                          renderExtraFooter={() => (
                            <div className="text-xs text-gray-500 text-right"></div>
                          )}
                          allowClear={true}
                          disabledTime={(selectedHour) => {
                            // Đơn giản hóa các ràng buộc về giờ
                            const disabledHours = [];

                            // Chỉ vô hiệu hóa các giờ trong quá khứ của ngày hiện tại
                            const now = dayjs().tz("Asia/Ho_Chi_Minh");
                            const isToday =
                              status.startDate &&
                              now.date() === status.startDate.date() &&
                              now.month() === status.startDate.month() &&
                              now.year() === status.startDate.year();

                            if (isToday) {
                              for (let i = 0; i < now.hour(); i++) {
                                disabledHours.push(i);
                              }
                            }

                            return {
                              disabledHours: () => disabledHours,
                              disabledMinutes: (selectedHour) => {
                                const minutesDisabled = [];

                                // Chỉ vô hiệu hóa phút trong quá khứ nếu là giờ hiện tại
                                if (isToday && selectedHour === now.hour()) {
                                  for (let i = 0; i < now.minute(); i++) {
                                    minutesDisabled.push(i);
                                  }
                                }

                                return minutesDisabled;
                              },
                            };
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <ClockCircleOutlined className="mr-1" /> Giờ kết thúc
                        </label>
                        <TimePicker
                          className="w-full"
                          disabled={
                            !status.startDate || !isStatusEnabled(index)
                          }
                          value={status.endDate}
                          onChange={(value) => {
                            if (value && status.startDate) {
                              // Tạo ngày kết thúc với ngày giống startDate nhưng giờ từ timepicker
                              const newEndDate = status.startDate
                                .hour(value.hour())
                                .minute(value.minute())
                                .second(value.second());

                              // Kiểm tra giờ kết thúc có nằm trong khoảng thời gian của triển lãm
                              if (exhibitionStartDate && exhibitionEndDate) {
                                if (
                                  newEndDate.isBefore(exhibitionStartDate) ||
                                  newEndDate.isAfter(exhibitionEndDate)
                                ) {
                                  message.error(
                                    "Giờ kết thúc phải nằm trong khoảng thời gian của triển lãm"
                                  );
                                  return;
                                }
                              }

                              // Kiểm tra xem giờ kết thúc có sau giờ bắt đầu không
                              const hasStartTime =
                                status.startDate.format("HH:mm:ss") !==
                                "00:00:00";
                              if (
                                hasStartTime &&
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
                                status.startDate // Giữ nguyên ngày, không có giờ
                              );
                            }
                          }}
                          format="HH:mm"
                          placeholder="Giờ kết thúc"
                          popupClassName="timezone-popup"
                          renderExtraFooter={() => (
                            <div className="text-xs text-gray-500 text-right"></div>
                          )}
                          allowClear={true}
                          // Loại bỏ disabledDate - chỉ dựa vào ngày đã chọn từ datepicker
                          disabledTime={(selectedHour) => {
                            // Đơn giản hóa các ràng buộc về giờ
                            const disabledHours = [];

                            // Chỉ vô hiệu hóa các giờ trong quá khứ của ngày hiện tại
                            const now = dayjs().tz("Asia/Ho_Chi_Minh");
                            const isToday =
                              status.startDate &&
                              now.date() === status.startDate.date() &&
                              now.month() === status.startDate.month() &&
                              now.year() === status.startDate.year();

                            if (isToday) {
                              for (let i = 0; i < now.hour(); i++) {
                                disabledHours.push(i);
                              }
                            }

                            return {
                              disabledHours: () => disabledHours,
                              disabledMinutes: (selectedHour) => {
                                const minutesDisabled = [];

                                // Chỉ vô hiệu hóa phút trong quá khứ nếu là giờ hiện tại
                                if (isToday && selectedHour === now.hour()) {
                                  for (let i = 0; i < now.minute(); i++) {
                                    minutesDisabled.push(i);
                                  }
                                }

                                return minutesDisabled;
                              },
                            };
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

export default React.forwardRef(StepThree);
