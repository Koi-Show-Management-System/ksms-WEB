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
import RoundResult from "./RoundResult";
import StatusManager from "./StatusManager";
import Cookies from "js-cookie";

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

  // Lấy role từ cookies
  const userRole = Cookies.get("__role");
  const isStaff = userRole === "Staff";

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

  const statusMapping = {
    RegistrationOpen: { label: "Có Thể Đăng Ký", color: "blue" },
    RegistrationClosed: { label: "Đóng Đăng Ký", color: "red" },
    CheckIn: { label: "Điểm danh", color: "cyan" },
    Preliminary: { label: "Vòng Sơ Loại", color: "green" },
    Evaluation: { label: "Vòng Đánh Giá", color: "purple" },
    Final: { label: "Vòng Chung Kết", color: "orange" },
    GrandChampion: { label: "Grand Champion", color: "yellow" },
    Completed: { label: "Hoàn Thành ", color: "gray" },
    Exhibition: { label: "Triễn Lãm ", color: "teal" },
    Finished: { label: "Kết Thúc", color: "brown" },
  };

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

  // Sử dụng useCallback để đảm bảo hàm không bị tạo lại mỗi lần render
  const fetchDetailCallback = useCallback(() => {
    if (id) {
      fetchKoiShowDetail(id);
    }
  }, [id, fetchKoiShowDetail]);

  useEffect(() => {
    fetchDetailCallback();
  }, [fetchDetailCallback]);

  // Function to open edit modal
  const openEditModal = () => {
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
      const values = await form.validateFields();

      const formattedValues = {
        ...values,
        startDate: values.startDate?.format("YYYY-MM-DDTHH:mm:ss"),
        endDate: values.endDate?.format("YYYY-MM-DDTHH:mm:ss"),
        startExhibitionDate: values.startExhibitionDate?.format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        endExhibitionDate: values.endExhibitionDate?.format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
      };

      if (uploadedImages.length > 0) {
        formattedValues.imgUrl = uploadedImages[0];
      } else if (fileList.length > 0 && fileList[0].url) {
        formattedValues.imgUrl = fileList[0].url;
      }

      const updateData = Object.fromEntries(
        Object.entries(formattedValues).filter(
          ([_, value]) => value !== undefined && value !== null && value !== ""
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
      children: <Category showId={id} statusShow={showStatus} />,
    },
    {
      key: "koiList",
      label: "Đơn Đăng Ký",
      children: (
        <Registration showId={id} statusShow={koiShowDetail.data.status} />
      ),
    },
    {
      key: "ticket",
      label: "Quản lý vé",
      children: <Ticket showId={id} statusShow={koiShowDetail.data.status} />,
    },
    {
      key: "manageShow",
      label: "Quản Lý Triển Lãm",
      children: <ManageShow showId={id} />,
    },
    {
      key: "tank",
      label: "Quản Lý Bể",
      children: <Tank showId={id} />,
    },
    {
      key: "competitionRound",
      label: "Vòng Thi",
      children: <CompetitionRound showId={id} />,
    },
    {
      key: "roundResult",
      label: "Kết Quả Cuối Cùng",
      children: <RoundResult showId={id} />,
    },
    {
      key: "votes",
      label: "Bình Chọn",
      children: <Votes showId={id} />,
    },
    {
      key: "rules",
      label: "Quy Tắc",
      children: <Rules showId={id} showRule={showRule} />,
    },
    {
      key: "sponsor",
      label: "Tài Trợ",
      children: <Sponsor showId={id} />,
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
    setShowTicketForm(false); // Hide the create form when editing
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

  const handleTicketSubmit = async () => {
    try {
      const values = await ticketForm.validateFields();

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
            <Form.Item name="name" label="Tên">
              <Input />
            </Form.Item>

            <Form.Item name="location" label="Địa Điểm">
              <Input />
            </Form.Item>

            <Form.Item
              name="minParticipants"
              label="Số Người Tham Gia Tối Thiểu"
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="maxParticipants" label="Số Người Tham Gia Tối Đa">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="startDate" label="Ngày Bắt Đầu Triễn Lãm">
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="endDate" label="Ngày Kết Thúc Triễn Lãm">
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
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
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-100">
                  <h3 className="text-xl font-semibold mb-6 text-blue-800">
                    {editingTicket ? "Chỉnh sửa vé" : "Tạo loại vé mới"}
                  </h3>

                  <Form
                    form={ticketForm}
                    layout="vertical"
                    onFinish={handleTicketSubmit}
                    requiredMark="optional"
                    size="large"
                  >
                    <Form.Item
                      name="name"
                      label={
                        <span className="text-gray-700 font-medium">
                          Tên vé
                        </span>
                      }
                      rules={[
                        { required: true, message: "Vui lòng nhập tên vé!" },
                      ]}
                    >
                      <Input
                        placeholder="VD: Vé người lớn, Vé trẻ em..."
                        className="rounded-lg"
                        prefix={<TagOutlined className="text-blue-400 mr-2" />}
                      />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Form.Item
                        name="price"
                        label={
                          <span className="text-gray-700 font-medium">
                            Giá vé
                          </span>
                        }
                        rules={[
                          { required: true, message: "Vui lòng nhập giá vé!" },
                        ]}
                      >
                        <InputNumber
                          min={0}
                          style={{ width: "100%" }}
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                          placeholder="Nhập giá vé"
                          addonAfter="VND"
                          className="rounded-lg"
                          prefix={
                            <DollarOutlined className="text-green-500 mr-2" />
                          }
                        />
                      </Form.Item>

                      <Form.Item
                        name="availableQuantity"
                        label={
                          <span className="text-gray-700 font-medium">
                            Số lượng vé
                          </span>
                        }
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập số lượng vé!",
                          },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          style={{ width: "100%" }}
                          placeholder="Nhập số lượng vé"
                          className="rounded-lg"
                          prefix={
                            <NumberOutlined className="text-orange-400 mr-2" />
                          }
                        />
                      </Form.Item>
                    </div>

                    <div className="flex justify-end mt-6 space-x-3">
                      <Button
                        size="large"
                        className="rounded-lg px-6"
                        onClick={() => {
                          setShowTicketForm(false);
                          setEditingTicket(null);
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        className="rounded-lg px-6 bg-blue-600"
                      >
                        {editingTicket ? "Lưu thay đổi" : "Tạo vé"}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

            {/* Ticket List */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-between mt-3">
                <span>Danh sách vé</span>
              </h3>

              {koiShowDetail.data.ticketTypes.length === 0 ? (
                <div className="text-center py-16 rounded-xl bg-gray-50 border border-dashed border-gray-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                    <TagsOutlined style={{ fontSize: "28px" }} />
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
                <div className="grid gap-4">
                  {koiShowDetail.data.ticketTypes.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-5 rounded-xl bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      {editingTicket?.id === ticket.id ? null : ( // Inline edit form (sẽ không hiển thị vì đã có form ở trên)
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="flex-grow">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <TagOutlined className="text-white text-lg" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg text-gray-800">
                                  {ticket.name}
                                </h4>
                                <div className="text-gray-500 text-sm flex items-center">
                                  <NumberOutlined className="mr-1" />
                                  <span className="mr-1">Số lượng:</span>
                                  <span className="font-medium text-gray-700">
                                    {ticket.availableQuantity} vé
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 md:mt-0 flex items-center">
                            <div className="text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg mr-4">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(ticket.price)}
                            </div>

                            {!isEditDisabled && !isStaff && (
                              <div className="flex space-x-2">
                                <Button
                                  icon={<EditOutlined />}
                                  type="text"
                                  className=" text-blue-600"
                                  onClick={() => handleEditTicket(ticket)}
                                  size="middle"
                                  shape="round"
                                />
                                <Popconfirm
                                  title="Xóa vé"
                                  description="Bạn có chắc chắn muốn xóa vé này?"
                                  onConfirm={() =>
                                    handleDeleteTicket(ticket.id)
                                  }
                                  okText="Có"
                                  cancelText="Không"
                                  placement="left"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button
                                    type="text"
                                    className="text-red-600"
                                    icon={<DeleteOutlined />}
                                    size="middle"
                                    shape="round"
                                  />
                                </Popconfirm>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
