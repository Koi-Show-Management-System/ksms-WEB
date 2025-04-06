import React, { useEffect, useState } from "react";
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
import { useParams } from "react-router-dom";
import useKoiShow from "../../../../hooks/useKoiShow";
import { Loading } from "../../../../components";
import useTicketType from "../../../../hooks/useTicketType";
import CompetitionRound from "./CompetitionRound";
import Registration from "./Registration";
import Tank from "./Tank";
import Ticket from "./Ticket";

function KoiShowDetail() {
  const { Panel } = Collapse;
  const { id } = useParams();
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

  useEffect(() => {
    fetchKoiShowDetail(id);
  }, [id]);

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
      registrationFee: koiShowDetail.data.registrationFee,
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
      children: <Category showId={id} />,
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
    <div className="max-w-8xl mx-auto p-3">
      <div className="mb-8">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold mb-4">{koiShowDetail.data.name}</h1>
          <div
            onClick={openEditModal}
            className="text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            <EditOutlined style={{ fontSize: "18px" }} />
          </div>
        </div>
        <p className="text-gray-600">{koiShowDetail.data.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Image
            src={koiShowDetail.data.imgUrl || koiFishImage}
            alt="Cá Koi"
            className="w-[300px] h-[200px] object-cover rounded-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="mt-4">
              <Collapse
                defaultActiveKey={["1"]}
                items={[
                  {
                    key: "1",
                    label: "Lịch Trình Sự Kiện",
                    children: (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>
                            {new Date(
                              koiShowDetail.data.startDate
                            ).toLocaleDateString("vi-VN")}{" "}
                            - Mở Đăng Ký
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {new Date(
                              koiShowDetail.data.endDate
                            ).toLocaleDateString("vi-VN")}{" "}
                            - Đóng Đăng Ký
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {new Date(
                              koiShowDetail.data.startExhibitionDate
                            ).toLocaleDateString("vi-VN")}{" "}
                            - Ngày Bắt Đầu Giải Đấu & Triển Lãm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {new Date(
                              koiShowDetail.data.endExhibitionDate
                            ).toLocaleDateString("vi-VN")}{" "}
                            - Ngày Kết Thúc Giải Đấu & Triễn Lãm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Địa điểm: {koiShowDetail.data.location}</span>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            <div className="mt-4">
              <Collapse
                defaultActiveKey={["2"]}
                items={[
                  {
                    key: "2",
                    label: "Vé",
                    children: (
                      <div className="space-y-2">
                        {koiShowDetail.data.ticketTypes.map((ticket) => (
                          <div key={ticket.id}>
                            <div>
                              {ticket.name} -{" "}
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(ticket.price)}{" "}
                              || Số lượng : {ticket.availableQuantity} vé
                            </div>
                          </div>
                        ))}

                        <div>
                          Tham gia tối thiểu:{" "}
                          {koiShowDetail.data.minParticipants}
                        </div>
                        <div>
                          Tham gia tối đa: {koiShowDetail.data.maxParticipants}
                        </div>
                      </div>
                    ),
                    extra: (
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

          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Sponsors and criteria sections remain unchanged */}
            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Tài Trợ</h3>
              <div className="grid grid-cols-2 gap-4 relative">
                {displaySponsors.map((sponsor, index) => (
                  <div key={sponsor.id} className="relative">
                    <Image
                      src={sponsor.logoUrl || sponsorLogo1}
                      alt={`Tài Trợ ${index + 1}`}
                      className="rounded-xl"
                      width={150}
                      height={150}
                    />
                    {index === 1 && extraCount > 0 && (
                      <div
                        onClick={() => setIsModalOpen(true)}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center cursor-pointer"
                      >
                        <span className="text-white font-semibold">
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
              >
                <div className="grid grid-cols-2 gap-4">
                  {sponsors.map((sponsor) => (
                    <Image
                      key={sponsor.id}
                      src={sponsor.logoUrl || sponsorLogo1}
                      alt="Tài trợ"
                      className="rounded-xl"
                      width={150}
                      height={150}
                    />
                  ))}
                </div>
              </Modal>
            </div>

            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Tiêu Chí Đánh Giá </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Cột 1: Chứa 5 phần tử đầu tiên */}
                <div className="space-y-4">
                  {koiShowDetail.data.criteria
                    .slice(0, 5)
                    .map((criteriaList, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span>{criteriaList}</span>
                      </div>
                    ))}
                </div>

                {/* Cột 2: Chứa các phần tử còn lại */}
                <div className="space-y-4">
                  {koiShowDetail.data.criteria
                    .slice(5)
                    .map((criteriaList, index) => (
                      <div key={index + 5} className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                          {index + 6}
                        </span>
                        <span>{criteriaList}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Card title="Trạng Thái" className="mb-4">
            <Timeline
              items={koiShowDetail.data.showStatuses
                .slice() // Create a copy to avoid mutating the original array
                .sort((a, b) => {
                  // Define the order of status display
                  const statusOrder = {
                    RegistrationOpen: 1,
                    CheckIn: 2,
                    Preliminary: 3,
                    Evaluation: 4,
                    Final: 5,
                    Exhibition: 6,
                    PublicResult: 7,
                    Award: 8,
                    Finished: 9,
                  };
                  return statusOrder[a.statusName] - statusOrder[b.statusName];
                })
                .map((status) => {
                  const { color } = statusMapping[status.statusName] || {
                    color: "gray",
                  };

                  // Check if dates are the same
                  const sameDate =
                    dayjs(status.startDate).format("YYYY-MM-DD") ===
                    dayjs(status.endDate).format("YYYY-MM-DD");

                  return {
                    key: status.id,
                    color: color,
                    children: (
                      <div className={`text-${color}-500 font-medium`}>
                        <div
                          className={`text-sm ${status.isActive ? "text-blue-700 font-bold" : "text-gray-400"} mb-1`}
                        >
                          {status.description}
                        </div>

                        {sameDate ? (
                          // If same date, show one date with start and end times
                          <div className="text-xs text-gray-500">
                            {formatDate(status.startDate)},{" "}
                            {formatTime(status.startDate)} -{" "}
                            {formatTime(status.endDate)}
                          </div>
                        ) : (
                          // If different dates, show full range
                          <div className="text-xs text-gray-500">
                            {formatDate(status.startDate)}{" "}
                            {formatTime(status.startDate)} -{" "}
                            {formatDate(status.endDate)}{" "}
                            {formatTime(status.endDate)}
                          </div>
                        )}
                      </div>
                    ),
                  };
                })}
            />
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs defaultActiveKey="category" items={items} />
        </div>
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
          <div className="grid grid-cols-2 gap-4">
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

            <Form.Item name="startDate" label="Ngày Bắt Đầu">
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="endDate" label="Ngày Kết Thúc">
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="startExhibitionDate"
              label="Ngày Bắt Đầu Triển Lãm"
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="endExhibitionDate" label="Ngày Kết Thúc Triển Lãm">
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: "100%" }}
              />
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
          <div className="flex items-center justify-between py-5">
            <span className="text-xl font-semibold">Quản lý vé</span>
            <PlusOutlined
              className="text-blue-500 text-xl cursor-pointer hover:text-blue-700"
              onClick={() => {
                setShowTicketForm(true);
                ticketForm.resetFields();
                setEditingTicket(null);
              }}
            />
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
        width={800}
      >
        {showTicketForm && !editingTicket && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-4 border-b pb-2">
              Tạo vé mới
            </h3>

            <Form
              form={ticketForm}
              layout="vertical"
              onFinish={handleTicketSubmit}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <h3 className="text-lg font-medium mb-4">Danh sách vé</h3>

        {koiShowDetail.data.ticketTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">🎫</div>
            <p>Chưa có loại vé nào được tạo</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            {koiShowDetail.data.ticketTypes.map((ticket) => (
              <div
                key={ticket.id}
                className="mb-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-lg">{ticket.name}</h4>
                      <div className="text-gray-600 text-sm mt-1">
                        Số lượng: {ticket.availableQuantity} vé
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(ticket.price)}
                      </div>
                      <div className="flex justify-end mt-2 space-x-2">
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

export default KoiShowDetail;
