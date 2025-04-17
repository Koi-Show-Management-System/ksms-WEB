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
  ConsoleSqlOutlined,
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
  roundStatus,
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

  // Thêm state để lưu trạng thái vòng hiện tại - sử dụng giá trị từ props nếu có
  const [currentRoundStatus, setCurrentRoundStatus] = useState(
    roundStatus || null
  );

  const { assignToRound } = useRegistration();
  // Lấy cả nextRound state từ hook useRound
  const { fetchNextRound, nextRound, fetchRound } = useRound();
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

  // Thêm state để lưu trữ thời điểm cuối cùng fetch tất cả cá pass
  const [lastFetchPassingFish, setLastFetchPassingFish] = useState(null);

  // Cập nhật hàm để fetch tất cả cá pass và sử dụng biến tham chiếu để tránh fetch nhiều lần
  const fetchAllPassingFishFromAllPages = useCallback(async () => {
    if (!selectedSubRound) return;

    try {
      // Đánh dấu đang tải dữ liệu
      setIsLoadingAllFish(true);

      // Gọi API lấy tất cả cá pass từ tất cả các trang
      const response = await fetchAllRegistrationRoundByStatus(
        selectedSubRound,
        "Pass"
      );

      let fishData = [];
      if (response && Array.isArray(response)) {
        fishData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        fishData = response.data;
      } else {
        console.error(
          "Invalid response format for all passing fish:",
          response
        );
        // Fallback: Sử dụng danh sách cá pass từ trang hiện tại
        fishData = passingFish;
      }

      setAllPassingFish(fishData);
      setLastFetchPassingFish(Date.now());
    } catch (error) {
      console.error("Error fetching all passing fish:", error);
      // Fallback: Sử dụng danh sách cá pass từ trang hiện tại
      setAllPassingFish(passingFish);
    } finally {
      setIsLoadingAllFish(false);
    }
  }, [selectedSubRound, fetchAllRegistrationRoundByStatus, passingFish]);

  // Cập nhật useEffect để gọi hàm fetch tất cả cá pass
  useEffect(() => {
    if (selectedSubRound) {
      fetchAllPassingFishFromAllPages();
    }
  }, [
    selectedSubRound,
    currentPage,
    pageSize,
    fetchAllPassingFishFromAllPages,
  ]);

  // Thêm useEffect để tự động refresh dữ liệu mỗi khi passingFish thay đổi
  useEffect(() => {
    // Nếu dữ liệu vừa được tải trong vòng 2 giây, không cần tải lại
    if (lastFetchPassingFish && Date.now() - lastFetchPassingFish < 2000) {
      return;
    }

    if (selectedSubRound && passingFish.length > 0) {
      // Dùng setTimeout để tránh quá nhiều request liên tiếp
      const timerId = setTimeout(() => {
        fetchAllPassingFishFromAllPages();
      }, 100);

      return () => clearTimeout(timerId);
    }
  }, [
    selectedSubRound,
    passingFish,
    fetchAllPassingFishFromAllPages,
    lastFetchPassingFish,
  ]);

  // Kiểm tra xem tất cả cá trong vòng thi đã có kết quả chưa
  useEffect(() => {
    const checkAllFishHaveResults = async () => {
      if (!selectedSubRound) return;

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
  }, [
    selectedSubRound,
    fetchAllRegistrationRound,
    registrationRound,
    currentPage,
  ]);

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

  // Thêm hàm kiểm tra trạng thái vòng
  const checkRoundStatus = useCallback(async () => {
    if (!selectedSubRound) return;

    // Nếu đã có roundStatus từ props, ưu tiên sử dụng
    if (roundStatus) {
      if (roundStatus === "completed") {
        setCurrentRoundStatus("completed");
        setFishAlreadyMoved(true);
        setProcessedRounds((prev) => {
          if (!prev.includes(selectedSubRound)) {
            return [...prev, selectedSubRound];
          }
          return prev;
        });
      } else {
        setCurrentRoundStatus(roundStatus);
      }
      return;
    }

    // Chỉ gọi fetchRound nếu không có roundStatus từ props
    try {
      const result = await fetchRound(selectedCategory, selectedRoundType);

      const roundData = Array.isArray(result)
        ? result.find((r) => r.id === selectedSubRound)
        : result;

      console.log("Status from API:", roundData?.status);

      const status = roundData?.status || null;

      if (status === "completed") {
        console.log("⭐ SETTING ROUND AS COMPLETED ⭐");
        setCurrentRoundStatus("completed");
        setFishAlreadyMoved(true);
        setProcessedRounds((prev) => {
          if (!prev.includes(selectedSubRound)) {
            return [...prev, selectedSubRound];
          }
          return prev;
        });
      } else {
        setCurrentRoundStatus(status);
      }
    } catch (error) {
      console.error("Error checking round status:", error);
    }
  }, [
    selectedSubRound,
    fetchRound,
    selectedCategory,
    selectedRoundType,
    roundStatus,
  ]);

  // Cập nhật hàm checkTransferredFish để không gây vòng lặp
  const checkTransferredFish = useCallback(async () => {
    if (!selectedSubRound) return;

    // Lấy giá trị currentRoundStatus hiện tại bằng Promise để tránh dependency cycle
    const roundStatusValue = await new Promise((resolve) => {
      // Sử dụng functional update để lấy giá trị state hiện tại
      setCurrentRoundStatus((current) => {
        resolve(current);
        return current;
      });
    });

    // Kiểm tra status trước - dùng biến cục bộ thay vì state để tránh dependency cycle
    const roundIsCompleted = roundStatusValue === "completed";

    // Nếu đã kiểm tra thấy vòng có trạng thái completed, không cần kiểm tra nữa
    if (roundIsCompleted) {
      setFishAlreadyMoved(true);
      return;
    }

    const nextRoundIdExists =
      typeof hasNextRoundId !== "undefined" && hasNextRoundId !== null;
    if (!nextRoundIdExists && !cachedNextRoundId) {
      // Không cần kiểm tra localStorage nữa
      setFishAlreadyMoved(false);
      return;
    }

    try {
      const wasInProgress = actionInProgressRef.current;
      actionInProgressRef.current = true;

      let targetRoundId = cachedNextRoundId || hasNextRoundId;

      if (!targetRoundId) {
        const result = await fetchNextRound(selectedSubRound);
        targetRoundId = result?.data?.nextRoundId;
        if (targetRoundId) {
          setCachedNextRoundId(targetRoundId);
        }
      }

      if (!targetRoundId) {
        setFishAlreadyMoved(false);
        return;
      }

      try {
        const response = await axios.get(
          `/api/rounds/${targetRoundId}/registrations`
        );

        if (response.data && Array.isArray(response.data)) {
          const fishFromCurrentRound = response.data.filter(
            (item) =>
              item.previousRoundId === selectedSubRound ||
              item.previousRound?.id === selectedSubRound
          );

          if (fishFromCurrentRound.length > 0) {
            setTransferredFishCount(fishFromCurrentRound.length);
            setFishAlreadyMoved(true);

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
        setFishAlreadyMoved(false);
      }

      actionInProgressRef.current = wasInProgress;
    } catch (error) {
      console.error("Error in checkTransferredFish:", error);
    }
  }, [selectedSubRound, hasNextRoundId, cachedNextRoundId, fetchNextRound]);

  // Cập nhật hàm checkPromotionFromServer để không sử dụng localStorage
  const checkPromotionFromServer = useCallback(async () => {
    if (!selectedSubRound) return;

    try {
      // Kiểm tra trạng thái vòng trước
      await checkRoundStatus();

      // Kiểm tra trạng thái cục bộ sau khi gọi checkRoundStatus
      const roundIsCompleted = currentRoundStatus === "completed";

      // Nếu vòng đã có trạng thái completed, không cần kiểm tra chuyển cá
      if (roundIsCompleted) {
        setFishAlreadyMoved(true);
        setProcessedRounds((prev) => {
          if (!prev.includes(selectedSubRound)) {
            return [...prev, selectedSubRound];
          }
          return prev;
        });
        return;
      }

      // Ưu tiên kiểm tra từ vòng tiếp theo bằng cách gọi hàm mới
      await checkTransferredFish();

      // Lấy giá trị hiện tại từ state thay vì sử dụng biến state trong dependency
      const isFishMoved = await new Promise((resolve) => {
        // Sử dụng functional update để lấy giá trị state hiện tại
        setFishAlreadyMoved((current) => {
          resolve(current);
          return current;
        });
      });
    } catch (error) {
      console.error("Error checking promotion status:", error);
    }
  }, [
    selectedSubRound,
    processedRounds,
    checkTransferredFish,
    checkRoundStatus,
  ]);

  // Cập nhật useEffect để kiểm tra trạng thái vòng
  useEffect(() => {
    if (selectedSubRound) {
      checkRoundStatus();
    }
  }, [selectedSubRound, checkRoundStatus]);

  // Cập nhật useEffect để kiểm tra cá đã chuyển
  useEffect(() => {
    if (selectedSubRound && !currentRoundStatus) {
      // Chỉ gọi khi chưa có currentRoundStatus
      checkTransferredFish();
    }
  }, [selectedSubRound, checkTransferredFish, currentRoundStatus]);

  // Cập nhật useEffect để kiểm tra từ server
  useEffect(() => {
    if (selectedSubRound) {
      // Sử dụng setTimeout để tránh vòng lặp vô hạn
      const timer = setTimeout(() => {
        checkPromotionFromServer();
      }, 100);
      return () => clearTimeout(timer);
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

  // Cập nhật prefetchNextRound
  const prefetchNextRound = useCallback(async () => {
    if (!selectedSubRound || isPrefetching) return;

    // Thêm tham chiếu trạng thái để tránh race condition
    const currentIsPrefetching = await new Promise((resolve) => {
      setIsPrefetching((current) => {
        resolve(current);
        return true; // Luôn đặt thành true khi bắt đầu fetch
      });
    });

    if (currentIsPrefetching) return;

    try {
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
  }, [selectedSubRound, fetchNextRound]); // Loại bỏ isPrefetching từ dependencies

  // Cập nhật useEffect cho prefetchNextRound
  useEffect(() => {
    const shouldPrefetch =
      selectedSubRound &&
      allPassingFish.length > 0 &&
      !cachedNextRoundId &&
      !isPrefetching &&
      (!lastPrefetch || Date.now() - lastPrefetch > 60000);

    if (shouldPrefetch) {
      // Sử dụng setTimeout để tránh lặp
      const timer = setTimeout(() => {
        prefetchNextRound();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    selectedSubRound,
    allPassingFish.length,
    cachedNextRoundId,
    isPrefetching,
    lastPrefetch,
    prefetchNextRound,
  ]);

  // Cập nhật shouldShowButton để sử dụng callback tốt hơn
  const shouldShowButton = useMemo(() => {
    if (selectedSubRound && roundStatus === "completed") {
      return false;
    }

    // Lấy giá trị hiện tại của currentRoundStatus trong closure để tránh dependency cycle
    const isRoundCompleted = currentRoundStatus === "completed";

    // Phải có vòng được chọn và có cá đạt yêu cầu
    if (!selectedSubRound || !hasPassingRegistrations) {
      return false;
    }

    // Không hiển thị nút nếu vòng đã được xử lý thành công
    if (isCurrentRoundProcessed) {
      return false;
    }

    // Không hiển thị nút nếu vòng đã hoàn thành (status = completed)
    if (isRoundCompleted) {
      return false;
    }

    // Chỉ hiển thị nút khi tất cả cá đều đã có kết quả
    if (!allFishHaveResults) {
      console.log("🚫 HIDING BUTTON: Not all fish have results");
      return false;
    }

    return true;
  }, [
    roundStatus,
    selectedSubRound,
    hasPassingRegistrations,
    isCurrentRoundProcessed,
    allFishHaveResults,
    // currentRoundStatus đã được sử dụng trong closure
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

  // Kiểm tra và cập nhật trạng thái ban đầu
  useEffect(() => {
    if (selectedSubRound) {
      // Kiểm tra từ state thay vì localStorage
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
      // Sử dụng setTimeout để trì hoãn một chút, tránh việc kích hoạt quá nhiều lần
      const timerId = setTimeout(() => {
        onFishMoveStatusChange(fishAlreadyMoved, noNextRound);
      }, 0);

      return () => clearTimeout(timerId);
    }
  }, [fishAlreadyMoved, noNextRound, onFishMoveStatusChange]);

  // Cập nhật hàm handleMoveToNextRound để không sử dụng localStorage
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

      // Đảm bảo truyền selectedSubRound như currentRoundId
      const registrationResult = await assignToRound(
        targetRoundId,
        passingFishIds,
        selectedSubRound, // currentRoundId là vòng hiện tại
        currentPage,
        pageSize
      );

      if (registrationResult && registrationResult.success) {
        notification.success({
          message: "Thành công",
          description: `Đã chuyển ${passingFishIds.length} cá sang vòng tiếp theo.`,
        });

        // Cập nhật trạng thái vòng hiện tại thành "completed"
        setCurrentRoundStatus("completed");

        // Cập nhật state để ẩn nút
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

        // Refresh dữ liệu để cập nhật UI
        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
        // Tải lại tất cả dữ liệu sau khi chuyển cá thành công
        setTimeout(() => {
          fetchAllPassingFishFromAllPages();
        }, 1000);
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
        loading={isMovingToNextRound || isLoadingAllFish}
        style={{
          backgroundColor: "#52c41a",
          color: "white",
          borderColor: "#52c41a",
          width: "100%",
        }}
      >
        Chuyển {isLoadingAllFish ? "..." : allPassingFish.length} cá sang vòng
        tiếp theo
      </Button>
    );
  }

  // Thêm useEffect để cập nhật currentRoundStatus khi prop roundStatus thay đổi
  useEffect(() => {
    if (roundStatus) {
      setCurrentRoundStatus(roundStatus);

      // Nếu status là completed, cập nhật trạng thái đã chuyển cá
      if (roundStatus === "completed") {
        setFishAlreadyMoved(true);
        setProcessedRounds((prev) => {
          if (!prev.includes(selectedSubRound)) {
            return [...prev, selectedSubRound];
          }
          return prev;
        });
      }
    }
  }, [roundStatus, selectedSubRound]);

  return buttonContent;
}

export default NextRound;
