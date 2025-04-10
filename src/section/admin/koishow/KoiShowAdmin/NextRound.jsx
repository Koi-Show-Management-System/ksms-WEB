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
import useRegistration from "../../../../hooks/useRegistration";
import useRound from "../../../../hooks/useRound";
import axios from "axios";
import useRegistrationRound from "../../../../hooks/useRegistrationRound";
import useRoundResult from "../../../../hooks/useRoundResult";

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
  onFishMoveStatusChange,
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
  // Thêm state để lưu trữ tất cả cá pass từ tất cả các trang
  const [allPassingFish, setAllPassingFish] = useState([]);
  // State để theo dõi quá trình tải dữ liệu
  const [isLoadingAllFish, setIsLoadingAllFish] = useState(false);

  // State để lưu trữ các vòng đã được xử lý theo category
  const [processedRounds, setProcessedRounds] = useState([]);

  const { assignToRound } = useRegistration();
  // Lấy cả nextRound state từ hook useRound
  const { fetchNextRound, nextRound } = useRound();
  const actionInProgressRef = useRef(false);

  const {
    createNextRoundRegistrations,
    isLoading: registrationLoading,
    fetchAllRegistrationRoundByStatus, // Thêm hàm mới lấy tất cả fish pass
  } = useRegistrationRound();

  const { createRoundResultsForAll, isLoading: resultLoading } =
    useRoundResult();

  // Lọc danh sách cá đạt yêu cầu trang hiện tại (chỉ để hiển thị)
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

  // Thêm useEffect mới để lấy tất cả cá pass từ tất cả các trang
  useEffect(() => {
    const fetchAllPassingFish = async () => {
      if (!selectedSubRound) return;

      try {
        setIsLoadingAllFish(true);
        // Giả sử API này trả về tất cả cá pass từ tất cả các trang
        const response = await fetchAllRegistrationRoundByStatus(
          selectedSubRound,
          "Pass"
        );
        if (response && Array.isArray(response)) {
          setAllPassingFish(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setAllPassingFish(response.data);
        } else {
          console.error(
            "Invalid response format for all passing fish:",
            response
          );
          // Fallback: Sử dụng danh sách cá pass từ trang hiện tại
          setAllPassingFish(passingFish);
        }
      } catch (error) {
        console.error("Error fetching all passing fish:", error);
        // Fallback: Sử dụng danh sách cá pass từ trang hiện tại
        setAllPassingFish(passingFish);
      } finally {
        setIsLoadingAllFish(false);
      }
    };

    if (selectedSubRound) {
      fetchAllPassingFish();
    }
  }, [selectedSubRound, fetchAllRegistrationRoundByStatus]);

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

  // Thay đổi từ passingFish.length thành allPassingFish.length
  const hasPassingRegistrations = allPassingFish.length > 0;

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
      // Thử lấy thông tin về registrationRound để kiểm tra xem cá đã được chuyển đi chưa
      // Nếu API riêng cho kiểm tra trạng thái không tồn tại, chúng ta có thể kiểm tra từ dữ liệu hiện có
      // hoặc sử dụng localStorage như một giải pháp tạm thời

      // Kiểm tra trạng thái từ localStorage
      const localStorageKey = `round_${selectedSubRound}_promoted`;
      const localStorageValue = localStorage.getItem(localStorageKey);

      if (
        localStorageValue === "true" &&
        !processedRounds.includes(selectedSubRound)
      ) {
        setProcessedRounds((prev) => [...prev, selectedSubRound]);
        setFishAlreadyMoved(true);
      }

      // Nếu API kiểm tra trạng thái tồn tại, sử dụng nó thay vì localStorage
      /* 
      const response = await axios.get(
        `/api/rounds/${selectedSubRound}/promotion-status`
      );

      const hasBeenPromoted = response.data.hasBeenPromoted;

      // Cập nhật trạng thái local dựa trên kết quả từ server
      if (hasBeenPromoted && !processedRounds.includes(selectedSubRound)) {
        setProcessedRounds((prev) => [...prev, selectedSubRound]);
        setFishAlreadyMoved(true);
      } else if (
        !hasBeenPromoted &&
        processedRounds.includes(selectedSubRound)
      ) {
        // Nếu server nói chưa chuyển nhưng local đã đánh dấu là chuyển rồi
        // -> cập nhật lại trạng thái local
        resetProcessedRoundStatus();
      }
      */
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
      setAllPassingFish([]);

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
      allPassingFish.length > 0 &&
      !cachedNextRoundId &&
      !isPrefetching &&
      (!lastPrefetch || Date.now() - lastPrefetch > 60000)
    ) {
      prefetchNextRound();
    }
  }, [
    selectedSubRound,
    allPassingFish.length,
    cachedNextRoundId,
    isPrefetching,
    lastPrefetch,
    prefetchNextRound,
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

  // Thêm useEffect để gửi trạng thái của việc chuyển cá về component cha
  useEffect(() => {
    if (
      onFishMoveStatusChange &&
      typeof onFishMoveStatusChange === "function"
    ) {
      onFishMoveStatusChange(fishAlreadyMoved, noNextRound);
    }
  }, [fishAlreadyMoved, noNextRound, onFishMoveStatusChange]);

  // Cập nhật hàm handleMoveToNextRound để thực sự chuyển cá
  const handleMoveToNextRound = async () => {
    if (isCurrentRoundMoved) return;

    // Kiểm tra để tránh xử lý đồng thời
    if (
      actionInProgressRef.current ||
      isMovingToNextRound ||
      isLoadingAllFish
    ) {
      notification.info({
        message: "Đang xử lý",
        description:
          "Hệ thống đang xử lý yêu cầu của bạn, vui lòng chờ trong giây lát.",
      });
      return;
    }

    // Kiểm tra xem có cá nào pass để chuyển không
    if (allPassingFish.length === 0) {
      notification.warning({
        message: "Không thể chuyển",
        description:
          "Không có cá nào đạt yêu cầu để chuyển sang vòng tiếp theo.",
      });
      return;
    }

    // Kiểm tra xem có vòng tiếp theo không
    if (!nextRoundType) {
      notification.warning({
        message: "Không thể chuyển",
        description:
          "Đây là vòng cuối cùng, không có vòng tiếp theo để chuyển cá.",
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

      // Lấy danh sách ID của tất cả các cá đạt yêu cầu từ state allPassingFish
      const passingFishIds = allPassingFish
        .map((fish) => {
          // Có nhiều cấu trúc dữ liệu có thể xảy ra, nên chúng ta cần xử lý linh hoạt
          // Thử các cách khác nhau để lấy ID đăng ký của cá
          const id = fish.registration?.id || fish.registrationId || fish.id;
          return id;
        })
        .filter((id) => id); // Lọc bỏ các ID null/undefined

      // Kiểm tra lại một lần nữa
      if (passingFishIds.length === 0) {
        throw new Error(
          "Không tìm thấy ID của cá để chuyển sang vòng tiếp theo."
        );
      }

      // Call assignToRound (which now handles notifications internally)
      const registrationResult = await assignToRound(
        targetRoundId,
        passingFishIds
      );

      // If successful, update state
      if (registrationResult && registrationResult.success) {
        notification.success({
          message: "Thành công",
          description: `Đã chuyển thành công ${passingFishIds.length} cá sang vòng tiếp theo.`,
        });

        // Lưu trạng thái vào localStorage để phòng trường hợp tải lại trang
        const localStorageKey = `round_${selectedSubRound}_promoted`;
        localStorage.setItem(localStorageKey, "true");

        // Update state to mark this round as processed
        setProcessedRounds((prev) => {
          if (!prev.includes(selectedSubRound)) {
            return [...prev, selectedSubRound];
          }
          return prev;
        });

        setFishAlreadyMoved(true);

        // Thông báo cho component cha biết trạng thái đã thay đổi
        if (
          onFishMoveStatusChange &&
          typeof onFishMoveStatusChange === "function"
        ) {
          onFishMoveStatusChange(true, noNextRound);
        }

        // Refresh data
        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
      } else {
        // Xử lý trường hợp API trả về thành công nhưng không có success = true
        throw new Error(
          registrationResult?.message || "API không trả về kết quả thành công"
        );
      }
    } catch (error) {
      console.error("Error moving fish to next round:", error);
      setProcessingError(error.message);
      notification.error({
        message: "Lỗi",
        description: `Không thể chuyển cá sang vòng tiếp theo: ${error.message || "Lỗi không xác định"}`,
      });
    } finally {
      setIsMovingToNextRound(false);
      actionInProgressRef.current = false;
    }
  };

  // Quyết định nội dung hiển thị dựa trên trạng thái
  let buttonContent;
  if (fishAlreadyMoved || isCurrentRoundProcessed) {
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
          Đã chuyển {allPassingFish.length} cá sang vòng
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
  } else {
    buttonContent = (
      <Button
        onClick={handleMoveToNextRound}
        loading={isMovingToNextRound || isLoadingAllFish}
        disabled={
          isMovingToNextRound ||
          isLoadingAllFish ||
          !nextRoundType ||
          allPassingFish.length === 0
        }
        style={{
          backgroundColor: "#52c41a",
          color: "white",
          borderColor: "#52c41a",
          width: "100%",
        }}
      >
        Chuyển {allPassingFish.length} cá sang vòng tiếp theo
      </Button>
    );
  }

  return buttonContent;
}

export default NextRound;
