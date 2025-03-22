import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Table,
  Tag,
  Select,
  Row,
  Col,
  Spin,
  Empty,
  Image,
  Card,
  notification,
  Button,
  Typography,
  Space,
  Drawer,
  Descriptions,
  Tabs,
  List,
} from "antd";
import {
  EyeOutlined,
  FileImageOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";
import useRegistrationRound from "../../../hooks/useRegistrationRound";
import useTank from "../../../hooks/useTank";
import NextRound from "./NextRound";
import { getEvaluationColumns } from "./EvaluationColumns";

const { Option } = Select;
const { TabPane } = Tabs;

const roundTypes = ["Preliminary", "Evaluation", "Final"];
const roundTypeLabels = {
  Preliminary: "Vòng Sơ Khảo",
  Evaluation: "Vòng Đánh Giá Chính",
  Final: "Vòng Chung Kết",
};

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

function CompetitionRound({ showId }) {
  // Tracking mount state to prevent updates after unmount
  const isMounted = useRef(true);

  // Category state
  const { categories, fetchCategories } = useCategory();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Round state
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const { round, fetchRound, isLoading: roundLoading } = useRound();

  console.log("round", round);
  // Registration and tank states
  const {
    registrationRound,
    fetchRegistrationRound: originalFetchRegistrationRound,
    updateFishTankInRound: originalUpdateFishTankInRound,
    isLoading: registrationLoading,
    totalItems: registrationTotalItems,
    currentPage,
    pageSize,
    totalPages,
  } = useRegistrationRound();

  const { competitionRoundTanks, fetchTanks } = useTank();
  const { updatePublishRound } = useRegistrationRound();
  const [loadingImages, setLoadingImages] = useState({});
  const [assigningTank, setAssigningTank] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);

  // Replace modal state with drawer state
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState(null);

  // Add state to check if all tanks are assigned - FIX THE INFINITE LOOP
  const allTanksAssigned = useMemo(() => {
    if (
      !selectedSubRound ||
      !Array.isArray(registrationRound) ||
      registrationRound.length === 0
    ) {
      return false;
    }
    // Check if every registration has a tankName
    return registrationRound.every((item) => Boolean(item.tankName));
  }, [registrationRound, selectedSubRound]);

  // Update the logic to hide the button only when ALL items are published
  const isRoundPublished = useMemo(() => {
    if (
      !selectedSubRound ||
      !Array.isArray(registrationRound) ||
      registrationRound.length === 0
    ) {
      return false;
    }

    // Only consider the round fully published when ALL items are published
    // If even one item is not published, the button should remain visible
    return registrationRound.every((item) => item.status === "public");
  }, [registrationRound, selectedSubRound]);

  // Safe API wrappers to prevent undefined calls
  const fetchRegistrationRound = useCallback(
    (roundId, page, size) => {
      if (!isMounted.current) return Promise.resolve(null);

      if (!roundId || roundId === "undefined" || typeof roundId !== "string") {
        console.warn("[fetchRegistrationRound] Invalid roundId:", roundId);
        return Promise.resolve(null);
      }

      // console.log('[fetchRegistrationRound] Calling API with valid ID:', roundId, page, size);
      return originalFetchRegistrationRound(roundId, page, size);
    },
    [originalFetchRegistrationRound]
  );

  const updateFishTankInRound = useCallback(
    (registrationRoundId, tankId) => {
      if (!isMounted.current) return Promise.resolve(null);

      if (!registrationRoundId || registrationRoundId === "undefined") {
        console.warn(
          "[updateFishTankInRound] Invalid registrationRoundId:",
          registrationRoundId
        );
        return Promise.resolve(null);
      }

      // console.log('[updateFishTankInRound] Updating tank:', registrationRoundId, tankId);
      return originalUpdateFishTankInRound(registrationRoundId, tankId);
    },
    [originalUpdateFishTankInRound]
  );

  // Lifecycle management
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch categories when component mounts
  useEffect(() => {
    if (showId) {
      fetchCategories(showId);
    }
  }, [fetchCategories, showId]);

  // Handle category selection
  const handleCategoryChange = useCallback(
    (value) => {
      // Reset dependent selections
      setSelectedRoundType(null);
      setSelectedSubRound(null);
      setSelectedCategory(value);

      if (value) {
        fetchTanks(value, 1, 10, true);
      }
    },
    [fetchTanks]
  );

  // Handle round type selection
  const handleRoundTypeChange = useCallback(
    (value) => {
      // console.log('[RoundType] Selected:', value);

      // Reset sub-round
      setSelectedSubRound(null);
      setSelectedRoundType(value);

      if (selectedCategory && value) {
        fetchRound(selectedCategory, value);
      }
    },
    [selectedCategory, fetchRound]
  );

  // Handle sub-round selection
  const handleSubRoundChange = useCallback(
    (value) => {
      // Validate the value
      if (value === "undefined" || value === undefined) {
        console.warn("[SubRound] Received invalid value, setting to null");
        value = null;
      }

      setSelectedSubRound(value);

      // Only fetch if we have a valid value
      if (value && typeof value === "string" && value !== "undefined") {
        fetchRegistrationRound(value, 1, pageSize);
      }
    },
    [fetchRegistrationRound, pageSize]
  );

  // Handle pagination
  const handleTableChange = useCallback(
    (pagination) => {
      console.log("[Pagination] Changed to:", pagination.current);

      if (
        selectedSubRound &&
        typeof selectedSubRound === "string" &&
        selectedSubRound !== "undefined"
      ) {
        console.log("[Pagination] Fetching data for page:", pagination.current);
        fetchRegistrationRound(
          selectedSubRound,
          pagination.current || 1,
          pagination.pageSize || 10
        );
      } else {
        console.warn(
          "[Pagination] Skipping fetch due to invalid selectedSubRound:",
          selectedSubRound
        );
      }
    },
    [selectedSubRound, fetchRegistrationRound]
  );

  // Handle tank assignment
  const handleTankAssignment = useCallback(
    async (registrationRoundId, tankId) => {
      // console.log('[TankAssign] Starting assignment:', registrationRoundId, tankId);

      if (!registrationRoundId) {
        console.warn("[TankAssign] Missing registrationRoundId");
        return;
      }

      try {
        setAssigningTank((prev) => ({ ...prev, [registrationRoundId]: true }));

        const result = await updateFishTankInRound(registrationRoundId, tankId);

        if (result?.success) {
          notification.success({
            message: "Thành công",
            description: "Cập nhật bể thành công",
          });

          // Only refetch if we have a valid selectedSubRound
          if (
            selectedSubRound &&
            typeof selectedSubRound === "string" &&
            selectedSubRound !== "undefined"
          ) {
            // console.log('[TankAssign] Refetching after successful update with ID:', selectedSubRound);
            fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
          } else {
            console.warn(
              "[TankAssign] Skipping refetch due to invalid selectedSubRound:",
              selectedSubRound
            );
          }
        } else {
          notification.error({
            message: "Lỗi",
            description: `Không thể cập nhật bể: ${result?.error?.message || "Lỗi không xác định"}`,
          });
        }
      } catch (error) {
        console.error("[TankAssign] Error:", error);
        notification.error({
          message: "Lỗi",
          description: `Không thể cập nhật bể: ${error?.message || "Lỗi không xác định"}`,
        });
      } finally {
        setAssigningTank((prev) => ({ ...prev, [registrationRoundId]: false }));
      }
    },
    [
      selectedSubRound,
      currentPage,
      pageSize,
      fetchRegistrationRound,
      updateFishTankInRound,
    ]
  );

  // Image handling functions
  const handleImageLoad = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  const handleImageLoadStart = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleImageError = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  // Add functions to handle drawer
  const showCategoryDetail = (record) => {
    setCurrentRegistration(record);
    setIsDetailDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setIsDetailDrawerVisible(false);
  };

  // Prepare display data with proper memoization
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

  // Lấy đúng columns dựa trên loại vòng
  const getColumnsForRoundType = () => {
    // Nếu đang ở vòng Đánh Giá Chính
    if (selectedRoundType === "Evaluation") {
      return getEvaluationColumns({
        handleViewDetails: showCategoryDetail,
        loadingImages,
        allTanksAssigned,
        isRoundPublished,
        assigningTank,
        competitionRoundTanks,
        handleTankChange: handleTankAssignment
      });
    }
    
    // Mặc định sử dụng cột của vòng Sơ Khảo
    return [
      // Các cột hiện tại cho vòng Sơ Khảo
      {
        title: "#",
        dataIndex: "index",
        key: "index",
        width: 50,
        render: (_, __, index) => <strong>#{index + 1}</strong>,
      },
      {
        title: "Mã Đăng Ký",
        dataIndex: ["registration", "registrationNumber"],
        render: (registrationNumber, record) => {
          return (
            registrationNumber ||
            record.registration?.id?.substring(0, 8) ||
            "—"
          );
        },
      },
      {
        title: "Hình ảnh",
        dataIndex: ["registration", "koiMedia"],
        width: 100,
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
        title: "Kết quả",
        dataIndex: "roundResults",
        render: (results) => {
          if (!results || results.length === 0)
            return <Tag color="gray">Chưa có</Tag>;

          // Get the status from the roundResult field
          const status = results[0]?.status;

          if (status === "Pass") {
            return <Tag color="green">Đạt</Tag>;
          } else if (status === "Fail") {
            return <Tag color="red">Không đạt</Tag>;
          } else {
            return <Tag color="orange">{status || "Đang chờ"}</Tag>;
          }
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        render: (status) => {
          let color = "blue";
          let text = status;

          switch (status) {
            case "unpublic":
              color = "gray";
              text = "Chưa công khai";
              break;
            case "public":
              color = "green";
              text = "Đã công khai";
              break;
            case "pending":
              color = "orange";
              text = "Đang chờ";
              break;
            default:
              text = status || "—";
          }

          return <Tag color={color}>{text}</Tag>;
        },
      },
    ];
  };

  // Handle publishing round - Make sure it doesn't trigger on render
  const handlePublishRound = useCallback(async () => {
    if (!selectedSubRound) {
      notification.warning({
        message: "Thông báo",
        description: "Vui lòng chọn vòng thi trước khi công khai",
      });
      return;
    }

    try {
      setIsPublishing(true);
      const result = await updatePublishRound(selectedSubRound);

      if (result?.success) {
        notification.success({
          message: "Thành công",
          description: "Đã công khai vòng thi thành công",
        });

        // Refresh data - ONLY if component is still mounted
        if (isMounted.current) {
          fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: `Không thể công khai vòng thi: ${result?.error?.message || "Lỗi không xác định"}`,
        });
      }
    } catch (error) {
      console.error("[PublishRound] Error:", error);
      notification.error({
        message: "Lỗi",
        description: `Không thể công khai vòng thi: ${error?.message || "Lỗi không xác định"}`,
      });
    } finally {
      if (isMounted.current) {
        setIsPublishing(false);
      }
    }
  }, [
    selectedSubRound,
    updatePublishRound,
    fetchRegistrationRound,
    currentPage,
    pageSize,
  ]);

  return (
    <Card>
      <div className="mb-4">
        <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
          <div className="w-full md:w-1/4">
            <div className="text-lg font-medium mb-2">Hạng Mục:</div>
            <Select
              placeholder="Chọn hạng mục"
              onChange={handleCategoryChange}
              allowClear
              value={selectedCategory}
              loading={!categories}
              disabled={!categories || categories.length === 0}
              className="w-full"
            >
              {categories?.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </div>

          {selectedCategory && (
            <div className="w-full md:w-1/4">
              <div className="text-lg font-medium mb-2">Vòng Chính:</div>
              <Select
                value={selectedRoundType}
                onChange={handleRoundTypeChange}
                className="w-full"
                placeholder="Chọn vòng"
              >
                {roundTypes.map((type) => (
                  <Option key={type} value={type}>
                    {roundTypeLabels[type] || type}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {selectedRoundType && (
            <div className="w-full md:w-1/4">
              <div className="text-lg font-medium mb-2">Vòng Phụ:</div>
              <Select
                value={selectedSubRound}
                onChange={handleSubRoundChange}
                className="w-full"
                placeholder={roundLoading ? "Đang tải..." : "Chọn vòng phụ"}
                loading={roundLoading}
                notFoundContent={
                  roundLoading ? <Spin size="small" /> : "Không có vòng phụ"
                }
              >
                {round?.map((item) => (
                  <Option
                    key={item.id || item.roundId}
                    value={item.id || item.roundId}
                  >
                    {item.name || item.roundName || `Vòng ${item.id}`}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* Only show the publish button if selected round is not already published */}
          {selectedSubRound && !isRoundPublished && (
            <div className="w-full md:w-1/4 self-end">
              <Button
                type="primary"
                className="w-full"
                onClick={handlePublishRound}
                loading={isPublishing}
                icon={<TrophyOutlined />}
                disabled={!allTanksAssigned}
              >
                Công khai vòng thi
              </Button>
            </div>
          )}

          {/* Add the new MoveToNextRoundButton component */}
          <NextRound
            registrationRound={registrationRound}
            selectedSubRound={selectedSubRound}
            selectedCategory={selectedCategory}
            selectedRoundType={selectedRoundType}
            roundTypes={roundTypes}
            fetchRegistrationRound={fetchRegistrationRound}
            currentPage={currentPage}
            pageSize={pageSize}
          />
        </div>
      </div>

      <Table
        columns={getColumnsForRoundType()}
        dataSource={displayData}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: registrationTotalItems,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} trong ${total} mục`,
        }}
        onChange={handleTableChange}
        loading={registrationLoading}
      />

      {/* Detail Drawer */}
      <Drawer
        title={
          currentRegistration?.registration?.registrationNumber
            ? `Mã đăng ký: ${currentRegistration.registration.registrationNumber}`
            : "Chi tiết đăng ký"
        }
        placement="right"
        width={720}
        onClose={handleDrawerClose}
        open={isDetailDrawerVisible}
      >
        {currentRegistration && (
          <Tabs defaultActiveKey="1">
            {/* Tab 1: Thông tin cơ bản */}
            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined className="mx-2" />
                  Thông tin cơ bản
                </span>
              }
              key="1"
            >
              <Descriptions bordered column={1} className="mb-4">
                <Descriptions.Item label="Mã Đăng Ký">
                  {currentRegistration.registration?.registrationNumber ||
                    currentRegistration.registration?.id?.substring(0, 8) ||
                    "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Tên Người Đăng Ký">
                  {currentRegistration.registration?.registerName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Tên Cá Koi">
                  {currentRegistration.registration?.koiProfile?.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Giống">
                  {currentRegistration.registration?.koiProfile?.variety
                    ?.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Kích Thước">
                  {currentRegistration.registration?.koiSize
                    ? `${currentRegistration.registration.koiSize} cm`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Tuổi Cá">
                  {currentRegistration.registration?.koiAge
                    ? `${currentRegistration.registration.koiAge} năm`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Dòng máu">
                  {currentRegistration.registration?.koiProfile?.bloodline ||
                    "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Hạng Mục">
                  {currentRegistration.registration?.competitionCategory
                    ?.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Phí Đăng Ký">
                  {currentRegistration.registration?.registrationFee
                    ? `${currentRegistration.registration.registrationFee.toLocaleString()} VND`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng Thái">
                  <Tag
                    color={
                      currentRegistration.status === "unpublic"
                        ? "gray"
                        : currentRegistration.status === "public"
                          ? "green"
                          : currentRegistration.status === "pending"
                            ? "orange"
                            : "default"
                    }
                  >
                    {currentRegistration.status === "unpublic"
                      ? "Chưa công khai"
                      : currentRegistration.status === "public"
                        ? "Đã công khai"
                        : currentRegistration.status === "pending"
                          ? "Đang chờ"
                          : currentRegistration.status || "—"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Bể">
                  {currentRegistration.tankName || "Chưa gán bể"}
                </Descriptions.Item>
                {currentRegistration.checkInTime && (
                  <Descriptions.Item label="Thời gian check-in">
                    {new Date(currentRegistration.checkInTime).toLocaleString()}
                  </Descriptions.Item>
                )}
                {currentRegistration.checkOutTime && (
                  <Descriptions.Item label="Thời gian check-out">
                    {new Date(
                      currentRegistration.checkOutTime
                    ).toLocaleString()}
                  </Descriptions.Item>
                )}
                {currentRegistration.notes && (
                  <Descriptions.Item label="Ghi chú">
                    {currentRegistration.notes}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </TabPane>
            {/* QR Code Tab - Moved up in the tab order */}
            <TabPane
              tab={
                <span>
                  <QrcodeOutlined className="mx-2" />
                  Mã QR chấm điểm
                </span>
              }
              key="qrcode"
            >
              <div className="flex flex-col items-center">
                <Typography.Title level={4} className="mb-4">
                  Mã QR dành cho trọng tài chấm điểm
                </Typography.Title>
                {currentRegistration.registration?.qrcodeData ? (
                  <Card bordered={false} className="mb-4 shadow-md">
                    <Image
                      src={currentRegistration.registration.qrcodeData}
                      alt="QR Code chấm điểm"
                      width={300}
                      className="mx-auto"
                    />
                  </Card>
                ) : (
                  <Empty description="Không có mã QR" />
                )}
                <Typography.Text type="secondary" className="text-center mb-6">
                  Trọng tài có thể quét mã QR này để chấm điểm cho cá Koi
                </Typography.Text>
              </div>
            </TabPane>
            {/* Tab 2: Hình ảnh và video */}
            {currentRegistration.registration?.koiMedia &&
              currentRegistration.registration.koiMedia.length > 0 && (
                <TabPane
                  tab={
                    <span>
                      <FileImageOutlined className="mx-2" />
                      Hình ảnh & Video
                    </span>
                  }
                  key="2"
                >
                  <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={currentRegistration.registration.koiMedia}
                    renderItem={(media) => (
                      <List.Item>
                        {media.mediaType === "Image" ? (
                          <Card title="Hình Ảnh">
                            <Image
                              src={media.mediaUrl}
                              alt="Hình Ảnh Koi"
                              style={{
                                width: "100%",
                                maxHeight: "400px",
                                objectFit: "contain",
                              }}
                            />
                          </Card>
                        ) : media.mediaType === "Video" ? (
                          <Card title="Video">
                            <video
                              controls
                              src={media.mediaUrl}
                              style={{ width: "100%" }}
                            />
                          </Card>
                        ) : null}
                      </List.Item>
                    )}
                  />
                </TabPane>
              )}
            {/* Tab 3: Kết quả */}
            {currentRegistration.roundResults &&
              currentRegistration.roundResults.length > 0 && (
                <TabPane
                  tab={
                    <span>
                      <TrophyOutlined className="mx-2" />
                      Kết quả vòng thi
                    </span>
                  }
                  key="3"
                >
                  <List
                    dataSource={currentRegistration.roundResults}
                    renderItem={(result) => (
                      <List.Item>
                        <Card
                          title={result.roundName || "Vòng thi"}
                          extra={
                            <Tag
                              color={
                                currentRegistration.roundResults[0]?.status ===
                                "Pass"
                                  ? "green"
                                  : "red"
                              }
                            >
                              {currentRegistration.roundResults[0]?.status ===
                              "Pass"
                                ? "Đạt"
                                : "Không đạt"}
                            </Tag>
                          }
                        >
                          <p>
                            <strong>Thời gian:</strong>{" "}
                            {result.createdAt
                              ? new Date(result.createdAt).toLocaleString()
                              : "—"}
                          </p>
                          {result.score && (
                            <p>
                              <strong>Điểm số:</strong> {result.score}
                            </p>
                          )}
                          {result.notes && (
                            <p>
                              <strong>Ghi chú:</strong> {result.notes}
                            </p>
                          )}
                        </Card>
                      </List.Item>
                    )}
                  />
                </TabPane>
              )}
          </Tabs>
        )}
      </Drawer>
    </Card>
  );
}

export default CompetitionRound;
