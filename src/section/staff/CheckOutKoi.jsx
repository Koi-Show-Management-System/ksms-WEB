import React, { useState } from "react";
import {
  Card,
  Input,
  Button,
  Form,
  Typography,
  notification,
  Descriptions,
  Space,
  Spin,
  Empty,
  Image,
  Tag,
  Row,
  Col,
  Divider,
  Upload,
  Modal,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ExportOutlined,
  QrcodeOutlined,
  UploadOutlined,
  CameraOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import useRegistration from "../../hooks/useRegistration";
import { Loading } from "../../components";

const { Title, Text } = Typography;
const { TextArea } = Input;

function CheckOutKoi() {
  const [form] = Form.useForm();
  const [checkoutForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [koiData, setKoiData] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imgCheckOut, setImgCheckOut] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCheckOutInfoModalVisible, setIsCheckOutInfoModalVisible] =
    useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { fetchRegistration, checkOutKoi } = useRegistration();

  const handleSearch = async (values) => {
    try {
      setLoading(true);
      setHasSearched(true);
      // Sử dụng hook fetchRegistration có sẵn để tìm kiếm cá theo Mã đặng ký
      const result = await fetchRegistration(
        1,
        10,
        null,
        null,
        null,
        values.registrationNumber
      );

      console.log("Kết quả tìm kiếm:", result);

      // Kiểm tra nếu có dữ liệu registration từ API
      if (result?.registration && Array.isArray(result.registration)) {
        // Tìm cá với Mã đặng ký phù hợp trong kết quả
        const foundKoi = result.registration.find(
          (item) => item.registrationNumber === values.registrationNumber
        );

        if (foundKoi) {
          console.log("Đã tìm thấy cá:", foundKoi);
          setKoiData(foundKoi);
        } else {
          console.log(
            "Không tìm thấy cá trong kết quả trả về:",
            result.registration
          );
          notification.error({
            message: "Lỗi",
            description:
              "Không tìm thấy thông tin cá với Mã đăng ký này trong kết quả",
          });
          setKoiData(null);
        }
      } else {
        console.log("API không trả về dữ liệu registration hợp lệ:", result);
        notification.error({
          message: "Lỗi",
          description:
            "Không nhận được dữ liệu từ hệ thống. Vui lòng thử lại sau.",
        });
        setKoiData(null);
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      notification.error({
        message: "Lỗi",
        description:
          error.response?.data?.message || "Không thể tìm thông tin cá",
      });
      setKoiData(null);
    } finally {
      setLoading(false);
    }
  };

  const showCheckoutModal = () => {
    if (!koiData?.id) {
      notification.error({
        message: "Lỗi",
        description: "Không tìm thấy thông tin cá để check out",
      });
      return;
    }

    checkoutForm.resetFields();
    setImgCheckOut("");
    setUploadedImage(null);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleImageUpload = ({ fileList }) => {
    if (fileList.length === 0) {
      setUploadedImage(null);
      setImgCheckOut("");
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    setLoading(true);
    fetch("https://api.cloudinary.com/v1_1/dphupjpqt/image/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.secure_url) {
          throw new Error("Upload failed");
        }

        const imageInfo = {
          uid: "-1",
          name: file.name,
          status: "done",
          url: data.secure_url,
        };

        setImgCheckOut(data.secure_url);
        setUploadedImage(imageInfo);

        notification.success({
          message: "Thành công",
          description: "Ảnh đã được tải lên thành công!",
        });
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
        notification.error({
          message: "Lỗi",
          description: "Không thể tải lên ảnh. Vui lòng thử lại.",
        });
        setUploadedImage(null);
        setImgCheckOut("");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleCheckOut = async () => {
    try {
      if (!koiData?.id) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy thông tin cá để check out",
        });
        return;
      }

      if (!imgCheckOut) {
        notification.error({
          message: "Lỗi",
          description: "Vui lòng tải lên hình ảnh check out",
        });
        return;
      }

      const values = await checkoutForm.validateFields();

      setLoading(true);
      await checkOutKoi(koiData.id, imgCheckOut, values.notes);

      setIsModalVisible(false);
      setKoiData(null);
      form.resetFields();
      checkoutForm.resetFields();
      setUploadedImage(null);
      setImgCheckOut("");

      notification.success({
        message: "Thành công",
        description: "Check out cá thành công!",
      });
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error("Error during check out:", error);
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể check out. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusTag = (status) => {
    let color = "default";
    let text = status || "Không xác định";

    switch (status?.toLowerCase()) {
      case "confirmed":
        color = "green";
        text = "Đã xác nhận";
        break;
      case "pending":
        color = "orange";
        text = "Đang chờ";
        break;
      case "rejected":
        color = "red";
        text = "Đã từ chối";
        break;
      case "eliminated":
        color = "purple";
        text = "Đã loại";
        break;
      case "checkin":
        color = "blue";
        text = "Đã vào khu vực";
        break;
      case "checkout":
        color = "geekblue";
        text = "Đã rời khu vực";
        break;
      default:
        color = "default";
    }

    return <Tag color={color}>{text}</Tag>;
  };

  // Hàm mở modal thông tin check out
  const showCheckOutInfoModal = () => {
    setIsCheckOutInfoModalVisible(true);
  };

  // Hàm đóng modal thông tin check out
  const handleCheckOutInfoCancel = () => {
    setIsCheckOutInfoModalVisible(false);
  };

  return (
    <Card
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            Check out cá khỏi khu vực
          </Title>
        </Space>
      }
    >
      <Form
        form={form}
        layout="horizontal"
        onFinish={handleSearch}
        style={{ maxWidth: "600px", margin: "0 auto 20px" }}
      >
        <Row gutter={12}>
          <Col span={18}>
            <Form.Item
              name="registrationNumber"
              label="Mã đăng ký"
              rules={[
                { required: true, message: "Vui lòng nhập Mã đặng ký cá" },
              ]}
            >
              <Input
                placeholder="Nhập Mã đăng ký cá (ví dụ: VKS25-MI001)"
                size="large"
                prefix={<SearchOutlined />}
                style={{ borderRadius: "6px" }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                icon={<SearchOutlined />}
                style={{ width: "100%", borderRadius: "6px" }}
              >
                Tìm kiếm
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Loading />
        </div>
      )}

      {koiData && (
        <div>
          <Divider orientation="left">Thông tin cá Koi</Divider>

          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  marginBottom: 16,
                  textAlign: "center",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                }}
              >
                {koiData.koiMedia && koiData.koiMedia.length > 0 ? (
                  (() => {
                    const imageMedia = koiData.koiMedia.find(
                      (media) => media.mediaType === "Image"
                    );
                    if (imageMedia) {
                      return (
                        <Image
                          src={imageMedia.mediaUrl}
                          alt="Hình ảnh cá koi"
                          style={{ maxHeight: "350px", objectFit: "contain" }}
                        />
                      );
                    } else {
                      return (
                        <Empty
                          description="Không có hình ảnh"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      );
                    }
                  })()
                ) : (
                  <Empty
                    description="Không có hình ảnh"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
                <div style={{ marginTop: 10 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {koiData.registrationNumber}
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={16}>
              <Descriptions
                bordered
                column={1}
                style={{ marginBottom: 20 }}
                labelStyle={{ fontWeight: "bold", width: "150px" }}
              >
                <Descriptions.Item label="Mã đăng ký">
                  {koiData.registrationNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Giống">
                  {koiData.koiProfile?.variety?.name || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Kích thước">
                  {koiData.koiSize} cm
                </Descriptions.Item>
                <Descriptions.Item label="Tuổi">
                  {koiData.koiAge} năm
                </Descriptions.Item>
                <Descriptions.Item label="Người đăng ký">
                  {koiData.registerName}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {renderStatusTag(koiData.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian check-in">
                  {koiData.checkInTime
                    ? new Date(koiData.checkInTime).toLocaleString()
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Vị trí check-in">
                  {koiData.checkInLocation || "-"}
                </Descriptions.Item>
                {koiData.checkOutLog && (
                  <Descriptions.Item label="Thời gian check-out">
                    {koiData.checkOutLog.checkOutTime
                      ? new Date(
                          koiData.checkOutLog.checkOutTime
                        ).toLocaleString()
                      : "-"}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {!koiData.checkOutLog ? (
                <Button
                  type="primary"
                  danger
                  icon={<ExportOutlined />}
                  onClick={showCheckoutModal}
                  disabled={
                    loading || koiData.status?.toLowerCase() === "checkout"
                  }
                  size="large"
                  style={{ borderRadius: "6px" }}
                >
                  Check out cá
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<InfoCircleOutlined />}
                  onClick={showCheckOutInfoModal}
                  size="large"
                  style={{ borderRadius: "6px" }}
                >
                  Xem thông tin check out
                </Button>
              )}
            </Col>
          </Row>
        </div>
      )}

      {!loading && !koiData && hasSearched && (
        <Empty
          description="Không tìm thấy thông tin cá"
          style={{ margin: "40px 0" }}
        />
      )}

      {/* Modal thông tin check out */}
      <Modal
        title="Thông tin Check Out"
        open={isCheckOutInfoModalVisible}
        onCancel={handleCheckOutInfoCancel}
        footer={[
          <Button key="back" onClick={handleCheckOutInfoCancel}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {koiData?.checkOutLog && (
          <div>
            <Row gutter={24}>
              <Col span={12}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <Image
                    src={koiData.checkOutLog.imgCheckOut}
                    alt="Hình ảnh check out"
                    style={{ maxHeight: "300px", objectFit: "contain" }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  labelStyle={{ fontWeight: "bold" }}
                >
                  <Descriptions.Item label="Thời gian check out">
                    {koiData.checkOutLog.checkOutTime
                      ? new Date(
                          koiData.checkOutLog.checkOutTime
                        ).toLocaleString()
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người thực hiện">
                    {koiData.checkOutLog.checkedOutByNavigation?.fullName ||
                      "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {koiData.checkOutLog.checkedOutByNavigation?.email || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {koiData.checkOutLog.checkedOutByNavigation?.phone || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú">
                    {koiData.checkOutLog.notes || "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Modal check out */}
      <Modal
        title="Check out cá"
        open={isModalVisible}
        onOk={handleCheckOut}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="Check out"
        cancelText="Hủy"
      >
        <Form form={checkoutForm} layout="vertical">
          <Form.Item name="notes" label="Ghi chú khi check out">
            <TextArea rows={4} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Hình ảnh check out <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            required
            validateStatus={imgCheckOut ? "success" : "error"}
            help={!imgCheckOut && "Vui lòng tải lên hình ảnh check out"}
          >
            <Upload
              accept=".jpg,.jpeg,.png"
              listType="picture-card"
              fileList={uploadedImage ? [uploadedImage] : []}
              onChange={handleImageUpload}
              maxCount={1}
              beforeUpload={() => false}
            >
              {!uploadedImage && (
                <div>
                  <CameraOutlined style={{ fontSize: 24 }} />
                  <div style={{ marginTop: 8 }}>Chụp ảnh/Tải lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default CheckOutKoi;
