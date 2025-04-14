import React, { useState, useEffect } from "react";
import { Select, Row, Col, QRCode, Statistic, Card as AntCard } from "antd";
import useCategory from "../../hooks/useCategory";
import useRound from "../../hooks/useRound";
import useRegistrationRound from "../../hooks/useRegistrationRound";
import useScore from "../../hooks/useScore";
import useCriteria from "../../hooks/useCriteria";
import QrScanner from "react-qr-scanner";
import {
  Button,
  Typography,
  Spin,
  Alert,
  Tag,
  Space,
  notification,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  PercentageOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import EvaluationScoreSheet from "./EvaluationScoreSheet";

const { Option } = Select;
const { Title, Text } = Typography;

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
    }
  }, [categoryId, fetchRoundByReferee]);

  useEffect(() => {
    if (categoryId && selectedRoundType) {
      fetchRound(categoryId, selectedRoundType);
      setSelectedSubRound(null);
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
    } else if (
      selectedRoundType !== "Evaluation" &&
      selectedRoundType !== "Final"
    ) {
      resetCriteriaCompetitionRound();
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
  };

  const handleSubRoundChange = (value) => {
    setSelectedSubRound(value);
    resetRefereeRoundData();
    setQrResult(null);
    setScannerEnabled(true);
    setShowScanner(false);
    setScanError(null);
    setShowDetailScoring(false);
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
    }, 2000);
  };

  const CriteriaDisplay = () => {
    return (
      <div className="mb-6 mt-4">
        <Title level={5} className="mb-3">
          Tiêu chí đánh giá
        </Title>
        <Row gutter={[16, 8]}>
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
                <AntCard size="small" className="h-full">
                  <div className="flex items-center justify-between">
                    <Typography.Text strong>{name}</Typography.Text>
                    <Tag color="blue">{(weight * 100).toFixed(0)}%</Tag>
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
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <div className="mb-4">
            <span className="block text-lg font-medium mb-2 flex items-center">
              <QrcodeOutlined
                style={{ marginRight: "8px", color: "#1890ff" }}
              />
              Hạng Mục:
            </span>
            <Select
              value={categoryId}
              onChange={handleCategoryChange}
              allowClear
              style={{ width: "100%" }}
              className="border rounded-md p-1"
              loading={categoryLoading}
              placeholder="Chọn danh mục"
              size="large"
            >
              {categories?.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        {categoryId && (
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <span className="block text-lg font-medium mb-2 flex items-center">
                <ReloadOutlined
                  style={{ marginRight: "8px", color: "#1890ff" }}
                />
                Loại Vòng
              </span>
              <Select
                value={selectedRoundType}
                onChange={handleRoundTypeChange}
                allowClear
                style={{ width: "100%" }}
                className="border rounded-md p-1"
                loading={roundLoading}
                placeholder="Chọn vòng thi"
                size="large"
              >
                {refereeRoundTypes?.map((roundType) => (
                  <Option key={roundType} value={roundType}>
                    {roundTypeLabels[roundType] || roundType}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        )}

        {selectedRoundType && (
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <span className="block text-lg font-medium mb-2 flex items-center">
                <PercentageOutlined
                  style={{ marginRight: "8px", color: "#1890ff" }}
                />
                Vòng:
              </span>
              <Select
                value={selectedSubRound}
                onChange={handleSubRoundChange}
                style={{ width: "100%" }}
                className="border rounded-md p-1"
                placeholder="Chọn vòng nhỏ"
                size="large"
              >
                {subRounds.map((subRound) => (
                  <Option key={subRound.id} value={subRound.id}>
                    {subRound.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        )}
      </Row>

      {selectedSubRound && (
        <div className="mt-8">
          <div className="text-center mb-6">
            <Title level={4} className="mb-2">
              Quét QR để chấm điểm
            </Title>
            <Tag color="blue" style={{ padding: "3px 8px" }}>
              {roundTypeLabels[selectedRoundType] || selectedRoundType} -{" "}
              {subRounds.find((r) => r.id === selectedSubRound)?.name ||
                "Vòng thi"}
            </Tag>
          </div>

          {!showScanner && !qrResult && !scanError && (
            <div className="flex justify-center mb-6">
              <Button
                type="primary"
                onClick={() => setShowScanner(true)}
                style={{
                  height: "40px",
                  padding: "0 24px",
                  fontSize: "16px",
                  borderRadius: "4px",
                }}
              >
                Bắt đầu quét QR
              </Button>
            </div>
          )}

          {scanError && (
            <div className="mb-6">
              <Alert
                message="Lỗi quét mã QR"
                description="Không thể quét mã QR. Vui lòng thử lại."
                type="error"
                showIcon
                className="mb-4"
                style={{ maxWidth: "500px", margin: "0 auto" }}
              />
              <div className="text-center">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  Quét lại
                </Button>
              </div>
            </div>
          )}

          {showScanner && scannerEnabled && (
            <div className="mb-6 shadow-md" style={{ borderRadius: "12px" }}>
              <div className="scanner-container flex flex-col items-center">
                <div className="border-3 p-2 rounded-lg mb-4">
                  <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    constraints={{
                      video: { facingMode: "environment" },
                    }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <Text className="text-center text-gray-600 italic mb-2">
                  Hướng camera vào mã QR để quét
                </Text>
                <Button
                  onClick={() => setShowScanner(false)}
                  className="mb-4"
                  danger
                >
                  Hủy quét
                </Button>
              </div>
            </div>
          )}

          {refereeRoundData && !showDetailScoring && (
            <AntCard
              className="shadow-lg"
              variant="borderless"
              style={{ borderRadius: "12px" }}
            >
              <Title level={4} className="mb-6 pb-2 border-b border-gray-200">
                <span>Thông tin cá</span>
              </Title>
              <div className="mb-3">
                <Text strong className="text-lg block mb-2">
                  Mã:{" "}
                  <span className="text-blue-600">
                    {refereeRoundData.registration?.registrationNumber || "-"}
                  </span>
                </Text>
              </div>

              {refereeRoundData.registration?.koiMedia &&
                refereeRoundData.registration.koiMedia.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-4">
                      {refereeRoundData.registration.koiMedia
                        .filter((media) => media.mediaType === "Image")
                        .slice(0, 1)
                        .map((media, index) => (
                          <div key={index} className="relative w-full">
                            <img
                              src={media.mediaUrl}
                              alt="Hình ảnh cá"
                              className="w-full max-h-[280px] object-cover rounded-lg shadow-md"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {refereeRoundData.registration && (
                <div>
                  <AntCard className="bg-gray-50 border-0 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Text type="secondary">Giống:</Text>
                        <div className="font-semibold">
                          {refereeRoundData.registration.koiProfile?.variety
                            ?.name || "N/A"}
                        </div>
                      </div>

                      <div>
                        <Text type="secondary">Kích thước:</Text>
                        <div className="font-semibold">
                          {refereeRoundData.registration.koiSize
                            ? `${refereeRoundData.registration.koiSize} cm`
                            : "N/A"}
                        </div>
                      </div>

                      <div>
                        <Text type="secondary">Giới tính:</Text>
                        <div className="font-semibold">
                          {refereeRoundData.registration?.koiProfile?.gender ||
                            "Không có"}
                        </div>
                      </div>

                      <div>
                        <Text type="secondary">Người đăng ký:</Text>
                        <div className="font-semibold">
                          {refereeRoundData.registration?.registerName || "N/A"}
                        </div>
                      </div>
                    </div>
                  </AntCard>

                  <div className="flex justify-center gap-6 mt-8">
                    {postSubmitLoading ? (
                      <div className="w-full text-center py-4">
                        <Spin
                          tip="Đang lưu kết quả chấm điểm..."
                          size="large"
                        />
                        <div className="mt-3 text-blue-500 font-medium">
                          Đã chấm điểm thành công!
                        </div>
                      </div>
                    ) : selectedRoundType === "Preliminary" ? (
                      <>
                        <Button
                          type="primary"
                          size="large"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleScore(true)}
                          loading={isScoring}
                          style={{
                            backgroundColor: "#52c41a",
                            color: "white",
                            borderColor: "#52c41a",
                            height: "52px",
                            padding: "0 24px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
                            height: "52px",
                            padding: "0 24px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          Không Đạt
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="primary"
                        size="large"
                        icon={<PercentageOutlined />}
                        onClick={() => handleScore(true)}
                        loading={isScoring}
                        style={{
                          height: "52px",
                          width: "100%",
                          padding: "0 24px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        Chấm điểm chi tiết
                      </Button>
                    )}
                  </div>

                  {!postSubmitLoading && (
                    <div className="text-center mt-4">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                        style={{
                          height: "40px",
                          padding: "0 24px",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
        <div className="mt-8 max-w-6xl mx-auto">
          {postSubmitLoading ? (
            <div className="text-center py-8">
              <Spin tip="Đang lưu kết quả chấm điểm..." size="large" />
              <div className="mt-3 text-blue-500 font-medium">
                Đã chấm điểm thành công!
              </div>
            </div>
          ) : (
            <>
              <AntCard
                className="shadow-md mb-6"
                title={
                  <Title level={4} className="mb-0">
                    Chấm Điểm Chi Tiết
                  </Title>
                }
              >
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div>
                    <Text strong>Mã:</Text>{" "}
                    {refereeRoundData.registration?.registrationNumber}
                  </div>
                  <div>
                    <Text strong>Giống:</Text>{" "}
                    {refereeRoundData.registration.koiProfile?.variety?.name ||
                      "N/A"}
                  </div>
                </div>

                <EvaluationScoreSheet
                  criteriaList={criteriaCompetitionRound}
                  registrationId={qrResult}
                  registrationRoundId={refereeRoundData.id}
                  refereeAccountId={refereeAccountId}
                  onScoreSubmitted={handleDetailScoreSubmitted}
                />
                <div className="mt-4 flex justify-center">
                  <Button onClick={() => setShowDetailScoring(false)}>
                    Quay lại
                  </Button>
                </div>
              </AntCard>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ScanQrByReferee;
