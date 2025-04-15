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

function KoiShowDetail() {
  const { Panel } = Collapse;
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const showStatus = searchParams.get("status");
  const isEditDisabled = showStatus === "published";
  const { koiShowDetail, isLoading, fetchKoiShowDetail, updateKoiShow } =
    useKoiShow();
  const [form] = Form.useForm();

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
      label: "Danh Mục",
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
                {!isEditDisabled && (
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
                      <div className="flex justify-center md:justify-start mb-4">
                        <Image
                          src={koiShowDetail.data.imgUrl || koiFishImage}
                          alt="Cá Koi"
                          className="w-full max-w-[500px] md:max-w-[780px] h-[280px] md:h-[360px] object-cover rounded-lg shadow-md"
                          preview={{
                            mask: (
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-base">
                                  Xem lớn
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
                                  <div className="space-y-2 text-sm md:text-base">
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Bắt đầu:
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
                                        Kết thúc:
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
                                  <div className="space-y-2 text-sm md:text-base">
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
                                extra: !isEditDisabled && (
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
                        disabled={isEditDisabled}
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
        title={
          <div className="flex items-center justify-between py-4">
            <span className="text-lg md:text-xl font-semibold">Quản lý vé</span>
            {!isEditDisabled && (
              <PlusOutlined
                className="text-blue-500 text-xl cursor-pointer hover:text-blue-700"
                onClick={() => {
                  setShowTicketForm(true);
                  ticketForm.resetFields();
                  setEditingTicket(null);
                }}
              />
            )}
          </div>
        }
        open={ticketModalVisible}
        onCancel={() => {
          setTicketModalVisible(false);
          ticketForm.resetFields();
          setEditingTicket(null);
          setShowTicketForm(false);
        }}
        footer={null}
        width="95%"
        centered
        className="ticket-modal"
      >
        {isEditDisabled && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-md text-sm">
            <p>Không thể chỉnh sửa vé khi triển lãm đã công bố</p>
          </div>
        )}

        {showTicketForm && !editingTicket && !isEditDisabled && (
          <div className="mb-4 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 border-b pb-2">
              Tạo vé mới
            </h3>

            <Form
              form={ticketForm}
              layout="vertical"
              onFinish={handleTicketSubmit}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <Form.Item
                  name="name"
                  label="Tên vé"
                  rules={[{ required: true, message: "Vui lòng nhập tên vé!" }]}
                >
                  <Input placeholder="VD: Vé người lớn, Vé trẻ em..." />
                </Form.Item>

                <Form.Item
                  name="price"
                  label="Giá vé"
                  rules={[{ required: true, message: "Vui lòng nhập giá vé!" }]}
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
                  />
                </Form.Item>

                <Form.Item
                  name="availableQuantity"
                  label="Số lượng vé"
                  rules={[
                    { required: true, message: "Vui lòng nhập số lượng vé!" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    style={{ width: "100%" }}
                    placeholder="Nhập số lượng vé"
                  />
                </Form.Item>
              </div>

              <div className="flex justify-end mt-2">
                <Button type="primary" htmlType="submit">
                  Tạo mới
                </Button>
              </div>
            </Form>
          </div>
        )}

        <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">
          Danh sách vé
        </h3>

        {koiShowDetail.data.ticketTypes.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-gray-500 bg-gray-50 rounded-lg">
            <div className="text-3xl md:text-4xl mb-2">🎫</div>
            <p>Chưa có loại vé nào được tạo</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[300px] md:max-h-[500px]">
            {koiShowDetail.data.ticketTypes.map((ticket) => (
              <div
                key={ticket.id}
                className="mb-3 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                {editingTicket?.id === ticket.id ? (
                  // Inline edit form
                  <Form
                    form={ticketForm}
                    layout="horizontal"
                    onFinish={handleTicketSubmit}
                    initialValues={{
                      name: ticket.name,
                      price: ticket.price,
                      availableQuantity: ticket.availableQuantity,
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <Form.Item
                        name="name"
                        label="Tên vé"
                        rules={[
                          { required: true, message: "Vui lòng nhập tên vé!" },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        name="price"
                        label="Giá vé"
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
                          addonAfter="VND"
                        />
                      </Form.Item>

                      <Form.Item
                        name="availableQuantity"
                        label="Số lượng vé"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập số lượng vé!",
                          },
                        ]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </div>

                    <div className="flex justify-end mt-2 space-x-2">
                      <Button onClick={() => setEditingTicket(null)}>
                        Hủy
                      </Button>
                      <Button type="primary" htmlType="submit">
                        Lưu
                      </Button>
                    </div>
                  </Form>
                ) : (
                  // Display ticket info
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <h4 className="font-medium text-base md:text-lg">
                        {ticket.name}
                      </h4>
                      <div className="text-gray-600 text-xs md:text-sm mt-1">
                        Số lượng: {ticket.availableQuantity} vé
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <div className="text-base md:text-lg font-semibold text-blue-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(ticket.price)}
                      </div>
                      <div className="flex justify-end mt-2 space-x-2">
                        {!isEditDisabled && (
                          <>
                            <EditOutlined
                              className="text-blue-500 cursor-pointer hover:text-blue-700 mr-3"
                              onClick={() => handleEditTicket(ticket)}
                            />
                            <Popconfirm
                              title="Bạn có chắc chắn muốn xóa vé này?"
                              onConfirm={() => handleDeleteTicket(ticket.id)}
                              okText="Có"
                              cancelText="Không"
                              placement="left"
                            >
                              <DeleteOutlined className="text-red-500 cursor-pointer hover:text-red-700" />
                            </Popconfirm>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default React.memo(KoiShowDetail);
