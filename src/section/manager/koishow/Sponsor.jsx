import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  notification,
  Upload,
  Card,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import useSponsor from "../../../hooks/useSponsor";

const { Title, Text } = Typography;

function Sponsor({ showId }) {
  const {
    sponsors,
    fetchSponsors,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    isLoading,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
  } = useSponsor();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentSponsor, setCurrentSponsor] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [form] = Form.useForm();
  const [data, setData] = useState({
    name: "",
    logoUrl: "",
    investMoney: 0,
  });

  useEffect(() => {
    fetchSponsors(showId);
  }, [fetchSponsors, showId]);

  const showModal = (sponsor = null) => {
    setCurrentSponsor(sponsor);
    setIsModalVisible(true);

    if (sponsor) {
      form.setFieldsValue({
        name: sponsor.name,
        investMoney: sponsor.investMoney,
      });

      // Set uploaded image if exists
      if (sponsor.logoUrl) {
        setUploadedImages([
          {
            uid: "-1",
            name: "logo.png",
            status: "done",
            url: sponsor.logoUrl,
          },
        ]);

        setData((prev) => ({
          ...prev,
          logoUrl: sponsor.logoUrl,
        }));
      } else {
        setUploadedImages([]);
        setData((prev) => ({
          ...prev,
          logoUrl: "",
        }));
      }
    } else {
      form.resetFields();
      setUploadedImages([]);
      setData({
        name: "",
        logoUrl: "",
        investMoney: 0,
      });
    }
  };

  const showViewModal = (sponsor) => {
    setCurrentSponsor(sponsor);
    setIsViewModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsViewModalVisible(false);
    setCurrentSponsor(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const sponsorData = {
        ...values,
        logoUrl: data.logoUrl,
      };

      let success = false;

      if (currentSponsor) {
        success = await updateSponsor(currentSponsor.id, sponsorData);
        if (success) {
          notification.success({
            message: "Thành công",
            description: "Nhà tài trợ đã được cập nhật thành công!",
          });
          // Refresh data after update
          fetchSponsors(showId);
        } else {
          notification.error({
            message: "Lỗi",
            description: "Không thể cập nhật nhà tài trợ. Vui lòng thử lại!",
          });
        }
      } else {
        success = await addSponsor(showId, sponsorData);
        if (success) {
          notification.success({
            message: "Thành công",
            description: "Nhà tài trợ đã được tạo thành công!",
          });
          // Refresh data after create
          fetchSponsors(showId);
        } else {
          notification.error({
            message: "Lỗi",
            description: "Không thể tạo nhà tài trợ. Vui lòng thử lại!",
          });
        }
      }

      if (success) {
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error("Form validation failed:", error);
      notification.error({
        message: "Lỗi",
        description: "Vui lòng kiểm tra lại thông tin nhập vào!",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const success = await deleteSponsor(id, showId);
      if (success) {
        notification.success({
          message: "Thành công",
          description: "Nhà tài trợ đã được xóa thành công!",
        });
        // Data is already refreshed in the deleteSponsor function
      } else {
        notification.error({
          message: "Lỗi",
          description: "Không thể xóa nhà tài trợ. Vui lòng thử lại!",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa nhà tài trợ!",
      });
    }
  };

  const handleImageUpload = async ({ fileList }) => {
    try {
      const uploadedImages = await Promise.all(
        fileList.map(async (file) => {
          if (file.url) {
            return file.url;
          }
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

            return data.secure_url;
          }
          return null;
        })
      );

      const filteredImages = uploadedImages.filter((url) => url !== null);

      // Store the images for display
      setUploadedImages(
        filteredImages.map((url, index) => ({
          uid: index.toString(),
          name: `image-${index}`,
          status: "done",
          url,
        }))
      );

      // Set the first image as the logoUrl
      if (filteredImages.length > 0) {
        setData((prevData) => ({
          ...prevData,
          logoUrl: filteredImages[0],
        }));
      }

      notification.success({
        message: "Thành công",
        description: "Ảnh đã được tải lên thành công!",
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi tải ảnh lên! Vui lòng thử lại.",
      });
    }
  };

  // Handle page change
  const handlePageChange = (page, pageSize) => {
    // Update state in the store
    useSponsor.setState({ currentPage: page, pageSize });
    // Fetch sponsors with updated pagination
    fetchSponsors(showId);
  };

  const columns = [
    {
      title: "Logo",
      dataIndex: "logoUrl",
      key: "logoUrl",
      render: (logoUrl) =>
        logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: 50, height: 50, objectFit: "contain" }}
          />
        ) : (
          <Text type="secondary">No logo</Text>
        ),
    },
    {
      title: "Tên nhà tài trợ",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số tiền đầu tư",
      dataIndex: "investMoney",
      key: "investMoney",
      render: (money) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(money),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center space-x-4">
          <EyeOutlined
            className="text-gray-500 hover:text-blue-500 cursor-pointer text-lg"
            onClick={() => showViewModal(record)}
          />
          <EditOutlined
            className="text-blue-500 hover:text-blue-700 cursor-pointer text-lg ml-4"
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhà tài trợ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <DeleteOutlined className="text-red-500 hover:text-red-700 cursor-pointer text-lg ml-4" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="sponsor-container p-4 bg-white rounded-lg shadow-md">
      <div className="sponsor-header flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <Title level={3}>Quản lý nhà tài trợ</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Thêm nhà tài trợ
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={sponsors}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: pageSize,
          current: currentPage,
          total: totalItems,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
        }}
        className="bg-white rounded-lg"
      />

      {/* Create/Edit Modal */}
      <Modal
        title={currentSponsor ? "Cập nhật nhà tài trợ" : "Thêm nhà tài trợ mới"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={currentSponsor ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ name: "", investMoney: 0 }}
        >
          <Form.Item
            name="name"
            label="Tên nhà tài trợ"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhà tài trợ!" },
            ]}
          >
            <Input placeholder="Nhập tên nhà tài trợ" />
          </Form.Item>

          <Form.Item
            name="investMoney"
            label="Số tiền đầu tư"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền đầu tư!" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              placeholder="Nhập số tiền đầu tư"
            />
          </Form.Item>

          <Form.Item label="Logo">
            <Upload
              accept=".jpg,.jpeg,.png"
              listType="picture-card"
              fileList={uploadedImages}
              onChange={handleImageUpload}
              maxCount={1}
            >
              {uploadedImages.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div className="mt-2">Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Chi tiết nhà tài trợ"
        open={isViewModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Đóng
          </Button>,
        ]}
      >
        {currentSponsor && (
          <Card>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              {currentSponsor.logoUrl ? (
                <img
                  src={currentSponsor.logoUrl}
                  alt={currentSponsor.name}
                  style={{ maxWidth: "100%", maxHeight: 200 }}
                />
              ) : (
                <Text type="secondary">Không có logo</Text>
              )}
            </div>
            <p>
              <strong>Tên nhà tài trợ:</strong> {currentSponsor.name}
            </p>
            <p>
              <strong>Số tiền đầu tư:</strong>{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(currentSponsor.investMoney)}
            </p>
          </Card>
        )}
      </Modal>
    </div>
  );
}

export default Sponsor;
