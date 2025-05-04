import React, { useEffect, useState, useCallback } from "react";
import {
  Collapse,
  Timeline,
  Card,
  Image,
  Tabs,
  notification,
  Modal,
  Button,
  Form,
  Input,
  DatePicker,
  InputNumber,
  message,
  Upload,
  Popconfirm,
  Menu,
  Space,
  Select,
} from "antd";
import dayjs from "dayjs";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CloseOutlined,
  TagOutlined,
  NumberOutlined,
  DollarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import koiFishImage from "../../../../assets/koiFishImage.png";
import sponsorLogo1 from "../../../../assets/sponsorLogo1.png";
import Category from "./Category";
import ManageShow from "./ManageShow";
import Votes from "./Votes";
import Rules from "./Rules";
import Sponsor from "./Sponsor";
import { useParams, useSearchParams } from "react-router-dom";
import useKoiShow from "../../../../hooks/useKoiShow";
import { Loading } from "../../../../components";
import useTicketType from "../../../../hooks/useTicketType";
import CompetitionRound from "./CompetitionRound";
import Registration from "./Registration";
import Tank from "./Tank";
import Ticket from "./Ticket";
import TicketForm from "./TicketForm";
import RoundResult from "./RoundResult";
import StatusManager from "./StatusManager";
import Cookies from "js-cookie";
import useCategory from "../../../../hooks/useCategory";

function KoiShowDetail() {
  const { Panel } = Collapse;
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const showStatus = searchParams.get("status");
  const isEditDisabled = [
    "published",
    "upcoming",
    "inprogress",
    "finished",
    "cancelled",
  ].includes(showStatus);
  const { koiShowDetail, isLoading, fetchKoiShowDetail, updateKoiShow } =
    useKoiShow();
  const [form] = Form.useForm();

  // Constants for validation limits (matching StepOne)
  const MAX_NAME_LENGTH = 100;
  const MAX_PARTICIPANTS = 10000;
  const MAX_TICKET_PRICE = 10000000; // 10 million VND
  const MAX_TICKET_QUANTITY = 1000000; // 1 million tickets
  const MAX_INVESTMENT = 100000000000; // 100 billion VND

  // Lấy role từ cookies
  const userRole = Cookies.get("__role");
  const isStaff = userRole === "Staff";

  // Error states for validation
  const [nameError, setNameError] = useState("");
  const [participantErrors, setParticipantErrors] = useState({
    minParticipants: "",
    maxParticipants: "",
  });
  const [timeErrors, setTimeErrors] = useState({
    startDate: "",
    endDate: "",
  });

  const [showAll, setShowAll] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [fileList, setFileList] = useState([]);
  const { createTicketType, updateTicketType, deleteTicketType } =
    useTicketType();
  const [ticketForm] = Form.useForm();
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const sponsors = koiShowDetail?.data?.sponsors || [];
  const displaySponsors = showAll ? sponsors : sponsors.slice(0, 2);
  const extraCount = sponsors.length - 2;
  const showRule = koiShowDetail?.data?.showRules;
  const [activeTabKey, setActiveTabKey] = useState("category");
  const [cancelledCategoryIds, setCancelledCategoryIds] = useState([]);
  const { categories, fetchCategories } = useCategory();
  const [votesComponent, setVotesComponent] = useState(null);

  const statusMapping = {
    RegistrationOpen: { label: "Có Thể Đăng Ký", color: "blue" },
    RegistrationClosed: { label: "Đóng Đăng Ký", color: "red" },
    CheckIn: { label: "Điểm danh", color: "cyan" },
    Preliminary: { label: "Vòng Sơ Khảo", color: "green" },
    Evaluation: { label: "Vòng Đánh Giá Chính", color: "purple" },
    Final: { label: "Vòng Chung Kết", color: "orange" },
    GrandChampion: { label: "Grand Champion", color: "yellow" },
    Completed: { label: "Hoàn Thành ", color: "gray" },
    Exhibition: { label: "Triễn Lãm ", color: "teal" },
    Finished: { label: "Kết Thúc", color: "brown" },
  };

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

  // Thêm hàm xử lý sự kiện hủy hạng mục lên trước
  const handleCategoryCancel = (categoryId) => {
    setCancelledCategoryIds((prev) => [...prev, categoryId]);
  };

  // Sử dụng useCallback để đảm bảo hàm không bị tạo lại mỗi lần render
  const fetchDetailCallback = useCallback(() => {
    if (id) {
      fetchKoiShowDetail(id);
    }
  }, [id, fetchKoiShowDetail]);

  useEffect(() => {
    fetchDetailCallback();
  }, [fetchDetailCallback]);

  // Thêm useEffect để lấy danh sách hạng mục bị hủy
  useEffect(() => {
    const getCancelledCategories = async () => {
      try {
        await fetchCategories(id);

        // Lọc ra các hạng mục bị hủy
        const cancelledIds = categories
          .filter((category) => category.status === "cancelled")
          .map((category) => category.id);

        setCancelledCategoryIds(cancelledIds);
      } catch (error) {
        console.error("Error fetching cancelled categories:", error);
      }
    };

    if (id) {
      getCancelledCategories();
    }
  }, [id]);

  useEffect(() => {
    // Pre-render Votes component to keep it mounted
    setVotesComponent(<Votes showId={id} />);
  }, [id]);

  // Function to open edit modal
  const openEditModal = () => {
    // Reset error states
    setNameError("");
    setParticipantErrors({
      minParticipants: "",
      maxParticipants: "",
    });
    setTimeErrors({
      startDate: "",
      endDate: "",
    });

    // Set initial form values
    form.setFieldsValue({
      name: koiShowDetail.data.name,
      description: koiShowDetail.data.description,
      location: koiShowDetail.data.location,
      startDate: dayjs(koiShowDetail.data.startDate),
      endDate: dayjs(koiShowDetail.data.endDate),
      startExhibitionDate: dayjs(koiShowDetail.data.startExhibitionDate),
      endExhibitionDate: dayjs(koiShowDetail.data.endExhibitionDate),
      minParticipants: koiShowDetail.data.minParticipants,
      maxParticipants: koiShowDetail.data.maxParticipants,
    });

    // Initialize fileList with current image if available
    if (koiShowDetail.data.imgUrl) {
      setFileList([
        {
          uid: "-1",
          name: "current-image.jpg",
          status: "done",
          url: koiShowDetail.data.imgUrl,
        },
      ]);
    } else {
      setFileList([]);
    }

    setEditModalVisible(true);
  };

  // Handle name validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length > MAX_NAME_LENGTH) {
      setNameError(
        `Tên chương trình không được vượt quá ${MAX_NAME_LENGTH} ký tự`
      );
    } else {
      setNameError("");
    }
    form.setFieldsValue({ name: value });
  };

  // Handle participant validation
  const handleParticipantChange = (field, value) => {
    // Validate participant numbers
    const newParticipantErrors = { ...participantErrors };

    if (value > MAX_PARTICIPANTS) {
      newParticipantErrors[field] =
        `Giá trị không được vượt quá ${MAX_PARTICIPANTS.toLocaleString("vi-VN")}`;
      setParticipantErrors(newParticipantErrors);
      return;
    }

    if (field === "minParticipants") {
      const maxValue = form.getFieldValue("maxParticipants");
      if (maxValue && value >= maxValue) {
        newParticipantErrors.minParticipants =
          "Số lượng tối thiểu phải nhỏ hơn số lượng tối đa";
      } else {
        newParticipantErrors.minParticipants = "";
      }
    } else if (field === "maxParticipants") {
      const minValue = form.getFieldValue("minParticipants");
      if (minValue && value <= minValue) {
        newParticipantErrors.maxParticipants =
          "Số lượng tối đa phải lớn hơn số lượng tối thiểu";
      } else {
        newParticipantErrors.maxParticipants = "";
      }
    }

    setParticipantErrors(newParticipantErrors);
    form.setFieldsValue({ [field]: value });
  };

  // Handle date validation
  const handleDateChange = (field, value) => {
    const newTimeErrors = { ...timeErrors };

    if (!value) {
      newTimeErrors[field] = "Vui lòng chọn ngày.";
    } else {
      newTimeErrors[field] = "";

      if (field === "startDate") {
        const endDate = form.getFieldValue("endDate");
        if (endDate && value.isAfter(endDate)) {
          form.setFieldsValue({ endDate: value });
        }
      } else if (field === "endDate") {
        const startDate = form.getFieldValue("startDate");
        if (startDate && value.isBefore(startDate)) {
          newTimeErrors[field] = "Ngày kết thúc không thể trước ngày bắt đầu.";
        }
      }
    }

    setTimeErrors(newTimeErrors);
    form.setFieldsValue({ [field]: value });
  };

  // Handle image upload
  const handleImageUpload = async ({ fileList }) => {
    setFileList(fileList);

    try {
      // Only process if there are new files to upload
      const newFiles = fileList.filter((file) => file.originFileObj);

      if (newFiles.length === 0) return;

      const uploadedImages = await Promise.all(
        newFiles.map(async (file) => {
          if (file.originFileObj) {
            const formData = new FormData();
            formData.append("file", file.originFileObj);
            formData.append("upload_preset", "ml_default");

            const response = await fetch(
              "https://api.cloudinary.com/v1_1/dphupjpqt/image/upload",
              {
                method: "POST",
                body: formData,
              }
            );

            const data = await response.json();

            if (!response.ok) {
              console.error("Cloudinary upload error:", data);
              throw new Error(data.error.message || "Image upload failed");
            }

            // Update the file object with the new URL
            file.url = data.secure_url;
            file.status = "done";

            return data.secure_url;
          }
          return null;
        })
      );

      const filteredImages = uploadedImages.filter((url) => url !== null);
      setUploadedImages(filteredImages);

      // Set the first image as the imgUrl in the form
      if (filteredImages.length > 0) {
        form.setFieldsValue({ imgUrl: filteredImages[0] });
      }

      message.success("Ảnh đã được tải lên thành công!");
    } catch (error) {
      console.error("Error uploading images:", error);
      message.error("Lỗi khi tải ảnh lên!");
    }
  };

  const handleUpdate = async () => {
    try {
      // Validate form fields
      const values = await form.validateFields();

      // Check for validation errors
      if (
        nameError ||
        participantErrors.minParticipants ||
        participantErrors.maxParticipants ||
        timeErrors.startDate ||
        timeErrors.endDate
      ) {
        // Show validation error message
        notification.error({
          key: "validationError",
          message: "Lỗi nhập liệu",
          description: "Vui lòng kiểm tra và sửa các lỗi trước khi cập nhật.",
          placement: "topRight",
        });
        return;
      }

      // Check if min participants is less than max participants
      if (values.minParticipants >= values.maxParticipants) {
        setParticipantErrors({
          ...participantErrors,
          minParticipants: "Số lượng tối thiểu phải nhỏ hơn số lượng tối đa",
        });
        notification.error({
          key: "participantError",
          message: "Lỗi nhập liệu",
          description:
            "Số lượng tham gia tối thiểu phải nhỏ hơn số lượng tối đa.",
          placement: "topRight",
        });
        return;
      }

      const formattedValues = {
        ...values,
        startDate: values.startDate?.format("YYYY-MM-DDTHH:mm:ss"),
        endDate: values.endDate?.format("YYYY-MM-DDTHH:mm:ss"),
        startExhibitionDate: null,
        endExhibitionDate: null,
      };

      if (uploadedImages.length > 0) {
        formattedValues.imgUrl = uploadedImages[0];
      } else if (fileList.length > 0 && fileList[0].url) {
        formattedValues.imgUrl = fileList[0].url;
      }

      const updateData = Object.fromEntries(
        Object.entries(formattedValues).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      );

      setEditModalVisible(false);

      try {
        const result = await updateKoiShow(id, updateData);

        if (result.success) {
          // Success notification
          notification.success({
            key: "Thành công",
            message: "Cập nhật thành công",
            description: "Koi Show đã được cập nhật thành công!",
            placement: "topRight",
          });

          // Refresh data
          await fetchKoiShowDetail(id);

          // Reset form and state
          form.resetFields();
          setUploadedImages([]);
          setFileList([]);
        } else {
          // Error notification
          notification.error({
            key: "updateError",
            message: "Cập nhật thất bại",
            description:
              result.message || "Đã có lỗi xảy ra, vui lòng thử lại!",
            placement: "topRight",
          });

          setTimeout(() => {
            setEditModalVisible(true);
          }, 100);
        }
      } catch (apiError) {
        // Error notification
        notification.error({
          key: "updateError",
          message: "Cập nhật thất bại",
          description:
            apiError.message || "Đã có lỗi xảy ra, vui lòng thử lại!",
          placement: "topRight",
        });

        // Reopen modal if there was an error
        setTimeout(() => {
          setEditModalVisible(true);
        }, 100);
      }
    } catch (validationError) {
      console.error("Validation error:", validationError);
    }
  };

  // Upload button for the form
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  if (isLoading) return <Loading />;

  if (!koiShowDetail) {
    return (
      <p className="text-red-500 text-center">Không có thông tin triển lãm.</p>
    );
  }

  const items = [
    {
      key: "category",
      label: "Hạng Mục",
      children: (
        <div
          style={{ display: activeTabKey === "category" ? "block" : "none" }}
        >
          <Category
            showId={id}
            statusShow={showStatus}
            onCategoryCancel={handleCategoryCancel}
          />
        </div>
      ),
    },
    {
      key: "koiList",
      label: "Đơn Đăng Ký",
      children: (
        <div style={{ display: activeTabKey === "koiList" ? "block" : "none" }}>
          <Registration
            showId={id}
            statusShow={koiShowDetail.data.status}
            cancelledCategoryIds={cancelledCategoryIds}
          />
        </div>
      ),
    },
    {
      key: "ticket",
      label: "Quản lý vé",
      children: (
        <div style={{ display: activeTabKey === "ticket" ? "block" : "none" }}>
          <Ticket showId={id} statusShow={koiShowDetail.data.status} />
        </div>
      ),
    },
    {
      key: "manageShow",
      label: "Quản Lý Triển Lãm",
      children: (
        <div
          style={{ display: activeTabKey === "manageShow" ? "block" : "none" }}
        >
          <ManageShow showId={id} />
        </div>
      ),
    },
    {
      key: "tank",
      label: "Quản Lý Bể",
      children: (
        <div style={{ display: activeTabKey === "tank" ? "block" : "none" }}>
          <Tank showId={id} />
        </div>
      ),
    },
    {
      key: "competitionRound",
      label: "Vòng Thi",
      children: (
        <div
          style={{
            display: activeTabKey === "competitionRound" ? "block" : "none",
          }}
        >
          <CompetitionRound showId={id} />
        </div>
      ),
    },
    {
      key: "roundResult",
      label: "Kết Quả Cuối Cùng",
      children: (
        <div
          style={{ display: activeTabKey === "roundResult" ? "block" : "none" }}
        >
          <RoundResult showId={id} />
        </div>
      ),
    },
    {
      key: "votes",
      label: "Bình Chọn",
      children: (
        <div style={{ display: activeTabKey === "votes" ? "block" : "none" }}>
          {votesComponent}
        </div>
      ),
    },
    {
      key: "rules",
      label: "Quy Tắc",
      children: (
        <div style={{ display: activeTabKey === "rules" ? "block" : "none" }}>
          <Rules showId={id} showRule={showRule} />
        </div>
      ),
    },
    {
      key: "sponsor",
      label: "Tài Trợ",
      children: (
        <div style={{ display: activeTabKey === "sponsor" ? "block" : "none" }}>
          <Sponsor showId={id} />
        </div>
      ),
    },
  ];

  // Function to open ticket management modal
  const openTicketModal = () => {
    ticketForm.resetFields();
    setEditingTicket(null);
    setTicketModalVisible(true);
  };

  // Function to handle editing a ticket
  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    ticketForm.setFieldsValue({
      name: ticket.name,
      price: ticket.price,
      availableQuantity: ticket.availableQuantity,
    });
    setShowTicketForm(true); // Show the edit form
  };

  // Function to handle deleting a ticket
  const handleDeleteTicket = async (ticketId) => {
    try {
      const result = await deleteTicketType(ticketId);

      if (result.success) {
        notification.success({
          message: "Xóa thành công",
          description: "Vé đã được xóa thành công!",
          placement: "topRight",
        });

        // Refresh data
        await fetchKoiShowDetail(id);
      } else {
        notification.error({
          message: "Xóa thất bại",
          description: result.message || "Đã có lỗi xảy ra, vui lòng thử lại!",
          placement: "topRight",
        });
      }
    } catch (error) {
      notification.error({
        message: "Xóa thất bại",
        description: error.message || "Đã có lỗi xảy ra, vui lòng thử lại!",
        placement: "topRight",
      });
    }
  };

  // Function to handle ticket validation on submit
  const handleTicketSubmit = async (values) => {
    try {
      // Validate ticket fields
      if (values.price < 0 || values.price > MAX_TICKET_PRICE) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: `Giá vé phải lớn hơn 0 và không được vượt quá ${MAX_TICKET_PRICE.toLocaleString("vi-VN")} VND (10 triệu)`,
          placement: "topRight",
        });
        return;
      }

      if (
        values.availableQuantity < 0 ||
        values.availableQuantity > MAX_TICKET_QUANTITY
      ) {
        notification.error({
          message: "Lỗi nhập liệu",
          description: `Số lượng vé phải lớn hơn 0 và không được vượt quá ${MAX_TICKET_QUANTITY.toLocaleString("vi-VN")} vé (1 triệu)`,
          placement: "topRight",
        });
        return;
      }

      if (editingTicket) {
        // Update existing ticket
        const result = await updateTicketType(editingTicket.id, values);

        if (result.success) {
          notification.success({
            message: "Cập nhật thành công",
            description: "Vé đã được cập nhật thành công!",
            placement: "topRight",
          });

          // Refresh data
          await fetchKoiShowDetail(id);
          ticketForm.resetFields();
          setEditingTicket(null);
          setShowTicketForm(false); // Hide the form after successful update
        } else {
          notification.error({
            message: "Cập nhật thất bại",
            description:
              result.message || "Đã có lỗi xảy ra, vui lòng thử lại!",
            placement: "topRight",
          });
        }
      } else {
        // Create new ticket
        const result = await createTicketType(id, values);

        if (result.success) {
          notification.success({
            message: "Tạo vé thành công",
            description: "Vé mới đã được tạo thành công!",
            placement: "topRight",
          });

          // Refresh data
          await fetchKoiShowDetail(id);
          ticketForm.resetFields();
          setShowTicketForm(false); // Hide the form after successful creation
        } else {
          notification.error({
            message: "Tạo vé thất bại",
            description:
              result.message || "Đã có lỗi xảy ra, vui lòng thử lại!",
            placement: "topRight",
          });
        }
      }
    } catch (validationError) {
      console.error("Validation error:", validationError);
      notification.warning({
        message: "Lỗi nhập liệu",
        description: "Vui lòng kiểm tra lại thông tin và thử lại!",
        placement: "topRight",
      });
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-2 md:p-4">
      <Collapse
        defaultActiveKey={["info"]}
        ghost
        items={[
          {
            key: "info",
            label: (
              <div className="flex items-center justify-between w-full">
                <h1 className="text-xl md:text-2xl font-semibold">
                  {koiShowDetail.data.name}
                </h1>
                {!isEditDisabled && !isStaff && (
                  <div
                    onClick={openEditModal}
                    className="text-blue-500 hover:text-blue-700 cursor-pointer"
                  >
                    <EditOutlined style={{ fontSize: "18px" }} />
                  </div>
                )}
              </div>
            ),
            children: (
              <>
                <p className="text-gray-600 text-sm md:text-base">
                  {koiShowDetail.data.description}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 my-4">
                  <div className="lg:col-span-2">
                    <div className="mb-4">
                      <div className="flex justify-center lg:justify-start mb-6">
                        <Image
                          src={koiShowDetail.data.imgUrl || koiFishImage}
                          alt="Cá Koi"
                          className="w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] xl:h-[480px] object-cover rounded-lg shadow-md"
                          preview={{
                            mask: (
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-base">
                                  <EyeOutlined />
                                </span>
                              </div>
                            ),
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mt-2">
                          <Collapse
                            defaultActiveKey={["1"]}
                            items={[
                              {
                                key: "1",
                                label: (
                                  <span className="font-medium">
                                    Lịch Trình Sự Kiện
                                  </span>
                                ),
                                children: (
                                  <div className="space-y-2 text-sm md:text-sm">
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Thời gian bắt đầu:
                                      </span>
                                      <span>
                                        {new Date(
                                          koiShowDetail.data.startDate
                                        ).toLocaleDateString("vi-VN")}{" "}
                                        {formatTime(
                                          koiShowDetail.data.startDate
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Thời gian kết thúc:
                                      </span>
                                      <span>
                                        {new Date(
                                          koiShowDetail.data.endDate
                                        ).toLocaleDateString("vi-VN")}{" "}
                                        {formatTime(koiShowDetail.data.endDate)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Số người tham gia:
                                      </span>
                                      <span>
                                        {koiShowDetail.data.minParticipants} -{" "}
                                        {koiShowDetail.data.maxParticipants}{" "}
                                        người
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Địa điểm:
                                      </span>
                                      <span>{koiShowDetail.data.location}</span>
                                    </div>
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </div>

                        <div className="mt-2">
                          <Collapse
                            defaultActiveKey={["2"]}
                            items={[
                              {
                                key: "2",
                                label: <span className="font-medium">Vé</span>,
                                children: (
                                  <div className="space-y-2 text-sm md:text-sm">
                                    {koiShowDetail.data.ticketTypes.length >
                                    0 ? (
                                      koiShowDetail.data.ticketTypes.map(
                                        (ticket) => (
                                          <div
                                            key={ticket.id}
                                            className="flex flex-col md:flex-row md:justify-between"
                                          >
                                            <span>{ticket.name}</span>
                                            <div className="flex justify-between md:block">
                                              <span className="text-blue-600">
                                                {new Intl.NumberFormat(
                                                  "vi-VN",
                                                  {
                                                    style: "currency",
                                                    currency: "VND",
                                                  }
                                                ).format(ticket.price)}
                                              </span>
                                              <span className="ml-2 text-gray-500">
                                                ({ticket.availableQuantity} vé)
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <div className="text-gray-500">
                                        Chưa có thông tin vé
                                      </div>
                                    )}
                                  </div>
                                ),
                                extra: !isEditDisabled && !isStaff && (
                                  <InfoCircleOutlined
                                    style={{
                                      fontSize: "16px",
                                      cursor: "pointer",
                                      color: "#1890ff",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTicketModal();
                                    }}
                                  />
                                ),
                              },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/[0.02] p-3 md:p-4 rounded-lg">
                          <h3 className="font-bold mb-3 text-base md:text-lg">
                            Tài Trợ
                          </h3>
                          <div className="grid grid-cols-2 gap-3 md:gap-4 relative">
                            {displaySponsors.map((sponsor, index) => (
                              <div
                                key={sponsor.id}
                                className="relative flex justify-center items-center"
                              >
                                <Image
                                  src={sponsor.logoUrl || sponsorLogo1}
                                  alt={`Tài Trợ ${index + 1}`}
                                  className="rounded-xl"
                                  width={180}
                                  height={180}
                                />
                                {index === 1 && extraCount > 0 && (
                                  <div
                                    onClick={() => setIsModalOpen(true)}
                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center cursor-pointer"
                                  >
                                    <span className="text-white font-semibold text-base md:text-lg">
                                      +{extraCount}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <Modal
                            title="Tất cả nhà tài trợ"
                            open={isModalOpen}
                            onCancel={() => setIsModalOpen(false)}
                            footer={null}
                            width={700}
                          >
                            <div className="grid grid-cols-2 gap-5">
                              {sponsors.map((sponsor) => (
                                <Image
                                  key={sponsor.id}
                                  src={sponsor.logoUrl || sponsorLogo1}
                                  alt="Tài trợ"
                                  className="rounded-xl"
                                  width={250}
                                  height={250}
                                />
                              ))}
                            </div>
                          </Modal>
                        </div>

                        <div className="bg-black/[0.02] p-3 md:p-4 rounded-lg">
                          <h3 className="font-bold mb-3 text-base md:text-lg">
                            Tiêu Chí Đánh Giá{" "}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {/* Cột 1: Chứa 5 phần tử đầu tiên */}
                            <div className="space-y-2 md:space-y-3">
                              {koiShowDetail.data.criteria
                                .slice(0, 5)
                                .map((criteriaList, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm mr-2 flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="text-xs md:text-sm">
                                      {criteriaList}
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {/* Cột 2: Chứa các phần tử còn lại */}
                            <div className="space-y-2 md:space-y-3">
                              {koiShowDetail.data.criteria
                                .slice(5)
                                .map((criteriaList, index) => (
                                  <div
                                    key={index + 5}
                                    className="flex items-center"
                                  >
                                    <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm mr-2 flex-shrink-0">
                                      {index + 6}
                                    </div>
                                    <div className="text-xs md:text-sm">
                                      {criteriaList}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <StatusManager
                        showId={id}
                        showStatuses={koiShowDetail.data.showStatuses}
                        showStartDate={koiShowDetail.data.startDate}
                        showEndDate={koiShowDetail.data.endDate}
                        disabled={isStaff || isEditDisabled}
                      />
                    </div>
                  </div>
                </div>
              </>
            ),
          },
        ]}
      />

      <div className="mt-2 md:mt-4 p-2 md:p-4 ">
        <Tabs
          defaultActiveKey="category"
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={items}
          size="small"
          tabBarGutter={12}
          className="koishow-tabs"
        />
      </div>

      <Modal
        title="Chỉnh Sửa"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setUploadedImages([]);
          setFileList([]);
        }}
        width={800}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditModalVisible(false);
              setUploadedImages([]);
              setFileList([]);
            }}
          >
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleUpdate}>
            Cập Nhật
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Tên"
              validateStatus={nameError ? "error" : ""}
              help={nameError}
            >
              <Input onChange={handleNameChange} maxLength={MAX_NAME_LENGTH} />
            </Form.Item>

            <Form.Item name="location" label="Địa Điểm">
              <Input />
            </Form.Item>

            <Form.Item
              name="minParticipants"
              label="Số Người Tham Gia Tối Thiểu"
              validateStatus={participantErrors.minParticipants ? "error" : ""}
              help={participantErrors.minParticipants}
            >
              <InputNumber
                min={0}
                max={MAX_PARTICIPANTS}
                style={{ width: "100%" }}
                onChange={(value) =>
                  handleParticipantChange("minParticipants", value)
                }
              />
            </Form.Item>

            <Form.Item
              name="maxParticipants"
              label="Số Người Tham Gia Tối Đa"
              validateStatus={participantErrors.maxParticipants ? "error" : ""}
              help={participantErrors.maxParticipants}
            >
              <InputNumber
                min={0}
                max={MAX_PARTICIPANTS}
                style={{ width: "100%" }}
                onChange={(value) =>
                  handleParticipantChange("maxParticipants", value)
                }
              />
            </Form.Item>

            <Form.Item
              name="startDate"
              label="Ngày Bắt Đầu Triễn Lãm"
              validateStatus={timeErrors.startDate ? "error" : ""}
              help={timeErrors.startDate}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
                onChange={(value) => handleDateChange("startDate", value)}
                disabledDate={(current) => {
                  return current && current.isBefore(dayjs(), "day");
                }}
              />
            </Form.Item>

            <Form.Item
              name="endDate"
              label="Ngày Kết Thúc Triễn Lãm"
              validateStatus={timeErrors.endDate ? "error" : ""}
              help={timeErrors.endDate}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
                onChange={(value) => handleDateChange("endDate", value)}
                disabledDate={(current) => {
                  const startDate = form.getFieldValue("startDate");
                  return (
                    startDate && current && current.isBefore(startDate, "day")
                  );
                }}
              />
            </Form.Item>

            {/* Ẩn trường startExhibitionDate và endExhibitionDate */}
            <Form.Item name="startExhibitionDate" hidden>
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
            </Form.Item>

            <Form.Item name="endExhibitionDate" hidden>
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
            </Form.Item>

            {/* Hidden field to store the image URL */}
            <Form.Item name="imgUrl" hidden>
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô Tả">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Hình Ảnh">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleImageUpload}
              beforeUpload={() => false} // Prevent auto upload
              maxCount={1}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải Lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Ticket Management Modal */}
      <Modal
        open={ticketModalVisible}
        onCancel={() => {
          setTicketModalVisible(false);
          ticketForm.resetFields();
          setEditingTicket(null);
          setShowTicketForm(false);
        }}
        footer={null}
        width={1000}
        centered
        className="ticket-modal"
        closeIcon={
          <Button
            icon={<CloseOutlined />}
            type="text"
            shape="circle"
            className="absolute right-4 top-4"
          />
        }
        styles={{
          content: {
            padding: 0,
            overflow: "hidden",
            borderRadius: "12px",
          },
        }}
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Sidebar */}
          <div className="bg-blue-700 text-white p-6 md:w-1/3">
            <h2 className="text-2xl font-bold mb-6">Quản lý vé triển lãm</h2>
            <p className="text-blue-100 mb-8">
              Quản lý các loại vé và cài đặt giá vé cho triển lãm Koi Fish của
              bạn
            </p>

            {isEditDisabled ? (
              <div className="bg-blue-800 rounded-lg p-4 mt-4">
                <InfoCircleOutlined className="text-yellow-300 text-xl mr-2" />
                <p className="text-yellow-100 font-medium">
                  Không thể chỉnh sửa vé khi triển lãm đã công bố
                </p>
              </div>
            ) : (
              <div className="mt-auto">
                {!isStaff && (
                  <Button
                    icon={<PlusOutlined />}
                    className="w-full h-12 text-base flex items-center justify-center text-white"
                    ghost
                    onClick={() => {
                      setShowTicketForm(true);
                      ticketForm.resetFields();
                      setEditingTicket(null);
                    }}
                  >
                    Tạo loại vé mới
                  </Button>
                )}
              </div>
            )}

            <div className="mt-8">
              <div className="space-y-2 text-blue-100">
                <p className="text-sm">
                  Tổng số loại vé:{" "}
                  <span className="font-medium text-white">
                    {koiShowDetail.data.ticketTypes.length}
                  </span>
                </p>
                {koiShowDetail.data.ticketTypes.length > 0 && (
                  <p className="text-sm">
                    Loại vé đắt nhất:{" "}
                    <span className="font-medium text-white">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(
                        Math.max(
                          ...koiShowDetail.data.ticketTypes.map((t) => t.price)
                        )
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:w-2/3 overflow-y-auto max-h-[80vh]">
            {/* Create/Edit Form */}
            {(showTicketForm || editingTicket) &&
              !isEditDisabled &&
              !isStaff && (
                <TicketForm
                  form={ticketForm}
                  onFinish={handleTicketSubmit}
                  editingTicket={editingTicket}
                  onCancel={() => {
                    setShowTicketForm(false);
                    setEditingTicket(null);
                  }}
                  existingTickets={koiShowDetail.data.ticketTypes}
                />
              )}

            {/* Ticket List */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-between mt-3">
                <span>Danh sách vé</span>
              </h3>

              {koiShowDetail.data.ticketTypes.length === 0 ? (
                <div className="text-center py-16 rounded-xl bg-gray-50 border border-dashed border-gray-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                    <TagOutlined style={{ fontSize: "28px" }} />
                  </div>
                  <p className="text-lg text-gray-500 mb-2">
                    Chưa có loại vé nào được tạo
                  </p>
                  <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                    Tạo các loại vé khác nhau để người tham quan có thể mua vé
                    xem triển lãm
                  </p>
                  {!isEditDisabled && !isStaff && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setShowTicketForm(true);
                        ticketForm.resetFields();
                        setEditingTicket(null);
                      }}
                      size="large"
                      className="rounded-lg"
                    >
                      Tạo vé mới
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {koiShowDetail.data.ticketTypes.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mr-3">
                            <TagOutlined className="text-white text-lg" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {ticket.name}
                          </h3>
                        </div>
                        {!isEditDisabled && !isStaff && (
                          <div className="flex space-x-1">
                            <Button
                              icon={<EditOutlined />}
                              type="text"
                              className="text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEditTicket(ticket)}
                              size="middle"
                            />
                            <Popconfirm
                              title="Xóa vé"
                              description="Bạn có chắc chắn muốn xóa vé này?"
                              onConfirm={() => handleDeleteTicket(ticket.id)}
                              okText="Có"
                              cancelText="Không"
                              placement="left"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                type="text"
                                className="text-red-600 hover:bg-red-50"
                                icon={<DeleteOutlined />}
                                size="middle"
                              />
                            </Popconfirm>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <DollarOutlined className="text-green-500 mr-2 text-lg" />
                              <span className="text-gray-600">Giá vé:</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(ticket.price)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <NumberOutlined className="text-orange-400 mr-2 text-lg" />
                              <span className="text-gray-600">
                                Số lượng vé:
                              </span>
                            </div>
                            <span className="font-semibold bg-gray-50 px-3 py-1 rounded-lg">
                              {ticket.availableQuantity.toLocaleString("vi-VN")}{" "}
                              vé
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(KoiShowDetail);
