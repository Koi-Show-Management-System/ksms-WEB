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
          errorMessage = error.message || JSON.stringify(error);
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

  return (
    <div className="bg-white space-y-6">
      <Title level={3} className="text-center mb-6 text-blue-700">
        <TrophyOutlined className="mr-2" />
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
                placeholder="Chọn vòng nhỏ"
                size="large"
                disabled={!selectedRoundType}
                suffixIcon={<TrophyOutlined />}
              >
                {subRounds.map((subRound) => (
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
              <div className=" ">
                <div className="flex flex-col items-center p-4">
                  <div className="w-full max-w-md rounded-lg mb-4 overflow-hidden">
                    <QrScanner
                      delay={300}
                      onError={handleError}
                      onScan={handleScan}
                      constraints={{
                        video: { facingMode: "environment" },
                      }}
                      style={{ width: "150%", height: "300px" }}
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
              className="shadow-sm mx-auto"
              variant="borderless"
              style={{ borderRadius: "12px", maxWidth: "700px" }}
            >
              <Title level={5} className="mb-3 pb-5 border-b border-gray-200">
                Thông tin cá
              </Title>
              <div className="mb-2">
                <Text strong>
                  Mã:{" "}
                  <span className="text-blue-600">
                    {refereeRoundData.registration?.registrationNumber || "-"}
                  </span>
                </Text>
              </div>

              {refereeRoundData.registration?.koiMedia &&
                refereeRoundData.registration.koiMedia.length > 0 && (
                  <div className="mb-4">
                    {refereeRoundData.registration.koiMedia
                      .filter((media) => media.mediaType === "Image")
                      .slice(0, 1)
                      .map((media, index) => (
                        <div key={index} className="relative w-full">
                          <img
                            src={media.mediaUrl}
                            alt="Hình ảnh cá"
                            className="w-full h-[220px] object-cover rounded-md"
                          />
                        </div>
                      ))}
                  </div>
                )}

              {refereeRoundData.registration && (
                <div>
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                      <div>
                        <Text type="secondary">Giống:</Text>
                        <div className="font-medium">
                          {refereeRoundData.registration.koiProfile?.variety
                            ?.name || "N/A"}
                        </div>
                      </div>

                      <div>
                        <Text type="secondary">Kích thước:</Text>
                        <div className="font-medium">
                          {refereeRoundData.registration.koiSize
                            ? `${refereeRoundData.registration.koiSize} cm`
                            : "N/A"}
                        </div>
                      </div>

                      <div>
                        <Text type="secondary">Giới tính:</Text>
                        <div className="font-medium">
                          {refereeRoundData.registration?.koiProfile?.gender ||
                            "Không có"}
                        </div>
                      </div>

                      <div>
                        <Text type="secondary">Người đăng ký:</Text>
                        <div className="font-medium">
                          {refereeRoundData.registration?.registerName || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    {postSubmitLoading ? (
                      <div className="w-full text-center py-3">
                        <Spin tip="Đang lưu kết quả chấm điểm..." />
                        <div className="mt-2 text-blue-500 font-medium">
                          Đã chấm điểm thành công!
                        </div>
                      </div>
                    ) : selectedRoundType === "Preliminary" ? (
                      <div className="flex justify-center gap-4">
                        <Button
                          type="primary"
                          size="middle"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleScore(true)}
                          loading={isScoring}
                          style={{
                            backgroundColor: "#52c41a",
                            color: "white",
                            borderColor: "#52c41a",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          Đạt
                        </Button>
                        <Button
                          danger
                          size="middle"
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleScore(false)}
                          loading={isScoring}
                          style={{
                            borderRadius: "8px",
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          Không Đạt
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="primary"
                        block
                        icon={<PercentageOutlined />}
                        onClick={() => handleScore(true)}
                        loading={isScoring}
                        style={{
                          borderRadius: "8px",
                          fontWeight: "bold",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        Chấm điểm chi tiết
                      </Button>
                    )}
                  </div>

                  {!postSubmitLoading && (
                    <div className="text-center mt-3">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                        size="small"
                        style={{
                          borderRadius: "8px",
                        }}
                      >
                        Quét lại
                      </Button>
                    </div>
                  )}
                </div>
              )}
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

      <style jsx global>{`
        .custom-steps .ant-steps-item-icon {
          background: #f0f7ff;
          border-color: #1890ff;
        }
        .custom-steps .ant-steps-item-active .ant-steps-item-icon {
          background: #1890ff;
        }
      `}</style>
    </div>
  );
}

export default ScanQrByReferee;
