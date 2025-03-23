import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Button, notification, Modal, Space, Tooltip, message } from "antd";
import {
  ArrowRightOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import useRegistration from "../../../hooks/useRegistration";
import useRound from "../../../hooks/useRound";
import axios from "axios";

const roundTypeLabels = {
  Preliminary: "Vòng Sơ Khảo",
  Evaluation: "Vòng Đánh Giá Chính",
  Final: "Vòng Chung Kết",
};

// Khóa lưu trữ trong localStorage - tạo riêng cho từng hạng mục
function getStorageKey(category) {
  return `koishow_processed_rounds_${category || "default"}`;
}

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
  const [isMovingToNextRound, setIsMovingToNextRound] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  // Lưu trữ nextRoundId local
  const [cachedNextRoundId, setCachedNextRoundId] = useState(null);
  // Thêm state mới để theo dõi trạng thái prefetching
  const [isPrefetching, setIsPrefetching] = useState(false);
  // Thêm state để lưu lại thời gian cuối cùng prefetch
  const [lastPrefetch, setLastPrefetch] = useState(null);

  // State để lưu trữ các vòng đã được xử lý theo category
  const [processedRounds, setProcessedRounds] = useState(() => {
    try {
      const storageKey = getStorageKey(selectedCategory);
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading processed rounds from localStorage:", e);
      return [];
    }
  });

  const { assignToRound } = useRegistration();
  // Lấy cả nextRound state từ hook useRound
  const { fetchNextRound, nextRound } = useRound();
  const actionInProgressRef = useRef(false);

  // Cập nhật danh sách các vòng đã xử lý khi chuyển category
  useEffect(() => {
    try {
      const storageKey = getStorageKey(selectedCategory);
      const saved = localStorage.getItem(storageKey);
      const parsedData = saved ? JSON.parse(saved) : [];
      setProcessedRounds(parsedData);
    } catch (e) {
      console.error("Error loading processed rounds for category:", e);
      setProcessedRounds([]);
    }
  }, [selectedCategory]);

  // Lưu trữ processedRounds vào localStorage khi thay đổi
  useEffect(() => {
    if (selectedCategory) {
      const storageKey = getStorageKey(selectedCategory);
      localStorage.setItem(storageKey, JSON.stringify(processedRounds));
    }
  }, [processedRounds, selectedCategory]);

  // Lọc danh sách cá đạt yêu cầu
  const passingFish = useMemo(() => {
    if (!Array.isArray(registrationRound) || registrationRound.length === 0) {
      return [];
    }

    return registrationRound.filter(
      (item) =>
        item.roundResults &&
        item.roundResults.length > 0 &&
        item.roundResults[0]?.status === "Pass"
    );
  }, [registrationRound]);

  const hasPassingRegistrations = passingFish.length > 0;

  // Kiểm tra xem vòng hiện tại đã được xử lý chưa
  const isCurrentRoundProcessed = useMemo(() => {
    return processedRounds.includes(selectedSubRound);
  }, [processedRounds, selectedSubRound]);

  // Kiểm tra và cập nhật dữ liệu khi đổi vòng
  useEffect(() => {
    if (selectedSubRound) {
      // Reset các state
      setProcessingError(null);
      setCachedNextRoundId(null);
      setLastPrefetch(null);

      // Refresh data when round selection changes
      fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
    }
  }, [selectedSubRound, fetchRegistrationRound, currentPage, pageSize]);

  // Prefetch nextRound info khi có cá đạt yêu cầu
  useEffect(() => {
    if (
      selectedSubRound &&
      hasPassingRegistrations &&
      !isCurrentRoundProcessed
    ) {
      // Chủ động fetch thông tin vòng tiếp theo
      fetchNextRound(selectedSubRound);
    }
  }, [
    selectedSubRound,
    hasPassingRegistrations,
    isCurrentRoundProcessed,
    fetchNextRound,
  ]);

  // Xác định trạng thái hiển thị nút
  const shouldShowButton = useMemo(() => {
    // Phải có vòng được chọn và có cá đạt yêu cầu
    if (!selectedSubRound || !hasPassingRegistrations) {
      return false;
    }

    // Không hiển thị nút nếu vòng đã được xử lý thành công
    if (isCurrentRoundProcessed) {
      return false;
    }

    return true;
  }, [selectedSubRound, hasPassingRegistrations, isCurrentRoundProcessed]);

  // Hàm xóa một vòng khỏi danh sách đã xử lý (để thử lại)
  const removeFromProcessed = useCallback((roundId) => {
    setProcessedRounds((prev) => prev.filter((id) => id !== roundId));
    setProcessingError(null);
    setCachedNextRoundId(null); // Reset cached nextRoundId khi thử lại
    setLastPrefetch(null);
  }, []);

  // Chuyển cá sang vòng tiếp theo
  const moveToNextRound = useCallback(async () => {
    if (!selectedSubRound || actionInProgressRef.current) return false;

    actionInProgressRef.current = true;
    setIsMovingToNextRound(true);
    setProcessingError(null);

    try {
      // 1. Lấy danh sách cá đạt yêu cầu
      const passingRegistrationIds = passingFish.map(
        (item) => item.registration?.id
      );

      if (passingRegistrationIds.length === 0) {
        notification.warning({
          message: "Thông báo",
          description:
            "Không có cá nào đạt yêu cầu để chuyển sang vòng tiếp theo.",
        });
        return false;
      }

      // 2. Đảm bảo đã fetch thông tin vòng tiếp theo
      await fetchNextRound(selectedSubRound);

      // 3. Lấy nextRoundId từ nextRound state
      const nextRoundId = nextRound?.data?.nextRoundId;

      console.log("Next Round Info:", {
        currentRound: selectedSubRound,
        nextRoundId: nextRoundId,
        nextRoundData: nextRound?.data,
        passing: passingRegistrationIds.length,
      });

      if (!nextRoundId) {
        notification.error({
          message: "Lỗi",
          description:
            "Không tìm thấy vòng tiếp theo. Vui lòng kiểm tra lại cấu hình vòng thi.",
        });
        console.error("Missing nextRoundId:", nextRound);
        throw new Error("Không tìm thấy vòng tiếp theo");
      }

      // 4. Chuyển cá sang vòng tiếp theo
      const result = await assignToRound(nextRoundId, passingRegistrationIds);

      if (!result || !result.success) {
        const errorMsg =
          result?.message || "Không thể chuyển cá sang vòng tiếp theo.";
        throw new Error(errorMsg);
      }

      // 5. Cập nhật danh sách vòng đã xử lý
      setProcessedRounds((prev) => [...prev, selectedSubRound]);

      // 6. Thông báo thành công
      notification.success({
        message: "Thành công",
        description: `Đã chuyển ${passingRegistrationIds.length} cá sang vòng tiếp theo.`,
      });

      // 7. Cập nhật lại dữ liệu
      await fetchRegistrationRound(selectedSubRound, currentPage, pageSize);

      return true;
    } catch (error) {
      // Xử lý lỗi
      console.error("Error moving fish to next round:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Không thể chuyển cá sang vòng tiếp theo.";

      notification.error({
        message: "Lỗi",
        description: errorMessage,
      });

      setProcessingError(errorMessage);

      // Reset cached nextRoundId khi có lỗi
      setCachedNextRoundId(null);
      setLastPrefetch(null);

      // Log chi tiết lỗi
      console.log("Error details:", {
        error,
        cachedNextRoundId,
        selectedSubRound,
        selectedCategory,
      });

      return false;
    } finally {
      setIsMovingToNextRound(false);
      actionInProgressRef.current = false;
    }
  }, [
    selectedSubRound,
    selectedCategory,
    passingFish,
    assignToRound,
    fetchNextRound,
    nextRound,
    fetchRegistrationRound,
    currentPage,
    pageSize,
    cachedNextRoundId,
  ]);

  // Xử lý khi click vào nút chuyển cá
  const handleMoveToNextRound = useCallback(() => {
    if (actionInProgressRef.current) return;

    if (!selectedSubRound) {
      notification.warning({
        message: "Thông báo",
        description: "Vui lòng chọn vòng hiện tại.",
      });
      return;
    }

    if (passingFish.length === 0) {
      notification.warning({
        message: "Thông báo",
        description:
          "Không có cá nào đạt yêu cầu để chuyển sang vòng tiếp theo.",
      });
      return;
    }

    // Kiểm tra trước xem đã có nextRoundId chưa
    const hasNextRoundId = nextRound?.data?.nextRoundId;

    if (!hasNextRoundId) {
      notification.info({
        message: "Đang kiểm tra",
        description: "Đang tìm vòng tiếp theo, vui lòng đợi trong giây lát...",
      });

      // Thử fetch lại thông tin vòng tiếp theo
      fetchNextRound(selectedSubRound).then(() => {
        // Kiểm tra lại sau khi fetch
        if (nextRound?.data?.nextRoundId) {
          // Nếu có nextRoundId, hiển thị hộp thoại xác nhận
          showConfirmDialog();
        } else {
          notification.error({
            message: "Lỗi",
            description:
              "Không tìm thấy vòng tiếp theo. Vui lòng kiểm tra lại cấu hình vòng thi.",
          });
        }
      });
    } else {
      // Nếu đã có nextRoundId, hiển thị hộp thoại xác nhận ngay
      showConfirmDialog();
    }

    function showConfirmDialog() {
      Modal.confirm({
        title: "Xác nhận chuyển cá",
        content: `Bạn có chắc chắn muốn chuyển ${passingFish.length} cá sang vòng tiếp theo?`,
        okText: "Chuyển",
        cancelText: "Hủy",
        onOk: moveToNextRound,
      });
    }
  }, [
    selectedSubRound,
    passingFish,
    moveToNextRound,
    nextRound,
    fetchNextRound,
  ]);

  // Hiển thị UI
  return (
    <div className="w-full md:w-1/4 self-end">
      {shouldShowButton ? (
        <Button
          type="primary"
          className="w-full"
          onClick={handleMoveToNextRound}
          loading={isMovingToNextRound}
          disabled={isMovingToNextRound}
          icon={<ArrowRightOutlined />}
          style={{ backgroundColor: "#52c41a" }}
        >
          Chuyển {passingFish.length} cá sang vòng tiếp theo
          {nextRound?.data?.nextRoundId && (
            <span className="text-xs ml-1">(✓)</span>
          )}
        </Button>
      ) : isCurrentRoundProcessed ? (
        <Button
          type="default"
          className="w-full"
          disabled={true}
          icon={<CheckCircleOutlined />}
          style={{ backgroundColor: "#f0f0f0", color: "#595959" }}
        >
          Đã chuyển cá sang vòng tiếp theo
        </Button>
      ) : (
        passingFish.length === 0 &&
        selectedSubRound && (
          <Tooltip title="Không có cá đạt yêu cầu để chuyển sang vòng tiếp theo">
            <Button
              type="default"
              className="w-full"
              disabled
              style={{ backgroundColor: "#f0f0f0", color: "#595959" }}
            >
              Không có cá đạt yêu cầu
            </Button>
          </Tooltip>
        )
      )}

      {processingError && (
        <div className="mt-2 text-xs text-red-500">Lỗi: {processingError}</div>
      )}
    </div>
  );
}

export default NextRound;
