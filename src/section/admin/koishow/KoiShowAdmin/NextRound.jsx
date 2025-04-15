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

  // Thêm state để lưu số lượng cá đã chuyển
  const [transferredFishCount, setTransferredFishCount] = useState(0);

  // Thêm state để lưu trữ tất cả cá trong vòng thi
  const [allFishInRound, setAllFishInRound] = useState([]);
  // State để kiểm tra xem tất cả cá đã có kết quả chưa
  const [allFishHaveResults, setAllFishHaveResults] = useState(false);

  const { assignToRound } = useRegistration();
  // Lấy cả nextRound state từ hook useRound
  const { fetchNextRound, nextRound } = useRound();
  const actionInProgressRef = useRef(false);

  // Kiểm tra trước xem đã có nextRoundId chưa
  const hasNextRoundId = nextRound?.data?.nextRoundId;

  const {
    createNextRoundRegistrations,
    isLoading: registrationLoading,
    fetchAllRegistrationRoundByStatus, // Thêm hàm mới lấy tất cả fish pass
    fetchAllRegistrationRound, // Thêm hàm mới lấy tất cả cá trong vòng thi
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

  // Kiểm tra xem tất cả cá trong vòng thi đã có kết quả chưa
  useEffect(() => {
    const checkAllFishHaveResults = async () => {
      if (!selectedSubRound) return;

      // Lấy từ localStorage trước, nếu đã chuyển cá thì không cần kiểm tra nữa
      const localStorageKey = `round_${selectedSubRound}_promoted`;
      const wasPromoted = localStorage.getItem(localStorageKey) === "true";

      if (wasPromoted) {
        setFishAlreadyMoved(true);
        setAllFishHaveResults(true);
        return;
      }

      try {
        setIsLoadingAllFish(true);
        // Kiểm tra xem function có tồn tại không
        if (typeof fetchAllRegistrationRound !== "function") {
          console.warn("fetchAllRegistrationRound is not a function");
          // Fallback: Sử dụng dữ liệu từ prop registrationRound
          setAllFishInRound(registrationRound || []);

          // Kiểm tra xem tất cả cá đã có kết quả chưa
          const allHaveResults =
            registrationRound &&
            registrationRound.length > 0 &&
            registrationRound.every(
              (item) =>
                item.roundResults &&
                item.roundResults.length > 0 &&
                item.roundResults[0]?.status
            );

          setAllFishHaveResults(allHaveResults);
          return;
        }

        // Lấy tất cả cá trong vòng thi
        const response = await fetchAllRegistrationRound(selectedSubRound);

        let allFish = [];
        if (response && Array.isArray(response)) {
          allFish = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          allFish = response.data;
        } else {
          console.error("Invalid response format for all fish:", response);
          allFish = [];
        }

        setAllFishInRound(allFish);

        // Kiểm tra xem tất cả cá đã có kết quả chưa
        const allHaveResults =
          allFish.length > 0 &&
          allFish.every(
            (item) =>
              item.roundResults &&
              item.roundResults.length > 0 &&
              item.roundResults[0]?.status
          );

        setAllFishHaveResults(allHaveResults);
      } catch (error) {
        console.error("Error checking all fish results:", error);
        setAllFishHaveResults(false);
      } finally {
        setIsLoadingAllFish(false);
      }
    };

    if (selectedSubRound) {
      checkAllFishHaveResults();
    }
  }, [selectedSubRound, fetchAllRegistrationRound, registrationRound]);

  // Thêm useEffect mới để kiểm tra localStorage khi component mount hoặc selectedSubRound thay đổi
  useEffect(() => {
    if (selectedSubRound) {
      const localStorageKey = `round_${selectedSubRound}_promoted`;
      const wasPromoted = localStorage.getItem(localStorageKey) === "true";

      if (wasPromoted) {
        setFishAlreadyMoved(true);
        setProcessedRounds((prev) =>
          prev.includes(selectedSubRound) ? prev : [...prev, selectedSubRound]
        );
      }
    }
  }, [selectedSubRound]);

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

  // Thêm hàm kiểm tra xem đã có cá được chuyển vào vòng tiếp theo chưa
  const checkTransferredFish = useCallback(async () => {
    // Thêm kiểm tra bảo vệ để đảm bảo hasNextRoundId đã được khởi tạo
    if (!selectedSubRound) return;

    // Đổi cách kiểm tra để tránh truy cập hasNextRoundId nếu nó là undefined
    const nextRoundIdExists =
      typeof hasNextRoundId !== "undefined" && hasNextRoundId !== null;
    if (!nextRoundIdExists && !cachedNextRoundId) {
      // Nếu không có thông tin về vòng tiếp theo, kiểm tra từ localStorage
      const localStorageKey = `round_${selectedSubRound}_promoted`;
      const moved = localStorage.getItem(localStorageKey) === "true";
      setFishAlreadyMoved(moved);
      return;
    }

    try {
      // Tắt cờ đang xử lý để không ảnh hưởng đến UI
      const wasInProgress = actionInProgressRef.current;
      actionInProgressRef.current = true;

      // Lấy nextRoundId từ cache hoặc fetch mới nếu chưa có
      let targetRoundId = cachedNextRoundId || hasNextRoundId;

      if (!targetRoundId) {
        const result = await fetchNextRound(selectedSubRound);
        targetRoundId = result?.data?.nextRoundId;
        if (targetRoundId) {
          setCachedNextRoundId(targetRoundId);
        }
      }

      if (!targetRoundId) {
        // Không tìm thấy vòng tiếp theo, sử dụng localStorage như giải pháp dự phòng
        const localStorageKey = `round_${selectedSubRound}_promoted`;
        const moved = localStorage.getItem(localStorageKey) === "true";
        setFishAlreadyMoved(moved);
        return;
      }

      // Có vòng tiếp theo, kiểm tra xem có cá nào đã được chuyển vào vòng tiếp theo chưa
      // Sử dụng API để kiểm tra - giả sử API trả về mảng các cá đã được chuyển
      try {
        // Sử dụng axios hoặc hook tùy thuộc vào cấu trúc dự án
        const response = await axios.get(
          `/api/rounds/${targetRoundId}/registrations`
        );

        if (response.data && Array.isArray(response.data)) {
          // Tìm những cá từ vòng hiện tại đã được chuyển sang vòng tiếp theo
          // Giả sử API trả về có chứa thông tin về vòng trước (previousRoundId)
          const fishFromCurrentRound = response.data.filter(
            (item) =>
              item.previousRoundId === selectedSubRound ||
              item.previousRound?.id === selectedSubRound
          );

          // Nếu có cá được chuyển từ vòng hiện tại
          if (fishFromCurrentRound.length > 0) {
            setTransferredFishCount(fishFromCurrentRound.length);
            setFishAlreadyMoved(true);

            // Cập nhật localStorage như một cache
            const localStorageKey = `round_${selectedSubRound}_promoted`;
            localStorage.setItem(localStorageKey, "true");

            // Cập nhật state processedRounds
            setProcessedRounds((prev) => {
              if (!prev.includes(selectedSubRound)) {
                return [...prev, selectedSubRound];
              }
              return prev;
            });
          } else {
            setFishAlreadyMoved(false);
          }
        }
      } catch (error) {
        console.error("Error checking transferred fish:", error);
        // Nếu API lỗi, sử dụng localStorage như giải pháp dự phòng
        const localStorageKey = `round_${selectedSubRound}_promoted`;
        const moved = localStorage.getItem(localStorageKey) === "true";
        setFishAlreadyMoved(moved);
      }

      // Khôi phục trạng thái xử lý trước đó
      actionInProgressRef.current = wasInProgress;
    } catch (error) {
      console.error("Error in checkTransferredFish:", error);
    }
  }, [selectedSubRound, hasNextRoundId, cachedNextRoundId, fetchNextRound]);

  // Thêm hàm kiểm tra trạng thái chuyển cá từ server
  const checkPromotionFromServer = useCallback(async () => {
    if (!selectedSubRound) return;

    try {
      // Ưu tiên kiểm tra từ vòng tiếp theo bằng cách gọi hàm mới
      await checkTransferredFish();

      // Nếu không lấy được từ API, kiểm tra từ localStorage như giải pháp dự phòng
      if (!fishAlreadyMoved) {
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
      }
    } catch (error) {
      console.error("Error checking promotion status:", error);
    }
  }, [
    selectedSubRound,
    processedRounds,
    checkTransferredFish,
    fishAlreadyMoved,
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
      setAllPassingFish([]);
      setAllFishHaveResults(false);

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

  // Gọi checkTransferredFish khi giá trị selectedSubRound hoặc nextRound thay đổi
  useEffect(() => {
    if (selectedSubRound) {
      // Gọi checkTransferredFish bất kể có hasNextRoundId hay không
      // Hàm checkTransferredFish đã có kiểm tra bảo vệ bên trong
      checkTransferredFish();
    }
  }, [
    selectedSubRound,
    nextRound, // Phụ thuộc vào nextRound thay vì hasNextRoundId
    cachedNextRoundId,
    checkTransferredFish,
  ]);

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

  // Xác định trạng thái hiển thị nút - Cập nhật để yêu cầu tất cả cá đều có kết quả
  const shouldShowButton = useMemo(() => {
    // Phải có vòng được chọn và có cá đạt yêu cầu
    if (!selectedSubRound || !hasPassingRegistrations) {
      return false;
    }

    // Không hiển thị nút nếu vòng đã được xử lý thành công
    if (isCurrentRoundProcessed) {
      return false;
    }

    // Chỉ hiển thị nút khi tất cả cá đều đã có kết quả
    if (!allFishHaveResults) {
      return false;
    }

    return true;
  }, [
    selectedSubRound,
    hasPassingRegistrations,
    isCurrentRoundProcessed,
    allFishHaveResults,
  ]);

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

  // Cập nhật hàm handleMoveToNextRound để thêm lại việc lưu vào localStorage
  const handleMoveToNextRound = async () => {
    if (isCurrentRoundMoved) return;

    try {
      setIsMovingToNextRound(true);

      // Kiểm tra xem có cá nào pass để chuyển không
      if (allPassingFish.length === 0) {
        notification.warning({
          message: "Không có cá để chuyển",
          description:
            "Không có cá nào đạt yêu cầu để chuyển sang vòng tiếp theo.",
        });
        return;
      }

      // Gọi API để lấy thông tin vòng tiếp theo nếu chưa có
      let targetRoundId = cachedNextRoundId || hasNextRoundId;

      if (!targetRoundId) {
        const result = await fetchNextRound(selectedSubRound);
        targetRoundId = result?.data?.nextRoundId;
      }

      if (!targetRoundId) {
        throw new Error("Không tìm thấy thông tin vòng tiếp theo.");
      }

      const passingFishIds = allPassingFish
        .map((fish) => fish.registration?.id || fish.registrationId || fish.id)
        .filter((id) => id);

      const registrationResult = await assignToRound(
        targetRoundId,
        passingFishIds
      );

      if (registrationResult && registrationResult.success) {
        notification.success({
          message: "Thành công",
          description: `Đã chuyển ${passingFishIds.length} cá sang vòng tiếp theo.`,
        });

        // Lưu vào localStorage để không hiển thị lại
        const localStorageKey = `round_${selectedSubRound}_promoted`;
        localStorage.setItem(localStorageKey, "true");

        setProcessedRounds((prev) => {
          if (!prev.includes(selectedSubRound)) {
            return [...prev, selectedSubRound];
          }
          return prev;
        });

        setFishAlreadyMoved(true);

        if (
          onFishMoveStatusChange &&
          typeof onFishMoveStatusChange === "function"
        ) {
          onFishMoveStatusChange(true, noNextRound);
        }

        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
      }
    } catch (error) {
      console.error("Error moving fish to next round:", error);
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể chuyển cá sang vòng tiếp theo",
      });
    } finally {
      setIsMovingToNextRound(false);
    }
  };

  // Quyết định nội dung hiển thị dựa trên trạng thái
  let buttonContent;
  if (fishAlreadyMoved || isCurrentRoundMoved) {
    buttonContent = null;
  } else if (noNextRound) {
    buttonContent = (
      <Button
        type="default"
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
    );
  } else {
    buttonContent = (
      <Button
        onClick={handleMoveToNextRound}
        loading={isMovingToNextRound}
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
