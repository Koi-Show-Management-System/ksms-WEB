import React, { useState, useEffect } from "react";
import { Select, Row, Col, QRCode, Statistic } from "antd";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";
import useRegistrationRound from "../../../hooks/useRegistrationRound";
import useScore from "../../../hooks/useScore";
import QrScanner from "react-qr-scanner";
import {
  Button,
  Typography,
  Spin,
  Alert,
  Card,
  Tag,
  Space,
  notification,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;

function ScanQrByReferee({ showId, refereeId }) {
  const [categoryId, setCategoryId] = useState(null);
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const [subRounds, setSubRounds] = useState([]);
  const [qrResult, setQrResult] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [scanError, setScanError] = useState(null);

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

  // Fetch categories when component mounts
  useEffect(() => {
    if (showId) {
      fetchCategories(showId);
    }
  }, [showId, fetchCategories]);

  // When category changes, fetch round types for referee
  useEffect(() => {
    if (categoryId) {
      fetchRoundByReferee(categoryId);
      setSelectedRoundType(null);
      setSubRounds([]);
      setSelectedSubRound(null);
    }
  }, [categoryId, fetchRoundByReferee]);

  // When round type is selected, fetch sub-rounds
  useEffect(() => {
    if (categoryId && selectedRoundType) {
      fetchRound(categoryId, selectedRoundType);
      setSelectedSubRound(null);
    }
  }, [categoryId, selectedRoundType, fetchRound]);

  // Process sub-rounds from the fetched data
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
          // Handle successful scan
          console.log("Scan successful:", result.data);
        } else {
          // Check for 404 status code
          if (result.statusCode === 404 || (typeof result.error === 'object' && result.error.statusCode === 404)) {
            setScanError("Mã QR không hợp lệ hoặc không tìm thấy. Vui lòng kiểm tra và thử lại.");
          } else {
            // For other errors
            const errorMessage = typeof result.error === 'object' 
              ? (result.error.message || JSON.stringify(result.error)) 
              : (result.error || "Không thể quét mã QR này. Vui lòng thử lại.");
            setScanError(errorMessage);
          }
          setScannerEnabled(false);
          setShowScanner(false);
        }
      } catch (error) {
        console.error("Error scanning QR code:", error);
        // Check for 404 status code in caught error
        if (error.statusCode === 404) {
          setScanError("Mã QR không hợp lệ hoặc không tìm thấy. Vui lòng kiểm tra và thử lại.");
        } else {
          // For other errors
          const errorMessage = typeof error === 'object' 
            ? (error.message || JSON.stringify(error)) 
            : (error || "Đã xảy ra lỗi khi quét mã QR. Vui lòng thử lại.");
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
    // Clear dependent fields when category is cleared or changed
    setSelectedRoundType(null);
    setSelectedSubRound(null);
    setSubRounds([]);
  };

  const handleRoundTypeChange = (value) => {
    setSelectedRoundType(value);
    // Clear dependent fields when round type is cleared or changed
    setSelectedSubRound(null);
    setSubRounds([]);
  };

  const handleScore = async (isPass) => {
    try {
      setIsScoring(true);
      const registrationId = qrResult;
      const registrationRoundId = refereeRoundData?.id;

      if (
        !registrationId ||
        !selectedSubRound ||
        !refereeId ||
        !registrationRoundId
      ) {
        console.error("Lỗi: Thiếu thông tin cần thiết để chấm điểm");
        return {
          success: false,
          error: "Thiếu thông tin cần thiết để chấm điểm",
        };
      }

      const result = await createScore(refereeId, registrationRoundId, isPass);

      console.log("API Response in handleScore:", result);

      if (result?.success) {
        setTimeout(() => {
          resetRefereeRoundData();
          setQrResult(null);
          setScannerEnabled(true);
          setShowScanner(true);
        }, 2000);
      }

      return result; // Trả về kết quả để xử lý ở nơi gọi hàm này nếu cần
    } catch (error) {
      console.log("Error caught in handleScore:", error);
      return { success: false, error: error?.message || "Lỗi không xác định" };
    } finally {
      setIsScoring(false);
    }
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
                onChange={(value) => setSelectedSubRound(value)}
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
        <div className="mt-8 text-center">
          <Title level={4} className="mb-6">
            <span>Quét QR để chấm điểm</span>
          </Title>

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

          {refereeRoundData && (
            <Card className="mt-8 mx-auto max-w-lg shadow-md">
              <div className="text-center mb-4">
                <Title level={4}>Thông tin cá</Title>
              </div>

              {refereeRoundData.registration && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Text type="secondary">Mã đăng ký:</Text>
                    <div className="font-semibold">
                      {refereeRoundData.registration.registrationNumber ||
                        (qrResult ? qrResult.substring(0, 8) : "N/A")}
                    </div>
                  </div>
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
                    <Text type="secondary">Giới tính</Text>
                    <div className="font-semibold">
                      {refereeRoundData.registration?.koiProfile?.gender ||
                        "Không có"}
                    </div>
                  </div>
                </div>
              )}

              {refereeRoundData.registration?.koiMedia &&
                refereeRoundData.registration.koiMedia.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-center mb-2">
                      {refereeRoundData.registration.koiMedia
                        .filter((media) => media.mediaType === "Image")
                        .slice(0, 1)
                        .map((media, index) => (
                          <img
                            key={index}
                            src={media.mediaUrl}
                            alt="Hình ảnh cá"
                            className="w-full max-w-md rounded-lg shadow-sm"
                          />
                        ))}
                    </div>
                  </div>
                )}

              <div className="flex justify-center gap-6 mt-6">
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
                  }}
                >
                  FAIL
                </Button>
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  style={{
                    height: "52px",
                    padding: "0 24px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  Quét lại
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default ScanQrByReferee;
