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
  RightCircleOutlined,
} from "@ant-design/icons";
import useRegistration from "../../../hooks/useRegistration";
import useRound from "../../../hooks/useRound";
import axios from "axios";
import useRegistrationRound from "../../../hooks/useRegistrationRound";
import useRoundResult from "../../../hooks/useRoundResult";

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
  const [isMovingToNextRound, setIsMovingToNextRound] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  // Lưu trữ nextRoundId local
  const [cachedNextRoundId, setCachedNextRoundId] = useState(null);
  // Thêm state mới để theo dõi trạng thái prefetching
  const [isPrefetching, setIsPrefetching] = useState(false);
  // Thêm state để lưu lại thời gian cuối cùng prefetch
  const [lastPrefetch, setLastPrefetch] = useState(null);
  // Add state to track whether fish have been moved
  const [fishAlreadyMoved, setFishAlreadyMoved] = useState(false);

  // State để lưu trữ các vòng đã được xử lý theo category
  const [processedRounds, setProcessedRounds] = useState([]);

  const { assignToRound } = useRegistration();
  // Lấy cả nextRound state từ hook useRound
  const { fetchNextRound, nextRound } = useRound();
  const actionInProgressRef = useRef(false);

  const { createNextRoundRegistrations, isLoading: registrationLoading } =
    useRegistrationRound();
  const { createRoundResultsForAll, isLoading: resultLoading } =
    useRoundResult();

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
    if (!selectedSubRound) return;

    // Cập nhật state processedRounds
    setProcessedRounds((prev) => prev.filter((id) => id !== selectedSubRound));
  }, [selectedSubRound]);

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
  }, [selectedSubRound, processedRounds, resetProcessedRoundStatus]);

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

  // Điều chỉnh isCurrentRoundMoved chỉ dựa trên state từ component
  const isCurrentRoundMoved = useMemo(() => {
    // Kiểm tra từ processedRounds (state đã có sẵn) thay vì localStorage
    return selectedSubRound && processedRounds.includes(selectedSubRound);
  }, [selectedSubRound, processedRounds]);

  // Thêm biến để xác định có vòng tiếp theo hay không
  const nextRoundType = useMemo(() => {
    const currentIndex = roundTypes.findIndex(
      (type) => type === selectedRoundType
    );
    if (currentIndex >= 0 && currentIndex < roundTypes.length - 1) {
      return roundTypes[currentIndex + 1];
    }
    return null;
  }, [roundTypes, selectedRoundType]);

  // Thêm biến kiểm tra xem có phải vòng cuối cùng không
  const noNextRound = useMemo(() => {
    const currentIndex = roundTypes.findIndex(
      (type) => type === selectedRoundType
    );
    return currentIndex === roundTypes.length - 1; // Trả về true nếu đây là vòng cuối cùng
  }, [roundTypes, selectedRoundType]);

  // Kiểm tra và cập nhật trạng thái ban đầu từ localStorage
  useEffect(() => {
    if (selectedSubRound) {
      // Kiểm tra từ localStorage
      const moved = isCurrentRoundMoved;
      setFishAlreadyMoved(moved);
    }
  }, [selectedSubRound, isCurrentRoundMoved]);

  // Cập nhật hàm handleMoveToNextRound để thực sự chuyển cá
  const handleMoveToNextRound = async () => {
    if (isCurrentRoundMoved) return;

    // Kiểm tra để tránh xử lý đồng thời
    if (actionInProgressRef.current) {
      notification.info({
        message: "Đang xử lý",
        description:
          "Hệ thống đang xử lý yêu cầu của bạn, vui lòng chờ trong giây lát.",
      });
      return;
    }

    setIsMovingToNextRound(true);
    actionInProgressRef.current = true;

    try {
      // Gọi API để lấy thông tin vòng tiếp theo nếu chưa có
      let targetRoundId = cachedNextRoundId || hasNextRoundId;

      if (!targetRoundId) {
        const result = await fetchNextRound(selectedSubRound);
        targetRoundId = result?.data?.nextRoundId;
      }

      if (!targetRoundId) {
        throw new Error("Không tìm thấy thông tin vòng tiếp theo.");
      }

      // Lấy danh sách ID của các cá đạt yêu cầu
      const passingFishIds = passingFish
        .map((fish) => {
          // In ra console để xem cấu trúc thực tế của đối tượng cá
          console.log("Fish object:", fish);

          // Lấy ID từ đối tượng registration
          const id = fish.registration?.id;

          // In ra ID để kiểm tra
          console.log("Using registration ID:", id);

          return id;
        })
        .filter((id) => id); // Lọc bỏ các ID null/undefined

      // Call assignToRound (which now handles notifications internally)
      const registrationResult = await assignToRound(
        targetRoundId,
        passingFishIds
      );

      // If successful, update state
      if (registrationResult && registrationResult.success) {
        // Update state to mark this round as processed
        setProcessedRounds((prev) => {
          if (!prev.includes(selectedSubRound)) {
            return [...prev, selectedSubRound];
          }
          return prev;
        });

        setFishAlreadyMoved(true);

        // Refresh data
        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
      }
    } catch (error) {
      console.error("Error moving fish to next round:", error);
      setProcessingError(error.message);
    } finally {
      setIsMovingToNextRound(false);
      actionInProgressRef.current = false;
    }
  };

  // Quyết định nội dung hiển thị dựa trên trạng thái
  let buttonContent;
  if (fishAlreadyMoved) {
    buttonContent = (
      <Tooltip title="Đã chuyển cá sang vòng">
        <Button
          type="default"
          icon={<CheckCircleOutlined style={{ color: "white" }} />}
          disabled={true}
          style={{
            backgroundColor: "#d9d9d9",
            color: "white",
            borderColor: "#d9d9d9",
            width: "100%",
          }}
        >
          Đã chuyển {passingFish.length} cá sang vòng
        </Button>
      </Tooltip>
    );
  } else if (noNextRound) {
    buttonContent = (
      <Tooltip title="Đây là vòng cuối cùng">
        <Button
          type="default"
          icon={<RightCircleOutlined style={{ color: "white" }} />}
          disabled={true}
          style={{
            backgroundColor: "#d9d9d9",
            color: "white",
            borderColor: "#d9d9d9",
            width: "100%",
          }}
        >
          Không có vòng tiếp theo
        </Button>
      </Tooltip>
    );
  } else if (isCurrentRoundProcessed) {
    buttonContent = (
      <Button
        type="default"
        icon={<CheckCircleOutlined style={{ color: "white" }} />}
        disabled={true}
        style={{
          backgroundColor: "#d9d9d9",
          color: "white",
          borderColor: "#d9d9d9",
          width: "100%",
        }}
      >
        Đã chuyển {passingFish.length} cá sang vòng
      </Button>
    );
  } else {
    buttonContent = (
      <Button
        onClick={handleMoveToNextRound}
        loading={isMovingToNextRound}
        disabled={isMovingToNextRound || !nextRoundType}
        style={{
          backgroundColor: "#52c41a",
          color: "white",
          borderColor: "#52c41a",
          width: "100%",
        }}
      >
        Chuyển {passingFish.length} cá sang vòng tiếp theo
      </Button>
    );
  }

  return buttonContent;
}

export default NextRound;
