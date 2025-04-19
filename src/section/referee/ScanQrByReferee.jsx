import React, { useState, useEffect } from "react";
import {
  Select,
  Row,
  Col,
  QRCode,
  Statistic,
  Card as AntCard,
  Button,
  Typography,
  Spin,
  Alert,
  Tag,
  Space,
  notification,
  Steps,
  Divider,
  Image,
  Progress,
} from "antd";
import useCategory from "../../hooks/useCategory";
import useRound from "../../hooks/useRound";
import useRegistrationRound from "../../hooks/useRegistrationRound";
import useScore from "../../hooks/useScore";
import useCriteria from "../../hooks/useCriteria";
import QrScanner from "react-qr-scanner";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  PercentageOutlined,
  QrcodeOutlined,
  TrophyOutlined,
  AimOutlined,
} from "@ant-design/icons";
import EvaluationScoreSheet from "./EvaluationScoreSheet";
import { Loading } from "../../components";

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

function ScanQrByReferee({ showId, refereeAccountId }) {
  const [categoryId, setCategoryId] = useState(null);
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const [subRounds, setSubRounds] = useState([]);
  const [qrResult, setQrResult] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [postSubmitLoading, setPostSubmitLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showDetailScoring, setShowDetailScoring] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [facingMode, setFacingMode] = useState("environment");

  const {
    criteriaCompetitionRound,
    fetchCriteriaCompetitionRound,
    resetCriteriaCompetitionRound,
    isLoading: criteriaLoading,
  } = useCriteria();

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
    fetchRegistrationRoundByReferee,
    refereeRoundData,
    resetRefereeRoundData,
    isLoading: registrationLoading,
  } = useRegistrationRound();

  const { createScore } = useScore();

  useEffect(() => {
    if (showId) {
      fetchCategories(showId);
    }
  }, [showId, fetchCategories]);

  useEffect(() => {
    if (categoryId) {
      fetchRoundByReferee(categoryId);
      setSelectedRoundType(null);
      setSubRounds([]);
      setSelectedSubRound(null);
      setCurrentStep(0);
    }
  }, [categoryId, fetchRoundByReferee]);

  useEffect(() => {
    if (categoryId && selectedRoundType) {
      fetchRound(categoryId, selectedRoundType);
      setSelectedSubRound(null);
      setCurrentStep(selectedRoundType ? 1 : 0);
    }
  }, [categoryId, selectedRoundType, fetchRound]);

  useEffect(() => {
    if (round && round.length > 0) {
      const uniqueSubRounds = round.map((item) => ({
        id: item.id,
        name: item.name,
        roundOrder: item.roundOrder,
      }));
      setSubRounds(uniqueSubRounds);
    } else {
      setSubRounds([]);
    }
  }, [round]);

  useEffect(() => {
    if (
      categoryId &&
      selectedSubRound &&
      (selectedRoundType === "Evaluation" || selectedRoundType === "Final")
    ) {
      console.log(`Fetching criteria for ${selectedRoundType} round:`, {
        categoryId: categoryId,
        roundId: selectedSubRound,
      });
      fetchCriteriaCompetitionRound(categoryId, selectedSubRound);
      setCurrentStep(selectedSubRound ? 2 : 1);
    } else if (
      selectedRoundType !== "Evaluation" &&
      selectedRoundType !== "Final"
    ) {
      resetCriteriaCompetitionRound();
    }

    if (selectedSubRound) {
      setCurrentStep(2);
    }
  }, [
    categoryId,
    selectedSubRound,
    selectedRoundType,
    fetchCriteriaCompetitionRound,
    resetCriteriaCompetitionRound,
  ]);

  useEffect(() => {
    resetCriteriaCompetitionRound();
  }, [categoryId, selectedRoundType, resetCriteriaCompetitionRound]);

  const handleScan = async (data) => {
    if (data && data.text && selectedSubRound) {
      setQrResult(data.text);
      setScannerEnabled(false);
      setScanError(null);
      try {
        const result = await fetchRegistrationRoundByReferee(
          data.text,
          selectedSubRound
        );
        if (result.success) {
          console.log("Scan successful:", result.data);
          setCurrentStep(3);
        } else {
          let errorMessage = "Không thể quét mã QR này. Vui lòng thử lại.";

          if (
            result.statusCode === 404 ||
            (typeof result.error === "object" &&
              result.error.statusCode === 404)
          ) {
            errorMessage =
              "Mã QR không hợp lệ hoặc không tìm thấy. Vui lòng kiểm tra và thử lại.";
          } else if (typeof result.error === "object") {
            errorMessage = result.error.message || JSON.stringify(result.error);
          } else if (result.error) {
            errorMessage = result.error;
          }

          setScanError(errorMessage);
          setScannerEnabled(false);
          setShowScanner(false);
        }
      } catch (error) {
        console.error("Error scanning QR code:", error);
        let errorMessage = "Đã xảy ra lỗi khi quét mã QR. Vui lòng thử lại.";

        if (error.statusCode === 404) {
          errorMessage =
            "Mã QR không hợp lệ hoặc không tìm thấy. Vui lòng kiểm tra và thử lại.";
        } else if (typeof error === "object") {
          error.message = error.message || JSON.stringify(error);
        } else if (error) {
          errorMessage = error;
        }

        setScanError(errorMessage);
        setScannerEnabled(false);
        setShowScanner(false);
      }
    }
  };

  const handleError = (err) => {
    console.error("QR Scanner error:", err);
  };

  const handleReset = () => {
    setQrResult(null);
    setScannerEnabled(true);
    setShowScanner(true);
    resetRefereeRoundData();
    setScanError(null);
    setCurrentStep(2);
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    setSelectedRoundType(null);
    setSelectedSubRound(null);
    setSubRounds([]);
    resetRefereeRoundData();
    setQrResult(null);
    setScannerEnabled(true);
    setShowScanner(false);
    setScanError(null);
    setShowDetailScoring(false);
    setCurrentStep(0);
  };

  const handleRoundTypeChange = (value) => {
    setSelectedRoundType(value);
    setSelectedSubRound(null);
    setSubRounds([]);
    resetRefereeRoundData();
    setQrResult(null);
    setScannerEnabled(true);
    setShowScanner(false);
    setScanError(null);
    setShowDetailScoring(false);
    setCurrentStep(1);
  };

  const handleSubRoundChange = (value) => {
    setSelectedSubRound(value);
    resetRefereeRoundData();
    setQrResult(null);
    setScannerEnabled(true);
    setShowScanner(false);
    setScanError(null);
    setShowDetailScoring(false);
    setCurrentStep(2);
  };

  const handleScore = async (isPass) => {
    try {
      if (
        (selectedRoundType === "Evaluation" || selectedRoundType === "Final") &&
        isPass
      ) {
        setShowDetailScoring(true);
        return { success: true };
      }

      setIsScoring(true);
      const registrationId = qrResult;
      const registrationRoundId = refereeRoundData?.id;

      if (
        !registrationId ||
        !selectedSubRound ||
        !refereeAccountId ||
        !registrationRoundId
      ) {
        console.error("Lỗi: Thiếu thông tin cần thiết để chấm điểm");
        return {
          success: false,
          error: "Thiếu thông tin cần thiết để chấm điểm",
        };
      }

      const result = await createScore(
        refereeAccountId,
        registrationRoundId,
        isPass
      );

      console.log("API Response in handleScore:", result);

      if (result?.success) {
        setIsScoring(false);
        setPostSubmitLoading(true);

        setTimeout(() => {
          resetRefereeRoundData();
          setQrResult(null);
          setScannerEnabled(true);
          setShowScanner(true);
          setPostSubmitLoading(false);
          setCurrentStep(2);
        }, 2000);
      }

      return result;
    } catch (error) {
      console.log("Error caught in handleScore:", error);
      return { success: false, error: error?.message || "Lỗi không xác định" };
    } finally {
      setIsScoring(false);
    }
  };

  const handleDetailScoreSubmitted = (scoreData) => {
    setPostSubmitLoading(true);
    setTimeout(() => {
      setShowDetailScoring(false);
      resetRefereeRoundData();
      setQrResult(null);
      setScannerEnabled(true);
      setShowScanner(true);
      setPostSubmitLoading(false);
      setCurrentStep(2);
    }, 2000);
  };

  const CriteriaDisplay = () => {
    return (
      <div className="my-6">
        <Title level={5} className="mb-3 text-center font-semibold">
          Tiêu chí đánh giá
        </Title>
        <Row gutter={[16, 16]}>
          {criteriaCompetitionRound.map((criteriaItem, index) => {
            const id =
              criteriaItem.id ||
              criteriaItem.criteria?.id ||
              `criteria-${index}`;
            const name =
              criteriaItem.criteria?.name ||
              criteriaItem.name ||
              `Tiêu chí ${index + 1}`;
            const weight = criteriaItem.weight || 0;
            const description =
              criteriaItem.criteria?.description ||
              criteriaItem.description ||
              "";

            return (
              <Col xs={24} sm={12} md={8} key={id}>
                <AntCard
                  size="small"
                  className="h-full shadow-sm hover:shadow-md transition-shadow duration-300"
                  bordered={false}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Typography.Text strong style={{ fontSize: "15px" }}>
                      {name}
                    </Typography.Text>
                    <Tag color="blue" className="font-medium">
                      <PercentageOutlined className="mr-1" />
                      {(weight * 100).toFixed(0)}%
                    </Tag>
                  </div>
                  {description && (
                    <Typography.Text
                      type="secondary"
                      className="block mt-2 text-sm"
                    >
                      {description}
                    </Typography.Text>
                  )}
                </AntCard>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === "environment" ? "user" : "environment");
  };

  return (
    <div className="bg-white space-y-6 p-3">
      <Title level={3} className="text-center mb-6 text-blue-700">
        <TrophyOutlined className="mr-2 my-3" />
        Hệ thống chấm điểm giám khảo
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
        <Step title="Quét QR" icon={<QrcodeOutlined />} />
        <Step title="Chấm điểm" icon={<PercentageOutlined />} />
      </Steps>

      <AntCard className="shadow-sm mb-6">
        <Row gutter={[16, 16]} className="mb-2">
          <Col xs={24} sm={8}>
            <div>
              <Text strong className="block text-base mb-2 text-gray-700">
                Hạng Mục:
              </Text>
              <Select
                value={categoryId}
                onChange={handleCategoryChange}
                allowClear
                style={{ width: "100%" }}
                className="rounded-md"
                loading={categoryLoading}
                placeholder="Chọn danh mục"
                size="large"
                suffixIcon={<AimOutlined />}
              >
                {categories?.map((category) => (
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
                allowClear
                style={{ width: "100%" }}
                className="rounded-md"
                loading={roundLoading}
                placeholder="Chọn vòng thi"
                size="large"
                disabled={!categoryId}
                suffixIcon={<TrophyOutlined />}
              >
                {refereeRoundTypes?.map((roundType) => (
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
                style={{ width: "100%" }}
                className="rounded-md"
                placeholder="Chọn vòng"
                size="large"
                disabled={!selectedRoundType}
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

      {selectedSubRound && (
        <div className="mt-5">
          {(selectedRoundType === "Evaluation" ||
            selectedRoundType === "Final") &&
            criteriaCompetitionRound &&
            criteriaCompetitionRound.length > 0 &&
            !showDetailScoring &&
            !qrResult && (
              <div
                className="mb-8 shadow-sm p-5"
                title={
                  <div className="flex items-center">
                    <PercentageOutlined className="mr-2" />
                    Tiêu chí đánh giá
                  </div>
                }
              >
                {criteriaLoading ? (
                  <div className="py-6 text-center">
                    <Spin tip="Đang tải tiêu chí..." />
                  </div>
                ) : (
                  <CriteriaDisplay />
                )}
              </div>
            )}

          {!showScanner && !qrResult && !scanError && (
            <div className="flex flex-col items-center mb-5">
              <div className="w-full md:w-3/4 lg:w-1/2 text-center p-3  ">
                <QrcodeOutlined
                  style={{
                    fontSize: "48px",
                    color: "#3366ff",
                    marginBottom: "16px",
                  }}
                />
                <Title level={4} className="mb-4 font-semibold text-blue-800">
                  Quét QR để chấm điểm
                </Title>
                <Paragraph className="text-gray-500 mb-6">
                  Hướng camera vào mã QR của cá Koi để bắt đầu chấm điểm
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<QrcodeOutlined />}
                  onClick={() => setShowScanner(true)}
                  className="px-8 h-12 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  Bắt đầu quét QR
                </Button>
              </div>
            </div>
          )}

          {scanError && (
            <div className="mb-8">
              <Alert
                message="Lỗi quét mã QR"
                description={scanError}
                type="error"
                showIcon
                className="mb-4 shadow-sm"
              />
              <div className="flex justify-center">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  size="large"
                  className="px-6 h-10 rounded-lg shadow-sm"
                >
                  Quét lại
                </Button>
              </div>
            </div>
          )}

          {showScanner && scannerEnabled && (
            <div className="mb-8">
              <div className="p-2">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-2xl rounded-lg mb-4 overflow-hidden shadow-lg">
                    <QrScanner
                      delay={300}
                      onError={handleError}
                      onScan={handleScan}
                      constraints={{
                        video: { facingMode: facingMode },
                      }}
                      style={{ width: "100%", height: "500px" }}
                    />
                  </div>
                  <Text className="text-center text-gray-600 italic mb-4">
                    <AimOutlined className="mr-2" />
                    Hướng camera vào mã QR để quét
                  </Text>
                  <Space>
                    <Button
                      onClick={() => setShowScanner(false)}
                      danger
                      icon={<CloseCircleOutlined />}
                      size="large"
                      className="px-6 rounded-lg"
                    >
                      Hủy quét
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          )}

          {registrationLoading && (
            <div className="flex justify-center my-8">
              <div className="text-center">
                <Loading tip="Đang tải thông tin..." />
              </div>
            </div>
          )}

          {refereeRoundData && !showDetailScoring && (
            <AntCard
              className="mx-auto overflow-hidden"
              style={{
                borderRadius: "16px",
                maxWidth: "900px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                border: "none",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div className="flex flex-col md:flex-row">
                {/* Phần hình ảnh cá */}
                <div className="w-full md:w-2/5 relative">
                  {refereeRoundData.registration?.koiMedia &&
                  refereeRoundData.registration.koiMedia.length > 0 ? (
                    <div className="h-full">
                      <div
                        className="h-[380px] md:h-full w-full relative"
                        style={{
                          backgroundImage: `url(${
                            refereeRoundData.registration.koiMedia.find(
                              (media) => media.mediaType === "Image"
                            )?.mediaUrl ||
                            "https://via.placeholder.com/300x450?text=No+Image"
                          })`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          minHeight: "450px",
                        }}
                      ></div>
                    </div>
                  ) : (
                    <div
                      className="bg-gradient-to-r from-blue-50 to-blue-100 h-[380px] md:h-full w-full flex items-center justify-center"
                      style={{ minHeight: "450px" }}
                    >
                      <div className="text-center p-8">
                        <div className="text-blue-300 text-8xl mb-6">
                          <AimOutlined />
                        </div>
                        <Text className="text-blue-500 text-lg">
                          Không có hình ảnh
                        </Text>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phần thông tin chi tiết */}
                <div className="w-full md:w-3/5 p-0">
                  <div className="flex flex-col h-full">
                    {/* Tiêu đề */}
                    <div className="bg-white p-6 border-b border-gray-100">
                      <Title
                        level={4}
                        className="m-0 text-blue-800 flex items-center"
                      >
                        <TrophyOutlined
                          className="mr-3"
                          style={{ fontSize: "24px", color: "#1890ff" }}
                        />
                        Thông tin cá Koi
                      </Title>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="flex-grow bg-white p-6">
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        {/* Mã cá Koi */}
                        <div className="info-group col-span-2">
                          <div className="bg-blue-50 rounded-lg p-3 mb-3">
                            <Text
                              type="secondary"
                              className="block text-sm mb-1"
                            >
                              Mã cá Koi
                            </Text>
                            <div className="text-blue-600 font-bold text-xl tracking-wider">
                              {refereeRoundData.registration
                                ?.registrationNumber || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="info-group">
                          <Text type="secondary" className="block text-sm mb-1">
                            Giống
                          </Text>
                          <Text strong className="text-lg">
                            {refereeRoundData.registration.koiProfile?.variety
                              ?.name || "N/A"}
                          </Text>
                        </div>

                        <div className="info-group">
                          <Text type="secondary" className="block text-sm mb-1">
                            Kích thước
                          </Text>
                          <Text strong className="text-lg">
                            {refereeRoundData.registration.koiSize
                              ? `${refereeRoundData.registration.koiSize} cm`
                              : "N/A"}
                          </Text>
                        </div>

                        <div className="info-group">
                          <Text type="secondary" className="block text-sm mb-1">
                            Giới tính
                          </Text>
                          <Text strong className="text-lg">
                            {refereeRoundData.registration?.koiProfile
                              ?.gender || "Không có"}
                          </Text>
                        </div>

                        <div className="info-group">
                          <Text type="secondary" className="block text-sm mb-1">
                            Người đăng ký
                          </Text>
                          <Text strong className="text-lg">
                            {refereeRoundData.registration?.registerName ||
                              "N/A"}
                          </Text>
                        </div>

                        <div className="info-group col-span-2">
                          <Text type="secondary" className="block text-sm mb-1">
                            Hạng mục thi đấu
                          </Text>
                          <Text strong className="text-lg">
                            {refereeRoundData.registration?.competitionCategory
                              ?.name || "N/A"}
                          </Text>
                        </div>

                        {refereeRoundData.registration?.description && (
                          <div className="info-group col-span-2">
                            <Text
                              type="secondary"
                              className="block text-sm mb-1"
                            >
                              Mô tả
                            </Text>
                            <Paragraph
                              ellipsis={{
                                rows: 2,
                                expandable: true,
                                symbol: "Xem thêm",
                              }}
                              className="text-base"
                            >
                              {refereeRoundData.registration?.description}
                            </Paragraph>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phần nút đánh giá */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100">
                      {postSubmitLoading ? (
                        <div className="text-center py-3">
                          <Spin tip="Đang lưu kết quả..." />
                          <div className="mt-3 text-blue-500 font-medium">
                            <CheckCircleOutlined className="mr-2" />
                            Đã chấm điểm thành công!
                          </div>
                        </div>
                      ) : selectedRoundType === "Preliminary" ? (
                        <div className="flex justify-center gap-5">
                          <Button
                            type="primary"
                            size="large"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleScore(true)}
                            loading={isScoring}
                            style={{
                              backgroundColor: "#52c41a",
                              borderColor: "#52c41a",
                              height: "48px",
                              borderRadius: "8px",
                              fontWeight: "bold",
                              width: "150px",
                              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.2)",
                            }}
                          >
                            Đạt
                          </Button>
                          <Button
                            danger
                            size="large"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleScore(false)}
                            loading={isScoring}
                            style={{
                              height: "48px",
                              borderRadius: "8px",
                              fontWeight: "bold",
                              width: "150px",
                              boxShadow: "0 4px 12px rgba(245, 34, 45, 0.1)",
                            }}
                          >
                            Không Đạt
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <Button
                            type="primary"
                            size="large"
                            icon={<PercentageOutlined />}
                            onClick={() => handleScore(true)}
                            loading={isScoring}
                            style={{
                              height: "48px",
                              borderRadius: "8px",
                              fontWeight: "bold",
                              width: "100%",
                              maxWidth: "350px",
                              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.2)",
                            }}
                          >
                            Chấm điểm chi tiết
                          </Button>
                        </div>
                      )}

                      {!postSubmitLoading && (
                        <div className="text-center mt-4">
                          <Button
                            type="link"
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                          >
                            Quét lại
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </AntCard>
          )}
        </div>
      )}

      {showDetailScoring && refereeRoundData && (
        <div className="mt-8">
          {postSubmitLoading ? (
            <div className="text-center py-8">
              <AntCard className="shadow-md p-8 rounded-xl">
                <Spin tip="Đang lưu kết quả chấm điểm..." size="large" />
                <div className="mt-4 text-blue-500 font-medium">
                  <CheckCircleOutlined className="mr-2" />
                  Đã chấm điểm thành công!
                </div>
              </AntCard>
            </div>
          ) : (
            <>
              <AntCard className="shadow-lg rounded-xl mb-4 border-0">
                <EvaluationScoreSheet
                  criteriaList={criteriaCompetitionRound}
                  registrationId={qrResult}
                  registrationRoundId={refereeRoundData.id}
                  refereeAccountId={refereeAccountId}
                  onScoreSubmitted={handleDetailScoreSubmitted}
                />
              </AntCard>
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => setShowDetailScoring(false)}
                  size="large"
                  className="px-6 rounded-lg"
                  icon={<ReloadOutlined />}
                >
                  Quay lại
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx="true" global>{`
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
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          /* Styles específicos para iPad */
          .news-card-image-container {
            height: 180px !important;
          }

          .custom-steps .ant-steps-item-title {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

export default ScanQrByReferee;
