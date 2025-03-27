import React, { useState, useEffect } from "react";
import { Select, Row, Col, QRCode, Statistic, Card as AntCard } from "antd";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";
import useRegistrationRound from "../../../hooks/useRegistrationRound";
import useScore from "../../../hooks/useScore";
import useCriteria from "../../../hooks/useCriteria";
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
          if (
            result.statusCode === 404 ||
            (typeof result.error === "object" &&
              result.error.statusCode === 404)
          ) {
            setScanError(
              "Mã QR không hợp lệ hoặc không tìm thấy. Vui lòng kiểm tra và thử lại."
            );
          } else {
            const errorMessage =
              typeof result.error === "object"
                ? result.error.message || JSON.stringify(result.error)
                : result.error || "Không thể quét mã QR này. Vui lòng thử lại.";
            setScanError(errorMessage);
          }
          setScannerEnabled(false);
          setShowScanner(false);
        }
      } catch (error) {
        console.error("Error scanning QR code:", error);
        if (error.statusCode === 404) {
          setScanError(
            "Mã QR không hợp lệ hoặc không tìm thấy. Vui lòng kiểm tra và thử lại."
          );
        } else {
          const errorMessage =
            typeof error === "object"
              ? error.message || JSON.stringify(error)
              : error || "Đã xảy ra lỗi khi quét mã QR. Vui lòng thử lại.";
          setScanError(errorMessage);
        }
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
            <span className="block text-lg font-medium">Hạng Mục:</span>
            <Select
              value={categoryId}
              onChange={handleCategoryChange}
              allowClear
              style={{ width: "100%" }}
              className="border rounded-md"
              loading={categoryLoading}
              placeholder="Chọn danh mục"
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
              <span className="block text-lg font-medium">Vòng Chính:</span>
              <Select
                value={selectedRoundType}
                onChange={handleRoundTypeChange}
                allowClear
                style={{ width: "100%" }}
                className="border rounded-md"
                loading={roundLoading}
                placeholder="Chọn vòng thi"
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
              <span className="block text-lg font-medium">Vòng Phụ:</span>
              <Select
                value={selectedSubRound}
                onChange={handleSubRoundChange}
                style={{ width: "100%" }}
                className="border rounded-md"
                placeholder="Chọn vòng nhỏ"
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
        <div className="mt-8 ">
          <Title level={4} className="mb-6 text-center">
            <span>Quét QR để chấm điểm</span>
          </Title>

          {/* {(selectedRoundType === "Evaluation" ||
            selectedRoundType === "Final") && (
            <>
              {criteriaLoading ? (
                <div className="mb-4">
                  <Spin tip="Đang tải tiêu chí..." />
                </div>
              ) : criteriaCompetitionRound &&
                criteriaCompetitionRound.length > 0 ? (
                <CriteriaDisplay />
              ) : (
                <Alert
                  className="mb-4"
                  message="Không có tiêu chí"
                  description="Không có tiêu chí nào được thiết lập cho vòng này."
                  type="info"
                  showIcon
                />
              )}
            </>
          )} */}

          {!showScanner && !qrResult && !scanError && (
            <div className="flex justify-center mb-6">
              <Button type="primary" onClick={() => setShowScanner(true)}>
                Bắt đầu quét QR
              </Button>
            </div>
          )}

          {scanError && (
            <div className="mb-6">
              <Alert
                message="Lỗi quét mã QR"
                description={scanError}
                type="error"
                showIcon
                className="mb-4"
              />
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Quét lại
              </Button>
            </div>
          )}

          {showScanner && scannerEnabled && (
            <div className="mb-6 ">
              <div className=" flex flex-col items-center">
                <div className=" rounded-lg mb-4">
                  <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    constraints={{
                      video: { facingMode: "environment" },
                    }}
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

          {registrationLoading && (
            <div className="flex justify-center my-8">
              <div className="text-center">
                <Spin size="large" tip="Đang tải thông tin..." />
              </div>
            </div>
          )}

          {refereeRoundData && !showDetailScoring && (
            <AntCard className="mt-8 mx-auto max-w-lg shadow-lg rounded-xl overflow-hidden">
              <div className=" p-4 mb-4">
                <Title level={4} className=" m-0">
                  Thông tin cá
                </Title>
                <div className="">
                  Mã:{" "}
                  {refereeRoundData.registration?.registrationNumber ||
                    qrResult?.substring(0, 8)}
                </div>
              </div>

              {refereeRoundData.registration?.koiMedia &&
                refereeRoundData.registration.koiMedia.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-center mb-2">
                      {refereeRoundData.registration.koiMedia
                        .filter((media) => media.mediaType === "Image")
                        .slice(0, 1)
                        .map((media, index) => (
                          <div key={index} className="relative w-full">
                            <img
                              src={media.mediaUrl}
                              alt="Hình ảnh cá"
                              className="w-full max-h-[280px] object-cover rounded-lg"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {refereeRoundData.registration && (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-[5rem]">
                    <div className="flex flex-col">
                      <Text type="secondary" className="text-sm">
                        Giống
                      </Text>
                      <Text strong className="text-lg">
                        {refereeRoundData.registration.koiProfile?.variety
                          ?.name || "N/A"}
                      </Text>
                    </div>

                    <div className="flex flex-col">
                      <Text type="secondary" className="text-sm">
                        Kích thước
                      </Text>
                      <Text strong className="text-lg">
                        {refereeRoundData.registration.koiSize
                          ? `${refereeRoundData.registration.koiSize} cm`
                          : "N/A"}
                      </Text>
                    </div>

                    <div className="flex flex-col">
                      <Text type="secondary" className="text-sm">
                        Giới tính
                      </Text>
                      <Text strong className="text-lg">
                        {refereeRoundData.registration?.koiProfile?.gender ||
                          "Không có"}
                      </Text>
                    </div>

                    <div className="flex flex-col">
                      <Text type="secondary" className="text-sm">
                        Người đăng ký
                      </Text>
                      <Text strong className="text-lg">
                        {refereeRoundData.registration?.registerName || "N/A"}
                      </Text>
                    </div>
                  </div>

                  <div className="flex justify-between gap-6 mt-8">
                    {postSubmitLoading ? (
                      <div className="w-full text-center py-4">
                        <Spin
                          tip="Đang lưu kết quả chấm điểm..."
                          size="large"
                        />
                        <div className="mt-3 text-green-600 font-medium">
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
                            height: "52px",
                            padding: "0 24px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            width: "100%",
                          }}
                        >
                          PASS
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
                            width: "100%",
                          }}
                        >
                          FAIL
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
                    <Button
                      className="mt-4 w-full"
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                    >
                      Quét lại
                    </Button>
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
              <Spin tip="Đang lưu kết quả chấm điểm..." size="large" />
              <div className="mt-3 text-green-600 font-medium">
                Đã chấm điểm thành công!
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ScanQrByReferee;
