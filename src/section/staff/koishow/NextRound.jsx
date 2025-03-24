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

    // Lọc chỉ những cá có kết quả "Pass"
    return registrationRound.filter(
      (item) =>
        item.roundResults &&
        item.roundResults.length > 0 &&
        item.roundResults[0]?.status === "Pass"
    );
  }, [registrationRound]);

  // Thêm biến kiểm tra xem có cá nào có kết quả chưa
  const hasAnyResults = useMemo(() => {
    if (!Array.isArray(registrationRound) || registrationRound.length === 0) {
      return false;
    }

    // Kiểm tra xem có cá nào có kết quả (Pass hoặc Fail) chưa
    return registrationRound.some(
      (item) =>
        item.roundResults &&
        item.roundResults.length > 0 &&
        item.roundResults[0]?.status
    );
  }, [registrationRound]);

  const hasPassingRegistrations = passingFish.length > 0;

  // Kiểm tra xem vòng hiện tại đã được xử lý chưa
  const isCurrentRoundProcessed = useMemo(() => {
    return (
      selectedSubRound && processedRounds.includes(selectedSubRound.toString())
    );
  }, [selectedSubRound, processedRounds]);

  // Thêm hàm để xóa roundId khỏi processedRounds
  const resetProcessedRoundStatus = useCallback(() => {
    if (!selectedSubRound || !selectedCategory) return;

    // Cập nhật state processedRounds
    setProcessedRounds((prev) => prev.filter((id) => id !== selectedSubRound));

    // Cập nhật localStorage
    try {
      const storageKey = getStorageKey(selectedCategory);
      const saved = localStorage.getItem(storageKey);
      const parsedData = saved ? JSON.parse(saved) : [];
      const updatedData = parsedData.filter((id) => id !== selectedSubRound);
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
    } catch (e) {
      console.error("Error updating processed rounds:", e);
    }
  }, [selectedSubRound, selectedCategory]);

  // Thêm hàm kiểm tra trạng thái chuyển cá từ server
  const checkPromotionFromServer = useCallback(async () => {
    if (!selectedSubRound) return;

    try {
      // Giả sử: API kiểm tra xem cá từ vòng này đã được chuyển sang vòng khác chưa
      const response = await axios.get(
        `/api/rounds/${selectedSubRound}/promotion-status`
      );

      const hasBeenPromoted = response.data.hasBeenPromoted;

      // Cập nhật trạng thái local dựa trên kết quả từ server
      if (hasBeenPromoted && !processedRounds.includes(selectedSubRound)) {
        setProcessedRounds((prev) => [...prev, selectedSubRound]);
        // Cập nhật localStorage
        const storageKey = getStorageKey(selectedCategory);
        const saved = localStorage.getItem(storageKey);
        const parsedData = saved ? JSON.parse(saved) : [];
        if (!parsedData.includes(selectedSubRound)) {
          localStorage.setItem(
            storageKey,
            JSON.stringify([...parsedData, selectedSubRound])
          );
        }
      } else if (
        !hasBeenPromoted &&
        processedRounds.includes(selectedSubRound)
      ) {
        // Nếu server nói chưa chuyển nhưng local đã đánh dấu là chuyển rồi
        // -> cập nhật lại trạng thái local
        resetProcessedRoundStatus();
      }
    } catch (error) {
      console.error("Error checking promotion status:", error);
    }
  }, [
    selectedSubRound,
    selectedCategory,
    processedRounds,
    resetProcessedRoundStatus,
  ]);

  // Gọi hàm kiểm tra từ server khi component mount hoặc thay đổi vòng
  useEffect(() => {
    if (selectedSubRound) {
      checkPromotionFromServer();
    }
  }, [selectedSubRound, checkPromotionFromServer]);

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

  // Kiểm tra trước xem đã có nextRoundId chưa
  const hasNextRoundId = nextRound?.data?.nextRoundId;

  // BƯỚC 1: Định nghĩa prefetchNextRound trước khi sử dụng
  const prefetchNextRound = useCallback(async () => {
    if (!selectedSubRound || isPrefetching) return;

    try {
      setIsPrefetching(true);
      const result = await fetchNextRound(selectedSubRound);
      if (result?.data?.nextRoundId) {
        setCachedNextRoundId(result.data.nextRoundId);
      }
      setLastPrefetch(Date.now());
    } catch (error) {
      console.error("Error prefetching next round:", error);
    } finally {
      setIsPrefetching(false);
    }
  }, [selectedSubRound, isPrefetching, fetchNextRound]);

  // BƯỚC 2: Sau đó sử dụng trong useEffect
  useEffect(() => {
    if (
      selectedSubRound &&
      passingFish.length > 0 &&
      !cachedNextRoundId &&
      !isPrefetching &&
      (!lastPrefetch || Date.now() - lastPrefetch > 60000) // Chỉ prefetch nếu đã qua 1 phút
    ) {
      prefetchNextRound();
    }
  }, [
    selectedSubRound,
    passingFish.length,
    cachedNextRoundId,
    isPrefetching,
    lastPrefetch,
    prefetchNextRound, // Thêm prefetchNextRound vào dependency array
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
          result?.error?.response?.data?.message ||
          result?.message ||
          "Không thể chuyển cá sang vòng tiếp theo.";
        throw new Error(errorMsg);
      }

      // 5. Cập nhật danh sách vòng đã xử lý
      setProcessedRounds((prev) => {
        if (
          !prev.includes(selectedSubRound) &&
          !prev.includes(selectedSubRound.toString())
        ) {
          return [...prev, selectedSubRound.toString()];
        }
        return prev;
      });

      // 6. Thông báo thành công
      notification.success({
        message: "Thành công",
        description: `Đã chuyển ${passingRegistrationIds.length} cá sang vòng tiếp theo.`,
      });

      // 7. Cập nhật lại dữ liệu
      await fetchRegistrationRound(selectedSubRound, currentPage, pageSize);

      // 8. Thêm một setState rỗng để force re-render UI
      setTimeout(() => {
        // Force re-render để đảm bảo UI cập nhật
        setProcessingError(null);
      }, 100);

      return true;
    } catch (error) {
      console.error("Error moving fish to next round:", error);

      // Get error message from different possible sources
      let errorMessage = "Không thể chuyển cá sang vòng tiếp theo.";

      if (error?.response?.data?.message) {
        // Direct from Axios response data
        errorMessage = error.response.data.message;
      } else if (
        error?.name === "AxiosError" &&
        error?.response?.status === 400
      ) {
        // Special handling for Axios 400 errors
        errorMessage = error.response.data.message || errorMessage;
      } else if (error?.message) {
        // From error object message property
        errorMessage = error.message;
      }

      // Special case for fish already moved to this round
      if (errorMessage.includes("đã được phân vào vòng này")) {
        notification.info({
          message: "Thông báo",
          description: "Một số cá đã được chuyển sang vòng tiếp theo trước đó.",
        });

        // Update UI to show round as processed
        setProcessedRounds((prev) => {
          if (
            !prev.includes(selectedSubRound) &&
            !prev.includes(selectedSubRound.toString())
          ) {
            return [...prev, selectedSubRound.toString()];
          }
          return prev;
        });

        // Refresh data
        await fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
      } else {
        // Show error notification
        notification.error({
          message: "Lỗi",
          description: errorMessage,
        });
      }

      // Reset cached states
      setCachedNextRoundId(null);
      setLastPrefetch(null);

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
      {!selectedSubRound ? null : !registrationRound || // Không hiển thị gì khi chưa chọn vòng
        registrationRound.length === 0 ? (
        // Khi không có dữ liệu
        <Tooltip title="Không có cá nào trong vòng thi này">
          <Button
            type="default"
            disabled
            style={{ backgroundColor: "#f0f0f0", color: "#595959" }}
          >
            Không có dữ liệu cá
          </Button>
        </Tooltip>
      ) : isCurrentRoundProcessed ? (
        // Đã chuyển cá sang vòng tiếp theo
        <Button
          type="default"
          disabled={true}
          icon={<CheckCircleOutlined />}
          style={{
            backgroundColor: "#f6ffed",
            color: "#52c41a",
            borderColor: "#b7eb8f",
          }}
        >
          Đã chuyển cá sang vòng tiếp theo
        </Button>
      ) : passingFish.length > 0 ? (
        // Có cá đạt yêu cầu -> Hiển thị nút chuyển
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
        </Button>
      ) : !hasAnyResults ? (
        // Có cá nhưng chưa có kết quả nào
        <Tooltip title="Cần tạo kết quả cho các cá trước">
          <Button
            type="default"
            disabled
            style={{ backgroundColor: "#f0f0f0", color: "#595959" }}
          >
            Chưa có kết quả đánh giá
          </Button>
        </Tooltip>
      ) : (
        // Có kết quả nhưng không có cá nào đạt
        <Tooltip title="Không có cá đạt yêu cầu để chuyển sang vòng tiếp theo">
          <Button
            type="default"
            disabled
            style={{ backgroundColor: "#f0f0f0", color: "#595959" }}
          >
            Không có cá đạt yêu cầu
          </Button>
        </Tooltip>
      )}
    </div>
  );
}

export default NextRound;
