import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Space,
  Select,
  Row,
  Col,
  Button,
  Image,
  Spin,
  Tooltip,
  Drawer,
  Tabs,
  Typography,
  Descriptions,
  List,
  Card as AntCard,
  Empty,
  Collapse,
  Steps,
  Divider,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  TrophyOutlined,
  AimOutlined,
  QrcodeOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import useCategory from "../../hooks/useCategory";
import useRound from "../../hooks/useRound";
import useRegistrationRound from "../../hooks/useRegistrationRound";
import useScore from "../../hooks/useScore";
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const { Option } = Select;

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

function CompetitionRound({ showId }) {
  const [categoryId, setCategoryId] = useState(null);
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [subRounds, setSubRounds] = useState([]);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState(null);
  const [scoreDetails, setScoreDetails] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentRoundType, setCurrentRoundType] = useState(null);

  const roundTypeLabels = {
    Preliminary: "Vòng Sơ Khảo",
    Evaluation: "Vòng Đánh Giá Chính",
    Final: "Vòng Chung Kết",
  };

  const {
    categories,
    fetchCategories,
    isLoading: categoryLoading,
  } = useCategory();
  const {
    round,
    refereeRoundTypes,
    fetchRound,
    fetchRoundByReferee,
    isLoading: roundLoading,
  } = useRound();

  const {
    fetchRegistrationRound,
    registrationRound,
    isLoading: registrationLoading,
    currentPage,
    pageSize,
    totalItems,
  } = useRegistrationRound();

  const { fetchScoreDetail } = useScore();

  // Fetch categories when component mounts or showId changes
  useEffect(() => {
    if (showId) {
      fetchCategories(showId);
    }
  }, [showId, fetchCategories]);

  // When category changes, fetch round types for referee
  useEffect(() => {
    if (categoryId) {
      fetchRoundByReferee(categoryId);
      setSelectedRoundType(null); // Reset selected round type
      setSubRounds([]); // Reset sub rounds
      setSelectedSubRound(null); // Reset selected sub round
    }
  }, [categoryId, fetchRoundByReferee]);

  // When round type is selected, fetch sub-rounds
  useEffect(() => {
    if (categoryId && selectedRoundType) {
      // Fetch sub-rounds for the selected round type
      fetchRound(categoryId, selectedRoundType);
      setSelectedSubRound(null); // Reset selected sub round when round type changes
    }
  }, [categoryId, selectedRoundType, fetchRound]);

  // Process sub-rounds from the fetched data
  useEffect(() => {
    if (round && round.length > 0) {
      // Extract unique sub-rounds from the response and sort by roundOrder
      const uniqueSubRounds = round
        .map((item) => ({
          id: item.id,
          name: item.name,
          roundOrder: item.roundOrder,
        }))
        .sort((a, b) => a.roundOrder - b.roundOrder);
      setSubRounds(uniqueSubRounds);
    } else {
      setSubRounds([]);
    }
  }, [round]);

  // Fetch registration data when a sub-round is selected
  useEffect(() => {
    if (selectedSubRound) {
      fetchRegistrationRound(selectedSubRound, 1, 10);
    }
  }, [selectedSubRound, fetchRegistrationRound]);

  // Image handling functions
  const handleImageLoad = (id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  };

  const handleImageLoadStart = (id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  };

  // Update the current step based on selection states
  useEffect(() => {
    if (categoryId) {
      setCurrentStep(0);
    }
    if (selectedRoundType) {
      setCurrentStep(1);
    }
    if (selectedSubRound) {
      setCurrentStep(2);
    }
  }, [categoryId, selectedRoundType, selectedSubRound]);

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    setSelectedRoundType(null);
    setSelectedSubRound(null);
    setSubRounds([]);
    setCurrentStep(0);
  };

  const handleRoundTypeChange = (value) => {
    setSelectedRoundType(value);
    setSelectedSubRound(null);
    setSubRounds([]);
    setCurrentStep(1);
  };

  const handleSubRoundChange = (value) => {
    setSelectedSubRound(value);
    setCurrentStep(2);
  };

  const handleTableChange = (pagination) => {
    if (selectedSubRound) {
      fetchRegistrationRound(
        selectedSubRound,
        pagination.current,
        pagination.pageSize
      );
    }
  };

  const handleReloadTable = () => {
    if (selectedSubRound) {
      fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
    }
  };

  const handleViewDetails = async (record) => {
    setCurrentRegistration(record);
    setIsDetailDrawerVisible(true);

    // Lưu loại vòng hiện tại vào state để sử dụng trong Drawer
    setCurrentRoundType(selectedRoundType);

    // Fetch score details when opening the drawer
    if (record && record.id) {
      const response = await fetchScoreDetail(record.id);
      if (response.success) {
        setScoreDetails(response.data);
      } else {
        setScoreDetails(null);
      }
    }
  };

  const handleDrawerClose = () => {
    setIsDetailDrawerVisible(false);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Mã Đăng Ký",
        dataIndex: ["registration", "registrationNumber"],
        render: (registrationNumber, record) => {
          return registrationNumber || "—";
        },
      },
      {
        title: "Hình ảnh",
        dataIndex: ["registration", "koiMedia"],
        render: (koiMedia, record) => {
          const id = record.key;
          const imageMedia =
            koiMedia && koiMedia.length > 0
              ? koiMedia.find((media) => media.mediaType === "Image")
              : null;

          const imageUrl = imageMedia?.mediaUrl || PLACEHOLDER_IMAGE;

          return (
            <div className="w-[70px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
              <Image
                src={imageUrl}
                alt="Hình cá"
                width={70}
                height={50}
                className="object-cover"
                preview={{
                  src: imageMedia?.mediaUrl,
                  mask: <div className="text-xs">Xem</div>,
                }}
                placeholder={
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Spin size="small" />
                  </div>
                }
                fallback={PLACEHOLDER_IMAGE}
              />
            </div>
          );
        },
      },
      {
        title: "Kích thước",
        dataIndex: ["registration", "koiSize"],
        render: (size) => (size ? `${size} cm` : "—"),
      },
      {
        title: "Giống",
        dataIndex: ["registration", "koiProfile", "variety", "name"],
        ellipsis: true,
        render: (name) => name || "—",
      },
      {
        title: selectedRoundType === "Preliminary" ? "Kết quả" : "Điểm",
        dataIndex: ["roundResults", "0", "totalScore"],
        key: "score",
        render: (totalScore, record) => {
          if (totalScore === undefined || totalScore === null) return "—";

          // Hiển thị trạng thái (Pass/Fail) cho vòng Sơ Khảo
          if (selectedRoundType === "Preliminary") {
            const status = record.roundResults?.[0]?.status;
            return (
              <Tooltip title="Kết quả">
                <Tag
                  color={status === "Pass" ? "green" : "red"}
                  style={{ fontSize: "14px", fontWeight: "bold" }}
                >
                  {status === "Pass" ? "Đạt" : "Không đạt"}
                </Tag>
              </Tooltip>
            );
          }

          // Hiển thị điểm cho các vòng khác
          return (
            <Tooltip title="Điểm tổng">
              <Tag
                color="blue"
                style={{ fontSize: "14px", fontWeight: "bold" }}
              >
                {totalScore}
              </Tag>
            </Tooltip>
          );
        },
      },
      {
        title: "Bể",
        dataIndex: "tankName",
        render: (tank) => <span>{tank || "Chưa phân bổ"}</span>,
      },
      {
        title: "Hành động",
        key: "action",
        render: (_, record) => (
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="text-gray-500 hover:text-blue-500"
            onClick={() => handleViewDetails(record)}
          />
        ),
      },
    ];

    return baseColumns;
  }, [categories, selectedRoundType]);

  const displayData = useMemo(() => {
    if (
      !registrationLoading &&
      selectedSubRound &&
      Array.isArray(registrationRound)
    ) {
      return registrationRound.map((item, index) => ({
        ...item,
        key: item.id || `registration-${index}`,
        index: index + 1 + (currentPage - 1) * pageSize,
      }));
    }
    return [];
  }, [
    registrationRound,
    currentPage,
    pageSize,
    registrationLoading,
    selectedSubRound,
  ]);
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Title level={3} className="text-center mb-6 text-blue-700">
        <TrophyOutlined className="mr-2 my-3" />
        Kết quả thi đấu
      </Title>

      <Steps
        current={currentStep}
        className="mb-8 custom-steps"
        labelPlacement="vertical"
        responsive
        size="small"
      >
        <Step title="Hạng mục" icon={<AimOutlined />} />
        <Step title="Vòng thi" icon={<TrophyOutlined />} />
        <Step title="Xem kết quả" icon={<PercentageOutlined />} />
      </Steps>

      <AntCard className="shadow-sm mb-6">
        <Row gutter={[16, 16]} className="mb-2">
          <Col xs={24} sm={8}>
            <div>
              <Text strong className="block text-base mb-2 text-gray-700">
                Hạng Mục:
              </Text>
              <Select
                placeholder="Chọn hạng mục"
                onChange={handleCategoryChange}
                allowClear
                value={categoryId}
                loading={categoryLoading}
                className="w-full rounded-md"
                size="large"
                suffixIcon={<AimOutlined />}
              >
                {categories &&
                  categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={8}>
            <div>
              <Text strong className="block text-base mb-2 text-gray-700">
                Loại Vòng:
              </Text>
              <Select
                value={selectedRoundType}
                onChange={handleRoundTypeChange}
                className="w-full rounded-md"
                placeholder={roundLoading ? "Đang tải..." : "Chọn vòng thi"}
                loading={roundLoading}
                disabled={!categoryId}
                size="large"
                suffixIcon={<TrophyOutlined />}
              >
                {refereeRoundTypes &&
                  // Sắp xếp các loại vòng theo thứ tự ưu tiên: Preliminary -> Evaluation -> Final
                  [...refereeRoundTypes]
                    .sort((a, b) => {
                      const order = {
                        Preliminary: 1,
                        Evaluation: 2,
                        Final: 3,
                      };
                      return (order[a] || 99) - (order[b] || 99);
                    })
                    .map((roundType) => (
                      <Option key={roundType} value={roundType}>
                        {roundTypeLabels[roundType] || roundType}
                      </Option>
                    ))}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={8}>
            <div>
              <Text strong className="block text-base mb-2 text-gray-700">
                Vòng:
              </Text>
              <Select
                value={selectedSubRound}
                onChange={handleSubRoundChange}
                className="w-full rounded-md"
                placeholder="Chọn vòng"
                disabled={!selectedRoundType}
                size="large"
                suffixIcon={<TrophyOutlined />}
              >
                {subRounds
                  .sort((a, b) => {
                    if (
                      a.roundOrder !== undefined &&
                      b.roundOrder !== undefined
                    ) {
                      return a.roundOrder - b.roundOrder;
                    }
                    return (a.name || "").localeCompare(b.name || "");
                  })
                  .map((subRound) => (
                    <Option key={subRound.id} value={subRound.id}>
                      {subRound.name}
                    </Option>
                  ))}
              </Select>
            </div>
          </Col>
        </Row>
      </AntCard>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={displayData}
          loading={registrationLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
            responsive: true,
          }}
          locale={{
            emptyText: (
              <Empty
                description="Không có dữ liệu"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "24px 0" }}
              />
            ),
          }}
          onChange={handleTableChange}
          className="mt-4"
          scroll={{ x: "max-content" }}
        />
      </div>

      <Drawer
        title="Chi tiết kết quả"
        width={window.innerWidth > 768 ? 600 : "80%"}
        onClose={handleDrawerClose}
        open={isDetailDrawerVisible}
      >
        {currentRegistration && (
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane
              tab={
                <span>
                  <TrophyOutlined className="mx-2" />
                  Chi tiết điểm số
                </span>
              }
              key="2"
            >
              {selectedRoundType === "Preliminary" ? (
                <Empty description="Vòng sơ khảo không có chi tiết điểm số" />
              ) : scoreDetails &&
                scoreDetails.data &&
                scoreDetails.data.length > 0 ? (
                <List
                  grid={{ gutter: 16, column: 1 }}
                  dataSource={scoreDetails.data}
                  renderItem={(scoreItem) => (
                    <List.Item>
                      <AntCard
                        title={
                          <div className="flex justify-between items-center">
                            <span>Điểm số của trọng tài</span>
                            <Typography.Text className="text-sm">
                              Thời gian:{" "}
                              {scoreItem.createdAt
                                ? new Date(
                                    scoreItem.createdAt
                                  ).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                : "—"}
                            </Typography.Text>
                          </div>
                        }
                      >
                        <div className="bg-gray-50 p-4 mb-4 rounded-md">
                          <Row gutter={16} justify="space-between">
                            <Col
                              xs={24}
                              md={8}
                              className="text-center mb-4 md:mb-0"
                            >
                              <Typography.Text className="block text-gray-600">
                                Điểm ban đầu
                              </Typography.Text>
                              <Typography.Text className="block text-3xl font-bold text-blue-500">
                                {scoreItem.initialScore.toFixed(1)}
                              </Typography.Text>
                            </Col>
                            <Col
                              xs={24}
                              md={8}
                              className="text-center mb-4 md:mb-0"
                            >
                              <Typography.Text className="block text-gray-600">
                                Điểm trừ
                              </Typography.Text>
                              <Typography.Text className="block text-3xl font-bold text-red-500">
                                {scoreItem.totalPointMinus
                                  ? `-${scoreItem.totalPointMinus.toFixed(1)}`
                                  : "0.0"}
                              </Typography.Text>
                            </Col>
                            <Col xs={24} md={8} className="text-center">
                              <Typography.Text className="block text-gray-600">
                                Điểm cuối cùng
                              </Typography.Text>
                              <Typography.Text className="block text-3xl font-bold text-green-500">
                                {(
                                  scoreItem.initialScore -
                                  (scoreItem.totalPointMinus || 0)
                                ).toFixed(1)}
                              </Typography.Text>
                            </Col>
                          </Row>
                          <Divider style={{ margin: "12px 0" }} />
                          <Row>
                            <Col span={24}>
                              <div className="flex ">
                                <Typography.Text
                                  strong
                                  style={{
                                    minWidth: "70px",
                                    marginRight: "8px",
                                  }}
                                >
                                  Ghi chú:
                                </Typography.Text>
                                <Typography.Text>
                                  {scoreItem.comments || "Không có ghi chú"}
                                </Typography.Text>
                              </div>
                            </Col>
                          </Row>
                        </div>

                        {scoreItem.criteriaWithErrors &&
                        scoreItem.criteriaWithErrors.length > 0 ? (
                          <div className="mt-4">
                            {scoreItem.criteriaWithErrors.map((criteria) => {
                              const hasErrors =
                                criteria.errors && criteria.errors.length > 0;
                              const totalCriteriaDeduction = hasErrors
                                ? criteria.errors.reduce(
                                    (sum, err) => sum + (err.pointMinus || 0),
                                    0
                                  )
                                : 0;

                              return (
                                <div
                                  key={criteria.id}
                                  className="mb-4 border-b "
                                >
                                  <Collapse>
                                    <Collapse.Panel
                                      header={
                                        <div className="flex justify-between ">
                                          <div className="flex ">
                                            <Typography.Text
                                              strong
                                              className="mr-2"
                                            >
                                              {criteria.name}
                                            </Typography.Text>
                                            <Tag color="blue">
                                              {(criteria.weight * 100).toFixed(
                                                0
                                              )}
                                              %
                                            </Tag>
                                          </div>
                                          {hasErrors && (
                                            <Tag color="red">
                                              -{totalCriteriaDeduction} điểm
                                            </Tag>
                                          )}
                                        </div>
                                      }
                                    >
                                      {hasErrors ? (
                                        criteria.errors.map((error, idx) => {
                                          const severityColor =
                                            error.severity === "eb"
                                              ? "red"
                                              : error.severity === "mb"
                                                ? "orange"
                                                : "blue";
                                          const severityText =
                                            error.severity === "eb"
                                              ? "Nặng"
                                              : error.severity === "mb"
                                                ? "Trung bình"
                                                : "Nhẹ";

                                          // Thêm phần trăm vào text hiển thị
                                          const displayText = error.weight
                                            ? `${severityText} (${(error.weight * 100).toFixed(0)}%)`
                                            : severityText;

                                          return (
                                            <div
                                              key={error.id || idx}
                                              className="mb-3 p-3 border rounded-md"
                                            >
                                              <div className="flex flex-col">
                                                <div className="mb-1">
                                                  <Typography.Text strong>
                                                    Lỗi : {error.errorTypeName}
                                                  </Typography.Text>
                                                </div>
                                                <div className="mb-1">
                                                  <Typography.Text>
                                                    Mức độ:{" "}
                                                    <Tag color={severityColor}>
                                                      {displayText}
                                                    </Tag>
                                                  </Typography.Text>
                                                </div>
                                                <div>
                                                  <Typography.Text>
                                                    Điểm trừ:{" "}
                                                    <span className="text-red-500">
                                                      -{error.pointMinus} điểm
                                                    </span>
                                                  </Typography.Text>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <Typography.Text
                                          type="success"
                                          className="block py-2"
                                        >
                                          Không có lỗi ở tiêu chí này
                                        </Typography.Text>
                                      )}
                                    </Collapse.Panel>
                                  </Collapse>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Empty description="Không có chi tiết đánh giá" />
                        )}
                      </AntCard>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="Không có dữ liệu điểm số" />
              )}
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>

      <style>{`
        .custom-steps .ant-steps-item-icon {
          background: #f0f7ff;
          border-color: #1890ff;
        }
        .custom-steps .ant-steps-item-active .ant-steps-item-icon {
          background: #1890ff;
        }

        @media (max-width: 768px) {
          .ant-form-item-label {
            padding-bottom: 4px;
          }
          .custom-steps .ant-steps-item-content {
            min-height: auto;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .custom-steps .ant-steps-item-title {
            font-size: 14px;
          }
          .ant-table-wrapper {
            overflow-x: auto;
          }
          .ant-table {
            min-width: 650px;
          }
          .ant-drawer-content-wrapper {
            width: 70% !important;
          }
          .ant-collapse-content {
            overflow-x: auto;
          }
          .ant-card-head-title,
          .ant-card-extra {
            padding: 12px 0;
          }
          .ant-select-selector {
            height: 42px !important;
          }
          .ant-select-selection-item {
            line-height: 40px !important;
          }
        }

        /* Specific iPad optimization */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .ant-steps-item-icon {
            margin: 0 auto 8px;
          }
          .ant-steps-item-title {
            text-align: center;
          }
          .ant-table-cell {
            padding: 12px 8px;
          }
          .ant-table {
            font-size: 13px;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
          .ant-table {
            min-width: 800px;
          }
        }
      `}</style>
    </div>
  );
}

export default CompetitionRound;
