import React, { useState, useEffect } from "react";
import {
  Card,
  Select,
  Table,
  Typography,
  Image,
  Spin,
  Tag,
  Space,
  Empty,
  Modal,
  Button,
  Row,
  Col,
  Flex,
  ConfigProvider,
  Badge,
} from "antd";
import { EyeOutlined, TrophyOutlined } from "@ant-design/icons";
import useCategory from "../../../../hooks/useCategory";
import useRoundResult from "../../../../hooks/useRoundResult";
import { Loading } from "../../../../components";

function RoundResult({ showId }) {
  const { categories, fetchCategories } = useCategory();
  const { isLoading, fetchGetRoundResult } = useRoundResult();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [resultData, setResultData] = useState([]);
  const [currentKoi, setCurrentKoi] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);

  useEffect(() => {
    fetchCategories(showId);
  }, [showId]);

  const handleCategoryChange = async (value) => {
    console.log("Selected categoryId:", value);
    setSelectedCategory(value);
    if (value) {
      const response = await fetchGetRoundResult(value);

      if (
        response &&
        response.status === 200 &&
        response.data &&
        response.data.data
      ) {
        console.log("Đã tìm thấy dữ liệu:", response.data.data);
        setResultData(response.data.data);
      } else {
        setResultData([]);
      }
    } else {
      setResultData([]);
    }
  };

  // Hàm lấy URL hình ảnh đầu tiên từ media
  const getFirstImageUrl = (media) => {
    if (media && Array.isArray(media) && media.length > 0) {
      const imageMedia = media.find((item) => item.mediaType === "Image");
      return imageMedia ? imageMedia.mediaUrl : null;
    }
    return null;
  };

  const handleViewDetails = (record) => {
    setCurrentKoi(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentKoi(null);
  };

  // Render award type với màu sắc phù hợp và tên tiếng Việt
  const renderAwardType = (awardType, awardName) => {
    let color = "default";
    let displayName = awardName;
    let icon = <TrophyOutlined />;

    // Hiển thị tên giải bằng tiếng Việt và cúp phù hợp
    switch (awardType) {
      case "first":
        color = "gold";
        displayName = "Giải nhất";
        icon = (
          <TrophyOutlined style={{ color: "#FFD700", fontSize: "16px" }} />
        );
        break;
      case "second":
        color = "cyan";
        displayName = "Giải nhì";
        icon = (
          <TrophyOutlined style={{ color: "#87CEEB", fontSize: "16px" }} />
        );
        break;
      case "third":
        color = "orange";
        displayName = "Giải ba";
        icon = (
          <TrophyOutlined style={{ color: "#DEB887", fontSize: "16px" }} />
        );
        break;
      case "honorable":
        color = "green";
        displayName = "Giải Khuyến Khích";
        icon = (
          <TrophyOutlined style={{ color: "#52c41a", fontSize: "16px" }} />
        );
        break;

      default:
        color = "default";
        displayName = awardName || awardType;
    }

    return (
      <Tag color={color} icon={icon}>
        {displayName}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Hạng",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      render: (rank) => (
        <Badge
          count={rank}
          style={{
            backgroundColor:
              rank === 1
                ? "#FFD700"
                : rank === 2
                  ? "#87CEEB"
                  : rank === 3
                    ? "#DEB887"
                    : "#52c41a",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        />
      ),
    },
    {
      title: "Mã đăng ký",
      dataIndex: "registrationNumber",
      key: "registrationNumber",
    },
    {
      title: "Tên Koi",
      dataIndex: "koiName",
      key: "koiName",
    },
    {
      title: "Giống",
      dataIndex: "variety",
      key: "variety",
    },
    {
      title: "Kích thước",
      dataIndex: "koiSize",
      key: "koiSize",
      render: (size) => `${size} cm`,
    },
    {
      title: "Điểm",
      dataIndex: "finalScore",
      key: "finalScore",
      render: (score) => score.toFixed(2),
      sorter: (a, b) => a.finalScore - b.finalScore,
    },
    {
      title: "Giải thưởng",
      key: "award",
      render: (_, record) =>
        renderAwardType(record.awardType, record.awardName),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{ color: "#4B5563" }}
          />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      locale={{
        Table: {
          filterReset: "Xóa",
          filterConfirm: "Đồng ý",
        },
      }}
    >
      <Card className="rounded-lg shadow-md">
        <Flex justify="space-between" align="center" className="mb-4"></Flex>

        <Select
          style={{ width: "25%", marginBottom: 16 }}
          placeholder="Chọn hạng mục"
          onChange={handleCategoryChange}
          allowClear
          value={selectedCategory}
        >
          {categories?.map((category) => (
            <Select.Option key={category.id} value={category.id}>
              {category.name}
            </Select.Option>
          ))}
        </Select>

        <Table
          columns={columns}
          dataSource={resultData}
          loading={isLoading}
          rowKey="registrationId"
          size="middle"
          bordered={false}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: selectedCategory ? (
              <Empty
                description="Không có dữ liệu kết quả"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "24px 0" }}
              />
            ) : (
              <Empty
                description="Vui lòng chọn hạng mục để xem kết quả"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "24px 0" }}
              />
            ),
          }}
        />

        {/* Modal chi tiết cá đạt giải */}
        <Modal
          title="Chi Tiết Koi Đạt Giải"
          open={isModalVisible}
          onCancel={handleCancel}
          footer={
            <Button key="cancel" onClick={handleCancel}>
              Đóng
            </Button>
          }
          width={900}
          maskClosable={true}
          keyboard={true}
        >
          {currentKoi && (
            <div className="p-4">
              <Row gutter={[16, 16]}>
                {/* Thông tin đăng ký */}
                <Col span={24}>
                  <Card
                    title={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <TrophyOutlined
                          style={{ marginRight: 8, color: "#faad14" }}
                        />
                        <span>Thông Tin Koi Đạt Giải</span>
                      </div>
                    }
                    bordered={false}
                    className="w-full"
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Typography.Paragraph>
                          <strong>Mã đăng ký:</strong>{" "}
                          {currentKoi.registrationNumber}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Chủ sở hữu:</strong> {currentKoi.registerName}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Tên Koi:</strong> {currentKoi.koiName}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Kích thước:</strong> {currentKoi.koiSize} cm
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Giống:</strong> {currentKoi.variety}
                        </Typography.Paragraph>
                      </Col>
                      <Col span={12}>
                        <Typography.Paragraph>
                          <strong>Dòng máu:</strong> {currentKoi.bloodline}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Giới tính:</strong> {currentKoi.gender}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Xếp hạng:</strong> {currentKoi.rank}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Điểm số cuối cùng:</strong>{" "}
                          {currentKoi.finalScore.toFixed(2)}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Giải thưởng:</strong>{" "}
                          {renderAwardType(
                            currentKoi.awardType,
                            currentKoi.awardName
                          )}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                          <strong>Giá trị giải thưởng:</strong>{" "}
                          {(currentKoi.prizeValue || 0).toLocaleString()} VND
                        </Typography.Paragraph>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* Koi Media */}
                {currentKoi.media && currentKoi.media.length > 0 && (
                  <Col span={24}>
                    <Card
                      title="Hình Ảnh/Video Cá Koi"
                      bordered={false}
                      className="w-full"
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <div>
                            <Typography.Paragraph strong>
                              Hình Ảnh:
                            </Typography.Paragraph>
                            {currentKoi.media.find(
                              (media) => media.mediaType === "Image"
                            ) ? (
                              <div className="relative">
                                <div
                                  className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-[300px]"
                                  style={{ borderRadius: "8px" }}
                                >
                                  <Image
                                    src={
                                      currentKoi.media.find(
                                        (media) => media.mediaType === "Image"
                                      )?.mediaUrl
                                    }
                                    alt="Hình Ảnh Koi"
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "100%",
                                      objectFit: "contain",
                                      margin: "0 auto",
                                      display: "block",
                                    }}
                                    placeholder={
                                      <div
                                        style={{
                                          width: "100%",
                                          height: "300px",
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        <Loading />
                                      </div>
                                    }
                                    preview={{
                                      mask: (
                                        <EyeOutlined
                                          style={{ fontSize: "18px" }}
                                        />
                                      ),
                                      icons: false,
                                    }}
                                  />
                                </div>
                                {currentKoi.media.filter(
                                  (media) => media.mediaType === "Image"
                                ).length > 1 && (
                                  <div
                                    onClick={() => setMediaModalVisible(true)}
                                    className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-all"
                                    style={{
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    }}
                                  >
                                    <span className="text-white font-semibold text-xl bg-black bg-opacity-40 px-4 py-2 rounded-full">
                                      +
                                      {currentKoi.media.filter(
                                        (media) => media.mediaType === "Image"
                                      ).length - 1}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "300px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  background: "#f0f0f0",
                                  borderRadius: "8px",
                                }}
                              >
                                Không có hình ảnh
                              </div>
                            )}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div>
                            <Typography.Paragraph strong>
                              Video:
                            </Typography.Paragraph>
                            {currentKoi.media.find(
                              (media) => media.mediaType === "Video"
                            ) ? (
                              <div className="relative">
                                <div
                                  className="bg-gray-900 rounded-lg overflow-hidden h-[300px] flex items-center justify-center"
                                  style={{ borderRadius: "8px" }}
                                >
                                  <video
                                    controls
                                    src={
                                      currentKoi.media.find(
                                        (media) => media.mediaType === "Video"
                                      )?.mediaUrl
                                    }
                                    style={{
                                      width: "100%",
                                      height: "auto",
                                      maxHeight: "100%",
                                      borderRadius: "8px",
                                    }}
                                  />
                                </div>
                                {currentKoi.media.filter(
                                  (media) => media.mediaType === "Video"
                                ).length > 1 && (
                                  <div
                                    onClick={() => setMediaModalVisible(true)}
                                    className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-all"
                                    style={{
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    }}
                                  >
                                    <span className="text-white font-semibold text-xl bg-black bg-opacity-40 px-4 py-2 rounded-full">
                                      +
                                      {currentKoi.media.filter(
                                        (media) => media.mediaType === "Video"
                                      ).length - 1}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "300px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  background: "#0f0f0f",
                                  color: "#f0f0f0",
                                  borderRadius: "8px",
                                }}
                              >
                                Không có video
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Modal>

        {/* Modal hiển thị tất cả media */}
        <Modal
          title="Tất cả hình ảnh và video"
          open={mediaModalVisible}
          onCancel={() => setMediaModalVisible(false)}
          footer={null}
          width={"90%"}
          style={{ maxWidth: 900 }}
          maskClosable={true}
          keyboard={true}
        >
          {currentKoi?.media?.filter((media) => media.mediaType === "Image")
            .length > 0 && (
            <>
              <Typography.Title level={5}>Hình Ảnh</Typography.Title>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {currentKoi?.media
                  ?.filter((media) => media.mediaType === "Image")
                  .map((media, index) => (
                    <Col xs={24} sm={12} key={`image-${media.id}`}>
                      <div
                        className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-[300px]"
                        style={{ borderRadius: "8px" }}
                      >
                        <Image
                          src={media.mediaUrl}
                          alt={`Hình Ảnh Koi ${index + 1}`}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            margin: "0 auto",
                            display: "block",
                          }}
                        />
                      </div>
                    </Col>
                  ))}
              </Row>
            </>
          )}

          {currentKoi?.media?.filter((media) => media.mediaType === "Video")
            .length > 0 && (
            <>
              <Typography.Title level={5}>Video</Typography.Title>
              <Row gutter={[16, 16]}>
                {currentKoi?.media
                  ?.filter((media) => media.mediaType === "Video")
                  .map((media, index) => (
                    <Col xs={24} sm={12} key={`video-${media.id}`}>
                      <div
                        className="bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center h-[300px]"
                        style={{ borderRadius: "8px" }}
                      >
                        <video
                          controls
                          src={media.mediaUrl}
                          style={{
                            width: "100%",
                            height: "auto",
                            maxHeight: "100%",
                            borderRadius: "8px",
                          }}
                        />
                      </div>
                    </Col>
                  ))}
              </Row>
            </>
          )}
        </Modal>
      </Card>
    </ConfigProvider>
  );
}

export default RoundResult;
