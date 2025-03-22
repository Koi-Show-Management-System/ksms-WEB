import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button, notification, Modal, Select, Spin, Empty } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import useRegistration from "../../../hooks/useRegistration";
import useRound from "../../../hooks/useRound";
import axiosClient from "../../../config/axiosClient";

const { Option } = Select;

const roundTypeLabels = {
  Preliminary: "Vòng Sơ Khảo",
  Evaluation: "Vòng Đánh Giá Chính",
  Final: "Vòng Chung Kết",
};

function NextRound({
  registrationRound,
  selectedSubRound,
  selectedCategory,
  selectedRoundType,
  roundTypes,
  fetchRegistrationRound,
  currentPage,
  pageSize,
}) {
  const { assignToRound } = useRegistration();
  const [isMovingToNextRound, setIsMovingToNextRound] = useState(false);
  const [hasMovedToNextRound, setHasMovedToNextRound] = useState(false);
  const prevSelectedSubRoundRef = useRef(null);

  // State for the modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [nextRoundType, setNextRoundType] = useState(null);
  const [availableSubRounds, setAvailableSubRounds] = useState([]);
  const [selectedNextRound, setSelectedNextRound] = useState("");
  const [isLoadingSubRounds, setIsLoadingSubRounds] = useState(false);
  const { round, fetchRound, isLoading: roundLoading } = useRound();

  // Keep track of rounds we've already moved fish from - persist across renders
  const processedRoundsRef = useRef(new Set());

  // Kiểm tra trạng thái đánh giá của cá - sử dụng useMemo để tránh tính toán lại
  const { allRegistrationsEvaluated, hasPassingRegistrations } = useMemo(() => {
    // Kiểm tra xem tất cả cá đã được đánh giá chưa
    const allEvaluated = 
      Array.isArray(registrationRound) &&
      registrationRound.length > 0 &&
      registrationRound.every(
        (item) => item.roundResults && item.roundResults.length > 0
      );

    // Kiểm tra xem có cá nào đạt yêu cầu để chuyển sang vòng tiếp theo không
    const hasPassing = 
      allEvaluated &&
      registrationRound.some(
        (item) =>
          item.roundResults &&
          item.roundResults.length > 0 &&
          item.roundResults[0]?.status === "Pass"
      );
      
    return { allRegistrationsEvaluated: allEvaluated, hasPassingRegistrations: hasPassing };
  }, [registrationRound]);

  // Thêm một localStorage check để lưu trữ thông tin về các vòng đã xử lý
  useEffect(() => {
    // Khi component mount, kiểm tra localStorage
    const processedRoundsFromStorage = localStorage.getItem('processedRounds');
    if (processedRoundsFromStorage) {
      try {
        const processedSet = new Set(JSON.parse(processedRoundsFromStorage));
        processedRoundsRef.current = processedSet;
      } catch (e) {
        console.error("Error parsing processed rounds from storage:", e);
      }
    }
  }, []);

  // Theo dõi thay đổi của selectedSubRound để cập nhật trạng thái
  useEffect(() => {
    if (selectedSubRound !== prevSelectedSubRoundRef.current) {
      prevSelectedSubRoundRef.current = selectedSubRound;
      
      // Đặt lại hasMovedToNextRound khi vòng thay đổi
      if (
        selectedSubRound && 
        processedRoundsRef.current.has(selectedSubRound)
      ) {
        setHasMovedToNextRound(true);
      } else {
        setHasMovedToNextRound(false);
      }
    }
  }, [selectedSubRound]);

  // Kiểm tra điều kiện hiển thị nút
  const shouldShowButton = useMemo(() => {
    // Không hiển thị nếu không có vòng được chọn
    if (!selectedSubRound) return false;
    
    // Kiểm tra trực tiếp trong processedRoundsRef - Điều kiện quan trọng nhất
    if (processedRoundsRef.current.has(selectedSubRound)) return false;
    
    // Kiểm tra nếu đã di chuyển sang vòng tiếp theo
    if (hasMovedToNextRound) return false;
    
    // Không hiển thị nếu chưa đánh giá hết
    if (!allRegistrationsEvaluated) return false;
    
    // Không hiển thị nếu không có cá nào đạt yêu cầu
    if (!hasPassingRegistrations) return false;
    
    // Nếu qua hết các điều kiện trên, hiển thị nút
    return true;
  }, [
    selectedSubRound, 
    hasMovedToNextRound, 
    allRegistrationsEvaluated, 
    hasPassingRegistrations
  ]);

  // Find current round details from the round array
  const currentRoundDetails =
    selectedSubRound && Array.isArray(round)
      ? round.find(
          (r) => r.id === selectedSubRound || r.roundId === selectedSubRound
        )
      : null;

  // Xác định vòng tiếp theo mặc định khi mở modal
  const getDefaultNextRoundType = useCallback(() => {
    if (!selectedRoundType || !roundTypes) return null;
    
    const currentIndex = roundTypes.findIndex(type => type === selectedRoundType);
    if (currentIndex >= 0 && currentIndex < roundTypes.length - 1) {
      return roundTypes[currentIndex + 1];
    }
    return null;
  }, [selectedRoundType, roundTypes]);

  // Show modal for next round selection với trạng thái cập nhật
  const showNextRoundModal = useCallback(() => {
    setNextRoundType(null);
    setSelectedNextRound("");
    setAvailableSubRounds([]);
    setIsModalVisible(true);
  }, []);

  // Tách riêng hàm lấy vòng phụ
  const fetchSubRounds = useCallback(async (roundType) => {
    if (!selectedCategory || !roundType) return;
    
    try {
      setIsLoadingSubRounds(true);
      setAvailableSubRounds([]);
      setSelectedNextRound("");
      
      try {
        const response = await axiosClient.get('/rounds', {
          params: {
            competitionCategoryId: selectedCategory,
            roundType: roundType,
            page: 1,
            pageSize: 100
          }
        });
        
        if (response?.data?.success) {
          const rounds = response.data.data.items || [];
          
          if (rounds.length > 0) {
            const sortedRounds = [...rounds].sort((a, b) => 
              (a.roundOrder || 1) - (b.roundOrder || 1)
            );
            
            setAvailableSubRounds(sortedRounds);
          } else {
            notification.info({
              message: "Thông báo",
              description: `Không tìm thấy vòng phụ nào trong ${roundTypeLabels[roundType] || roundType}. Vui lòng tạo vòng phụ trước.`,
            });
          }
        } else {
          throw new Error("Dữ liệu không hợp lệ");
        }
      } catch (error) {
        console.error("Error fetching sub-rounds:", error);
        
        // Phương án dự phòng sử dụng hook
        await fetchRound(selectedCategory, roundType);
        
        if (Array.isArray(round) && round.length > 0) {
          const validRounds = round.filter(r => r.roundType === roundType);
          if (validRounds.length > 0) {
            const sortedRounds = [...validRounds].sort((a, b) => 
              (a.roundOrder || 1) - (b.roundOrder || 1)
            );
            
            setAvailableSubRounds(sortedRounds);
          } else {
            notification.warning({
              message: "Thông báo", 
              description: "Không tìm thấy vòng phụ cho vòng đã chọn."
            });
          }
        } else {
          notification.error({
            message: "Lỗi",
            description: `Không thể tải danh sách vòng phụ: ${error.message}`,
          });
        }
      }
    } catch (error) {
      console.error("Error in fetchSubRounds:", error);
    } finally {
      setIsLoadingSubRounds(false);
    }
  }, [selectedCategory, fetchRound, round]);
  
  // Handle round type change
  const handleNextRoundTypeChange = useCallback((value) => {
    setNextRoundType(value);
    if (value) {
      fetchSubRounds(value);
    } else {
      setAvailableSubRounds([]);
      setSelectedNextRound("");
    }
  }, [fetchSubRounds]);

  // Handle confirmation of moving to next round
  const handleConfirmMove = useCallback(async () => {
    if (!selectedNextRound || selectedNextRound === "no-rounds") {
      notification.warning({
        message: "Thông báo",
        description: "Vui lòng chọn vòng tiếp theo.",
      });
      return;
    }

    try {
      setIsMovingToNextRound(true);

      // Get all passing registration IDs
      const passingRegistrationIds = registrationRound
        .filter(
          (item) =>
            item.roundResults &&
            item.roundResults.length > 0 &&
            item.roundResults[0]?.status === "Pass"
        )
        .map((item) => item.registration?.id);

      if (passingRegistrationIds.length === 0) {
        notification.warning({
          message: "Thông báo",
          description:
            "Không có cá nào đạt yêu cầu để chuyển sang vòng tiếp theo.",
        });
        setIsMovingToNextRound(false);
        setIsModalVisible(false);
        return;
      }

      // Call the assignToRound function
      const result = await assignToRound(
        selectedNextRound,
        passingRegistrationIds
      );

      if (result?.success) {
        notification.success({
          message: "Thành công",
          description: `Đã chuyển ${passingRegistrationIds.length} cá sang vòng tiếp theo.`,
        });

        // Add current round to the processed set to prevent the button from showing again
        if (selectedSubRound) {
          processedRoundsRef.current.add(selectedSubRound);
          
          // Lưu vào localStorage để giữ trạng thái giữa các session
          localStorage.setItem(
            'processedRounds', 
            JSON.stringify(Array.from(processedRoundsRef.current))
          );
        }

        // Set flag to indicate fish have been moved
        setHasMovedToNextRound(true);

        // Refresh current data
        if (selectedSubRound) {
          fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
        }

        // Close the modal
        setIsModalVisible(false);
      } else {
        notification.error({
          message: "Lỗi",
          description: `Không thể chuyển cá sang vòng tiếp theo: ${result?.error?.message || "Lỗi không xác định"}`,
        });
      }
    } catch (error) {
      console.error("[MoveToNextRound] Error:", error);
      notification.error({
        message: "Lỗi",
        description: `Không thể chuyển cá sang vòng tiếp theo: ${error?.message || "Lỗi không xác định"}`,
      });
    } finally {
      setIsMovingToNextRound(false);
    }
  }, [
    selectedNextRound,
    registrationRound,
    assignToRound,
    selectedSubRound,
    fetchRegistrationRound,
    currentPage,
    pageSize,
  ]);

  // Điều kiện hiển thị nút đã được chuyển vào biến shouldShowButton
  if (!shouldShowButton) {
    return null;
  }

  return (
    <>
      {shouldShowButton && (
        <div className="w-full md:w-1/4 self-end">
          <Button
            type="primary"
            className="w-full"
            onClick={showNextRoundModal}
            loading={isMovingToNextRound}
            icon={<ArrowRightOutlined />}
            style={{ backgroundColor: "#52c41a" }}
          >
            Chuyển cá sang vòng tiếp theo
          </Button>
        </div>
      )}

      <Modal
        title="Chuyển cá sang vòng tiếp theo"
        open={isModalVisible}
        onOk={handleConfirmMove}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={isMovingToNextRound}
        okText="Xác nhận chuyển"
        cancelText="Hủy"
      >
        <div className="mb-4">
          <p>
            Bạn đã hoàn thành xong vòng hiện tại.
            Vui lòng chọn vòng muốn chuyển đến.
          </p>
        </div>

        <div className="mb-4">
          <div className="font-medium mb-2">Vòng:</div>
          <Select 
            className="w-full" 
            value={nextRoundType} 
            onChange={handleNextRoundTypeChange}
            placeholder="Chọn vòng"
          >
            {roundTypes.map((type) => (
              <Option key={type} value={type}>
                {roundTypeLabels[type] || type}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <div className="font-medium mb-2">Vòng phụ:</div>
          {isLoadingSubRounds ? (
            <div className="flex justify-center py-4">
              <Spin />
            </div>
          ) : (
            <Select
              className="w-full"
              value={selectedNextRound}
              onChange={setSelectedNextRound}
              placeholder="Chọn vòng phụ"
              disabled={!nextRoundType || availableSubRounds.length === 0}
              notFoundContent={
                <Empty 
                  description={
                    <span>
                      {nextRoundType 
                        ? `Không tìm thấy vòng phụ nào trong ${roundTypeLabels[nextRoundType] || nextRoundType}`
                        : "Vui lòng chọn vòng trước"}
                    </span>
                  }
                />
              }
            >
              {availableSubRounds.map((subRound) => (
                <Option key={subRound.id} value={subRound.id}>
                  {subRound.name || `Vòng phụ ${subRound.id.substring(0, 6)}`}
                </Option>
              ))}
            </Select>
          )}
        </div>
      </Modal>
    </>
  );
}

export default NextRound;
