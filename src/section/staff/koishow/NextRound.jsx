import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button, notification, Modal, Select, Spin } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import useRegistration from "../../../hooks/useRegistration";
import useRound from "../../../hooks/useRound";

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
  const [selectedNextRound, setSelectedNextRound] = useState(null);
  const [isLoadingSubRounds, setIsLoadingSubRounds] = useState(false);
  const { round, fetchRound, isLoading: roundLoading } = useRound();

  // Keep track of rounds we've already moved fish from
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

  // Theo dõi thay đổi của registrationRound để cập nhật trạng thái
  useEffect(() => {
    if (selectedSubRound !== prevSelectedSubRoundRef.current) {
      prevSelectedSubRoundRef.current = selectedSubRound;
      setHasMovedToNextRound(false);
    }
    
    // Nếu đã xử lý vòng này rồi, đánh dấu đã chuyển
    if (
      selectedSubRound && 
      processedRoundsRef.current.has(selectedSubRound)
    ) {
      setHasMovedToNextRound(true);
    }
  }, [selectedSubRound, registrationRound]);

  // Kiểm tra điều kiện hiển thị nút
  const shouldShowButton = useMemo(() => {
    // Không hiển thị nếu chưa chọn vòng
    if (!selectedSubRound) return false;
    
    // Không hiển thị nếu đã xử lý vòng này rồi
    if (processedRoundsRef.current.has(selectedSubRound)) return false;
    
    // Không hiển thị nếu đã chuyển cá sang vòng tiếp theo
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

  // Determine next round type index
  const getNextRoundTypeIndex = useCallback(() => {
    for (let i = 0; i < roundTypes.length; i++) {
      if (roundTypes[i] === selectedRoundType) {
        return i + 1;
      }
    }
    return -1;
  }, [roundTypes, selectedRoundType]);

  // Fetch available sub-rounds for the next round type
  const fetchNextRoundOptions = useCallback(
    async () => {
      if (!selectedCategory) return;

      try {
        setIsLoadingSubRounds(true);
        setAvailableSubRounds([]); // Reset list before fetching
        
        // Xác định loại vòng hiện tại
        const currentRoundType = selectedRoundType;
        
        // Nếu không còn vòng nhỏ nào trong vòng hiện tại, mới chuyển sang vòng lớn tiếp theo
        const nextRoundTypeIndex = getNextRoundTypeIndex();
        if (nextRoundTypeIndex >= 0 && nextRoundTypeIndex < roundTypes.length) {
          const nextType = roundTypes[nextRoundTypeIndex];
          setNextRoundType(nextType);
          
          console.log("Fetching sub-rounds for next round type:", nextType);
          
          // QUAN TRỌNG: Trước tiên truy cập trực tiếp API để lấy danh sách vòng phụ
          try {
            // Thử gọi API theo cách khác để sửa lỗi
            const response = await fetch(`/api/rounds?competitionCategoryId=${selectedCategory}&roundType=${nextType}&page=1&pageSize=100`);
            const data = await response.json();
            
            console.log("Raw API response:", data);
            
            if (data && data.success && data.data) {
              const nextRounds = data.data.items || [];
              console.log(`API returned ${nextRounds.length} sub-rounds for ${nextType}`);
              
              if (nextRounds.length > 0) {
                // Sắp xếp theo thứ tự vòng
                const sortedRounds = [...nextRounds].sort((a, b) => {
                  return (a.roundOrder || 1) - (b.roundOrder || 1);
                });
                
                setAvailableSubRounds(sortedRounds);
                setSelectedNextRound(sortedRounds[0].id);
                return; // Thoát khỏi hàm nếu đã lấy được dữ liệu
              }
            }
          } catch (directApiError) {
            console.error("Error calling direct API:", directApiError);
            // Tiếp tục thử phương pháp sử dụng hook
          }
          
          // Phương pháp dự phòng: Sử dụng hook fetchRound
          await fetchRound(selectedCategory, nextType, 1, 100);
          
          console.log("Hook round state after fetchRound:", round);
          
          // Sử dụng state round sau khi gọi fetchRound
          if (round && Array.isArray(round) && round.length > 0) {
            console.log(`Found ${round.length} sub-rounds from hook for ${nextType}`);
            
            // Lọc các vòng có roundType đúng
            const validRounds = round.filter(r => r.roundType === nextType);
            
            if (validRounds.length > 0) {
              const sortedRounds = [...validRounds].sort((a, b) => {
                return (a.roundOrder || 1) - (b.roundOrder || 1);
              });
              
              setAvailableSubRounds(sortedRounds);
              setSelectedNextRound(sortedRounds[0].id);
            } else {
              setAvailableSubRounds([]);
              setSelectedNextRound(null);
              notification.info({
                message: "Thông báo",
                description: `Không tìm thấy vòng nào trong loại vòng ${roundTypeLabels[nextType] || nextType}`,
              });
            }
          } else {
            setAvailableSubRounds([]);
            setSelectedNextRound(null);
            notification.info({
              message: "Thông báo",
              description: `Không tìm thấy vòng nào trong loại vòng ${roundTypeLabels[nextType] || nextType}`,
            });
          }
        } else {
          // Đã đến vòng cuối
          setAvailableSubRounds([]);
          setSelectedNextRound(null);
          notification.warning({
            message: "Thông báo",
            description: "Đã đến vòng cuối cùng của cuộc thi.",
          });
        }
      } catch (error) {
        console.error("Error fetching next round options:", error);
        notification.error({
          message: "Lỗi",
          description: `Không thể tải danh sách vòng: ${error.message}`,
        });
        setAvailableSubRounds([]);
        setSelectedNextRound(null);
      } finally {
        setIsLoadingSubRounds(false);
      }
    },
    [selectedCategory, fetchRound, selectedRoundType, selectedSubRound, getNextRoundTypeIndex, roundTypes, round]
  );

  // Show modal for next round selection
  const showNextRoundModal = useCallback(() => {
    setIsModalVisible(true);
    fetchNextRoundOptions();
  }, [fetchNextRoundOptions]);

  // Handle confirmation of moving to next round
  const handleConfirmMove = useCallback(async () => {
    if (!selectedNextRound) {
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
            Vui lòng chọn vòng tiếp theo.
          </p>
        </div>

        <div className="mb-4">
          <div className="font-medium mb-2">Vòng tiếp theo:</div>
          <Select className="w-full" value={nextRoundType} disabled>
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
              dropdownRender={(menu) => (
                <div>
                  <div className="px-2 py-1 text-xs text-gray-500">
                    {nextRoundType ? `Các vòng phụ của ${roundTypeLabels[nextRoundType] || nextRoundType}` : 'Các vòng phụ'}
                  </div>
                  {menu}
                </div>
              )}
            >
              {availableSubRounds.length === 0 ? (
                <Option value={null} disabled>Không có vòng phụ</Option>
              ) : (
                availableSubRounds.map((subRound) => (
                  <Option key={subRound.id} value={subRound.id}>
                    {subRound.name || `Vòng phụ ${subRound.id.substring(0, 6)}`}
                  </Option>
                ))
              )}
            </Select>
          )}
        </div>
      </Modal>
    </>
  );
}

export default NextRound;
