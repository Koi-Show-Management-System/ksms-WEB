import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Table,
  Tag,
  Select,
  Row,
  Col,
  Spin,
  Empty,
  Image,
  Card,
  notification,
  Button,
  Typography,
  Space,
  Drawer,
  Descriptions,
  Tabs,
  List,
  Divider,
  Skeleton,
  Collapse,
  message,
  Modal,
  Steps,
} from "antd";
import {
  EyeOutlined,
  FileImageOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  QrcodeOutlined,
  PercentageOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  AimOutlined,
} from "@ant-design/icons";
import useCategory from "../../../../hooks/useCategory";
import useRound from "../../../../hooks/useRound";
import useRegistrationRound from "../../../../hooks/useRegistrationRound";
import useTank from "../../../../hooks/useTank";
import useCriteria from "../../../../hooks/useCriteria";
import useScore from "../../../../hooks/useScore";
import { getEvaluationColumns } from "./EvaluationColumns";
import { getFinalColumns } from "./FinalColumns";
import useRoundResult from "../../../../hooks/useRoundResult";
import NextRound from "./NextRound";
import { Loading } from "../../../../components";

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Step } = Steps;

const roundTypes = ["Preliminary", "Evaluation", "Final"];
const roundTypeLabels = {
  Preliminary: "Vòng Sơ Khảo",
  Evaluation: "Vòng Đánh Giá Chính",
  Final: "Vòng Chung Kết",
};

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

function CompetitionRound({ showId }) {
  // Tracking mount state to prevent updates after unmount
  const isMounted = useRef(true);
  // Add this ref at the top of your component with other refs
  const previousRegistrationRoundRef = useRef(null);
  // Ref to store previous selected sub round
  const prevSelectedSubRoundRef = useRef(null);

  // Category state
  const { categories, fetchCategories } = useCategory();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Round state
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const { round, fetchRound, isLoading: roundLoading } = useRound();

  // Current step state for the Steps component
  const [currentStep, setCurrentStep] = useState(0);

  // Add state to track if publish was requested
  const [publishRequested, setPublishRequested] = useState(false);

  // State to track if fish have been moved to next round
  const [fishMoved, setFishMoved] = useState(false);
  const [isNoNextRound, setIsNoNextRound] = useState(false);

  // Registration and tank states
  const {
    registrationRound,
    fetchRegistrationRound: originalFetchRegistrationRound,
    updateFishTankInRound: originalUpdateFishTankInRound,
    isLoading: registrationLoading,
    totalItems: registrationTotalItems,
    currentPage,
    pageSize,
    totalPages,
  } = useRegistrationRound();

  const { competitionRoundTanks, fetchTanks } = useTank();
  const { updatePublishRound } = useRegistrationRound();
  const [loadingImages, setLoadingImages] = useState({});
  const [assigningTank, setAssigningTank] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);

  // Replace modal state with drawer state
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState(null);

  // Add state to check if all tanks are assigned - FIX THE INFINITE LOOP
  const allTanksAssigned = useMemo(() => {
    if (
      !selectedSubRound ||
      !Array.isArray(registrationRound) ||
      registrationRound.length === 0
    ) {
      return false;
    }

    // Kiểm tra mỗi đăng ký có tankName hoặc tankId
    return registrationRound.every((item) =>
      Boolean(item.tankName || item.tankId)
    );
  }, [registrationRound, selectedSubRound]);

  // Update the logic to hide the button only when ALL items are published
  const isRoundPublished = useCallback(() => {
    if (
      !selectedSubRound ||
      !Array.isArray(registrationRound) ||
      registrationRound.length === 0
    ) {
      return false;
    }

    // Only consider the round fully published when ALL items are published
    // If even one item is not published, the button should remain visible
    return registrationRound.every((item) => item.status === "public");
  }, [registrationRound, selectedSubRound]);

  // Add criteria state
  const {
    criteriaCompetitionRound,
    fetchCriteriaCompetitionRound,
    resetCriteriaCompetitionRound,
    isLoading: criteriaLoading,
  } = useCriteria();

  // Modify imports and state management for scores
  const {
    fetchScoreDetail,
    scoreDataDetail,
    isLoading: scoreDetailLoading,
  } = useScore();

  // Thêm hook useRoundResult
  const {
    createRoundResultFinalize,
    updateRoundResult,
    isLoading: roundResultLoading,
  } = useRoundResult();

  // Add a check to see if all entries already have scores
  const allEntriesHaveScores = useMemo(() => {
    if (!Array.isArray(registrationRound) || registrationRound.length === 0) {
      return false;
    }

    // Check if every registration has a score in roundResults
    return registrationRound.every(
      (item) =>
        item.roundResults &&
        item.roundResults.length > 0 &&
        item.roundResults[0]?.totalScore !== undefined &&
        item.roundResults[0]?.totalScore !== null
    );
  }, [registrationRound]);

  // Add state to track if results are published
  const [areResultsPublished, setAreResultsPublished] = useState(false);

  // Add isPublishingScores state
  const [isPublishingScores, setIsPublishingScores] = useState(false);

  // Fix the problematic isRoundScorePublished function
  const isRoundScorePublished = useCallback(
    (roundId) => {
      if (!Array.isArray(registrationRound) || registrationRound.length === 0) {
        return false;
      }

      // Kiểm tra từ dữ liệu API thay vì localStorage
      return registrationRound.every(
        (item) =>
          item.roundResults &&
          item.roundResults.length > 0 &&
          item.roundResults[0]?.isPublic === true
      );
    },
    [registrationRound]
  );

  // Safe API wrappers to prevent undefined calls
  const fetchRegistrationRound = useCallback(
    (roundId, page, size) => {
      if (!isMounted.current) return Promise.resolve(null);

      if (!roundId || roundId === "undefined" || typeof roundId !== "string") {
        console.warn("[fetchRegistrationRound] Invalid roundId:", roundId);
        return Promise.resolve(null);
      }

      return originalFetchRegistrationRound(roundId, page, size);
    },
    [originalFetchRegistrationRound]
  );

  const updateFishTankInRound = useCallback(
    (registrationRoundId, tankId) => {
      if (!isMounted.current) return Promise.resolve(null);

      if (!registrationRoundId || registrationRoundId === "undefined") {
        console.warn(
          "[updateFishTankInRound] Invalid registrationRoundId:",
          registrationRoundId
        );
        return Promise.resolve(null);
      }

      return originalUpdateFishTankInRound(registrationRoundId, tankId);
    },
    [originalUpdateFishTankInRound]
  );

  // Lifecycle management
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch categories when component mounts
  useEffect(() => {
    if (showId) {
      fetchCategories(showId);
    }
  }, [fetchCategories, showId]);

  // Handle category selection
  const handleCategoryChange = useCallback(
    (value) => {
      // Reset dependent selections
      setSelectedRoundType(null);
      setSelectedSubRound(null);
      setSelectedCategory(value);

      // Reset publishRequested state when changing category
      setPublishRequested(false);

      if (value) {
        fetchTanks(value, 1, 100, true);
        // Log ra giá trị hasTank để kiểm tra
        const selectedCategoryData = categories?.find((c) => c.id === value);
      }
    },
    [fetchTanks, categories]
  );

  // Handle round type selection
  const handleRoundTypeChange = useCallback(
    (value) => {
      // Reset sub-round
      setSelectedSubRound(null);
      setSelectedRoundType(value);

      // Reset publishRequested state when changing round type
      setPublishRequested(false);

      // Clear previous criteria when changing round type
      resetCriteriaCompetitionRound();

      if (selectedCategory && value) {
        fetchRound(selectedCategory, value);
      }
    },
    [selectedCategory, fetchRound, resetCriteriaCompetitionRound]
  );

  // Fix the handleSubRoundChange function to avoid the circular dependency
  const handleSubRoundChange = useCallback(
    (value) => {
      // Validate the value
      if (value === "undefined" || value === undefined) {
        console.warn("[SubRound] Received invalid value, setting to null");
        value = null;
      }

      // Only update state if the value has actually changed
      if (value !== selectedSubRound) {
        // Reset fishMoved state when changing rounds
        setFishMoved(false);

        // Reset publishRequested state when changing rounds
        setPublishRequested(false);

        // First set the selected sub round
        setSelectedSubRound(value);

        // Only fetch if we have a valid value
        if (value && typeof value === "string" && value !== "undefined") {
          // Tìm vòng đã chọn trong danh sách round hiện có
          const selectedRound =
            round && Array.isArray(round)
              ? round.find((r) => r.id === value)
              : null;

          // Wrap in try/catch to prevent any unhandled rejection errors
          try {
            // Fetch registration data - store the promise but don't chain state updates here
            const fetchPromise = fetchRegistrationRound(value, 1, pageSize);

            // Handle the data separately to avoid tight coupling of state updates
            fetchPromise
              .then((data) => {
                // Only update state if component is still mounted and we should update
                if (isMounted.current && Array.isArray(data)) {
                  const allScoresPublished = data.every(
                    (item) =>
                      item.roundResults &&
                      item.roundResults.length > 0 &&
                      item.roundResults[0]?.isPublic === true
                  );

                  // Compare with current state before updating to prevent unnecessary renders
                  if (allScoresPublished !== areResultsPublished) {
                    setAreResultsPublished((prevState) => {
                      // Only update if the value has changed
                      if (allScoresPublished !== prevState) {
                        return allScoresPublished;
                      }
                      return prevState;
                    });
                  }
                }
              })
              .catch((err) => {
                console.error(
                  "[handleSubRoundChange] Error fetching registration data:",
                  err
                );
              });
          } catch (error) {
            console.error("[handleSubRoundChange] Error:", error);
          }

          // Only fetch criteria if needed - separate from the registration data fetch
          try {
            if (
              (selectedRoundType === "Evaluation" ||
                selectedRoundType === "Final") &&
              selectedCategory
            ) {
              fetchCriteriaCompetitionRound(selectedCategory, value);
            }
          } catch (error) {
            console.error(
              "[handleSubRoundChange] Error fetching criteria:",
              error
            );
          }
        }
      }
    },
    [
      fetchRegistrationRound,
      pageSize,
      selectedRoundType,
      selectedCategory,
      fetchCriteriaCompetitionRound,
      selectedSubRound,
      areResultsPublished, // Include this in dependencies to properly compare current value
      isMounted,
      round,
      setPublishRequested, // Add setPublishRequested to dependencies
      setFishMoved,
    ]
  );

  // Fix the problematic useEffect that was also updating areResultsPublished
  // Use a ref to track changes instead of depending on the state variable
  useEffect(() => {
    // Skip if no data
    if (!registrationRound || registrationRound.length === 0) return;

    // Only update if the data has actually changed
    if (registrationRound === previousRegistrationRoundRef.current) return;

    // Calculate whether all items are published
    const allPublished = registrationRound.every(
      (item) =>
        item.roundResults &&
        item.roundResults.length > 0 &&
        item.roundResults[0]?.isPublic === true
    );

    // Update state ONLY if the value has changed
    setAreResultsPublished((prevState) => {
      if (allPublished !== prevState) {
        return allPublished;
      }
      return prevState;
    });

    // Update ref to prevent unnecessary updates
    previousRegistrationRoundRef.current = registrationRound;
  }, [registrationRound]);

  // Update this when selectedRoundType changes to fetch criteria
  useEffect(() => {
    if (
      (selectedRoundType === "Evaluation" || selectedRoundType === "Final") &&
      selectedCategory &&
      selectedSubRound &&
      selectedSubRound !== "undefined" &&
      isMounted.current
    ) {
      fetchCriteriaCompetitionRound(selectedCategory, selectedSubRound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoundType, selectedCategory, selectedSubRound]);

  // Handle pagination
  const handleTableChange = useCallback(
    (pagination) => {
      if (
        selectedSubRound &&
        typeof selectedSubRound === "string" &&
        selectedSubRound !== "undefined"
      ) {
        fetchRegistrationRound(
          selectedSubRound,
          pagination.current || 1,
          pagination.pageSize || 10
        );
      } else {
        console.warn(
          "[Pagination] Skipping fetch due to invalid selectedSubRound:",
          selectedSubRound
        );
      }
    },
    [selectedSubRound, fetchRegistrationRound]
  );

  // Handle tank assignment
  const handleTankAssignment = useCallback(
    async (registrationRoundId, tankId) => {
      if (!registrationRoundId) {
        console.warn("[TankAssign] Missing registrationRoundId");
        return;
      }

      try {
        setAssigningTank((prev) => ({ ...prev, [registrationRoundId]: true }));

        const result = await updateFishTankInRound(registrationRoundId, tankId);

        if (result?.success) {
          // Only refetch if we have a valid selectedSubRound
          if (
            selectedSubRound &&
            typeof selectedSubRound === "string" &&
            selectedSubRound !== "undefined"
          ) {
            fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
          } else {
            console.warn(
              "[TankAssign] Skipping refetch due to invalid selectedSubRound:",
              selectedSubRound
            );
          }
        }
      } catch (error) {
        console.error("[TankAssign] Error:", error);
      } finally {
        setAssigningTank((prev) => ({ ...prev, [registrationRoundId]: false }));
      }
    },
    [
      selectedSubRound,
      currentPage,
      pageSize,
      fetchRegistrationRound,
      updateFishTankInRound,
    ]
  );

  // Image handling functions
  const handleImageLoad = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  const handleImageLoadStart = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleImageError = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  // Modify the showCategoryDetail function to fetch score details
  const showCategoryDetail = useCallback(
    async (record) => {
      setCurrentRegistration(record);
      setIsDetailDrawerVisible(true);

      // Fetch score details if we have a registration round ID
      if (record?.id) {
        try {
          const result = await fetchScoreDetail(record.id);
          console.log("Score details fetched:", result);
          console.log("Current scoreDataDetail in store:", scoreDataDetail);
        } catch (error) {
          console.error("Error fetching score details:", error);
        }
      }
    },
    [fetchScoreDetail, scoreDataDetail]
  );

  const handleDrawerClose = () => {
    setIsDetailDrawerVisible(false);
  };

  // Cập nhật phần displayData để tính toán thứ hạng dựa trên điểm số
  const displayData = useMemo(() => {
    if (
      !registrationLoading &&
      selectedSubRound &&
      Array.isArray(registrationRound)
    ) {
      // Create array with index
      const dataWithIndex = registrationRound.map((item, index) => ({
        ...item,
        key: item.id || `registration-${index}`,
        index: index + 1 + (currentPage - 1) * pageSize,
      }));

      // Sort by total score first (descending order - higher scores first)
      const sortedData = dataWithIndex.sort((a, b) => {
        // First sort by total score if available (for Evaluation and Final rounds)
        const scoreA =
          a.roundResults && a.roundResults[0]?.totalScore !== undefined
            ? Number(a.roundResults[0]?.totalScore)
            : -1;
        const scoreB =
          b.roundResults && b.roundResults[0]?.totalScore !== undefined
            ? Number(b.roundResults[0]?.totalScore)
            : -1;

        // If both have scores, sort by score (descending)
        if (scoreA >= 0 && scoreB >= 0) {
          return scoreB - scoreA; // Higher scores first
        }

        // If one has a score and the other doesn't, prioritize the one with a score
        if (scoreA >= 0 && scoreB < 0) return -1;
        if (scoreA < 0 && scoreB >= 0) return 1;

        // If neither has scores, fall back to registration number for consistent sorting
        const regNumA = a.registration?.registrationNumber || "";
        const regNumB = b.registration?.registrationNumber || "";
        return regNumA.localeCompare(regNumB);
      });

      return sortedData;
    }
    return [];
  }, [
    registrationRound,
    currentPage,
    pageSize,
    registrationLoading,
    selectedSubRound,
  ]);

  // Kiểm tra xem hạng mục hiện tại có sử dụng bể không
  const currentCategoryHasTank = useMemo(() => {
    const selectedCategoryData = categories?.find(
      (c) => c.id === selectedCategory
    );
    return selectedCategoryData?.hasTank || false;
  }, [categories, selectedCategory]);

  // Cập nhật hàm kiểm tra nếu có thể công khai vòng thi
  const canPublishRound = useMemo(() => {
    // Nếu hạng mục không sử dụng bể, có thể công khai ngay
    if (!currentCategoryHasTank) {
      return true;
    }

    // Nếu hạng mục có sử dụng bể, phải kiểm tra tất cả cá đã được gán bể chưa
    return allTanksAssigned;
  }, [currentCategoryHasTank, allTanksAssigned]);

  // Handle publishing round - Make sure it doesn't trigger on render
  const handlePublishRound = useCallback(async () => {
    if (!selectedSubRound) {
      notification.warning({
        message: "Thông báo",
        description: "Vui lòng chọn vòng thi trước khi công khai",
      });
      return;
    }

    // Kiểm tra chi tiết và log
    console.log("Kiểm tra công khai vòng thi:", {
      currentCategoryHasTank,
      allTanksAssigned,
      canPublishRound,
    });

    // Kiểm tra điều kiện dựa vào trạng thái hạng mục có bể hay không
    if (currentCategoryHasTank && !allTanksAssigned) {
      notification.warning({
        message: "Cần gán bể cho tất cả",
        description:
          "Vui lòng gán bể cho tất cả các cá trước khi công khai vòng thi.",
      });
      return;
    }

    try {
      setIsPublishing(true);

      // Apply optimistic update to hide button immediately
      // Create a temporary copy with all items set to "public"
      if (Array.isArray(registrationRound) && registrationRound.length > 0) {
        const optimisticData = registrationRound.map((item) => ({
          ...item,
          status: "public",
        }));
        // Force re-render to hide button immediately
        previousRegistrationRoundRef.current = [...optimisticData];
      }

      const result = await updatePublishRound(selectedSubRound);

      if (result?.success) {
        // Chỉ set publishRequested thành true khi đã thành công
        setPublishRequested(true);

        notification.success({
          message: "Thành công",
          description: "Đã công khai vòng thi thành công",
        });

        // Refresh data - ONLY if component is still mounted
        if (isMounted.current) {
          fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
        }
      }
    } catch (error) {
      console.error("[PublishRound] Error:", error);
      // Revert optimistic update if there was an error and reset publish requested state
      previousRegistrationRoundRef.current = null;
      setPublishRequested(false);
      if (isMounted.current) {
        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
      }
    } finally {
      if (isMounted.current) {
        setIsPublishing(false);
      }
    }
  }, [
    selectedSubRound,
    currentCategoryHasTank,
    allTanksAssigned,
    canPublishRound,
    updatePublishRound,
    fetchRegistrationRound,
    currentPage,
    pageSize,
    registrationRound,
  ]);

  // Cập nhật xử lý lỗi trong hàm handleCreateFinalScore
  const handleCreateFinalScore = async () => {
    if (!selectedSubRound) {
      notification.error({
        message: "Lỗi",
        description: "Không thể tạo điểm cuối cùng. Thiếu thông tin vòng thi.",
      });
      return;
    }

    try {
      setIsPublishing(true);
      const result = await createRoundResultFinalize(selectedSubRound);

      // Xử lý trường hợp thành công
      if (
        result?.statusCode === 200 ||
        result?.statusCode === 201 ||
        result?.status === 200 ||
        result?.status === 201 ||
        (result?.message && result?.message.includes("success"))
      ) {
        notification.success({
          message: "Thành công",
          description:
            result?.message || "Đã tạo điểm cuối cùng cho vòng thi thành công",
        });

        // Tải lại dữ liệu
        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
      } else {
        // Kiểm tra notificationType để hiển thị đúng kiểu thông báo
        if (result?.notificationType === "warning") {
          notification.warning({
            message: "Cảnh báo",
            description: result?.message || "Không thể tạo điểm cuối cùng",
          });
        } else {
          // Mặc định là error
          notification.error({
            message: "Lỗi",
            description: result?.message || "Không thể tạo điểm cuối cùng",
          });
        }
      }
    } catch (error) {
      console.error("Error creating final score:", error);

      // Kiểm tra mã lỗi 400 và hiển thị thông báo tương ứng
      if (error.response && error.response.status === 400) {
        notification.error({
          message: "Không thể tạo điểm cuối cùng",
          description:
            "Chưa có dữ liệu điểm số nào để xử lý. Vui lòng đảm bảo đã có điểm trọng tài trước khi tạo điểm cuối cùng.",
        });
        return;
      }

      // Xử lý đặc biệt: lỗi nhưng thực tế là thành công (status 201)
      if (error.response && error.response.status === 201) {
        notification.success({
          message: "Thành công",
          description:
            error.response.data.message ||
            "Đã tạo điểm cuối cùng cho vòng thi thành công",
        });
        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
        return;
      }

      // Hiển thị thông báo lỗi chung
      notification.error({
        message: "Lỗi",
        description: "Không thể tạo điểm cuối cùng",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Stabilize the fetchTanks effect
  useEffect(() => {
    if (selectedCategory && isMounted.current) {
      // Store the category in a ref to avoid refetching on unmount
      const currentCategory = selectedCategory;
      fetchTanks(currentCategory, 1, 100, true);
    }
    // Only depend on selectedCategory, not fetchTanks which might change
  }, [selectedCategory, fetchTanks]);

  // Create a component to display criteria above the table
  const CriteriaDisplay = useCallback(() => {
    return (
      <div className="mb-4">
        <Row gutter={[16, 8]}>
          {criteriaCompetitionRound.map((criteriaItem, index) => {
            // Handle different possible data structures
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
                <Card size="small" className="h-full">
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
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }, [criteriaCompetitionRound]);

  // Cập nhật ScoreDetailsTab để thêm nút tạo điểm cuối cùng
  const ScoreDetailsTab = () => {
    console.log("Rendering ScoreDetailsTab with data:", scoreDataDetail);

    // Check if it's a preliminary round and return early with a message
    if (selectedRoundType === "Preliminary") {
      return (
        <Empty description="Vòng sơ khảo chỉ có kết quả đạt hoặc không đạt" />
      );
    }

    if (scoreDetailLoading) {
      return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    if (!scoreDataDetail) {
      return <Empty description="Chưa có thông tin chấm điểm" />;
    }

    // Handle both array and object with data property
    const scores = Array.isArray(scoreDataDetail)
      ? scoreDataDetail
      : scoreDataDetail.data || [];

    if (scores.length === 0) {
      return <Empty description="Chưa có thông tin chấm điểm" />;
    }

    return (
      <div>
        <Collapse>
          {scores.map((scoreItem, index) => {
            const initialScore = Number(scoreItem.initialScore || 100);
            const totalPointMinus = Number(scoreItem.totalPointMinus || 0);
            const finalScore = initialScore - totalPointMinus;
            const refereeName =
              scoreItem.refereeAccount?.fullName ||
              scoreItem.refereeAccount?.username ||
              "Không xác định";
            const scoreDate = new Date(scoreItem.createdAt).toLocaleString(
              "vi-VN",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }
            );
            const comments = scoreItem.comments || "";

            return (
              <Collapse.Panel
                key={scoreItem.id || `score-${index}`}
                header={
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                      <Typography.Text strong>
                        <TrophyOutlined className="mr-2" />
                        Trọng tài: {refereeName}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="ml-4">
                        {scoreDate}
                      </Typography.Text>
                    </div>
                    <Tag
                      color={
                        finalScore >= 70
                          ? "green"
                          : finalScore >= 50
                            ? "orange"
                            : "red"
                      }
                      className="text-base px-3 "
                    >
                      <b>{finalScore.toFixed(1)}</b>
                    </Tag>
                  </div>
                }
              >
                <div>
                  <Card
                    className="mb-4 text-center bg-gray-50"
                    bordered={false}
                  >
                    <Row gutter={[16, 16]} align="middle" justify="center">
                      <Col span={8}>
                        <Typography.Title level={5}>
                          Điểm ban đầu
                        </Typography.Title>
                        <Typography.Title
                          level={3}
                          style={{ color: "#1890ff" }}
                        >
                          {initialScore.toFixed(1)}
                        </Typography.Title>
                      </Col>
                      <Col span={8}>
                        <Typography.Title level={5}>Điểm trừ</Typography.Title>
                        <Typography.Title
                          level={3}
                          style={{ color: "#f5222d" }}
                        >
                          -{totalPointMinus.toFixed(1)}
                        </Typography.Title>
                      </Col>
                      <Col span={8}>
                        <Typography.Title level={5}>
                          Điểm cuối cùng
                        </Typography.Title>
                        <Typography.Title
                          level={2}
                          style={{ color: "#52c41a" }}
                        >
                          {finalScore.toFixed(1)}
                        </Typography.Title>
                      </Col>
                    </Row>
                    <Divider style={{ margin: "12px 0" }} />
                    <Row>
                      <Col span={24}>
                        <div className="flex ">
                          <Typography.Text
                            strong
                            style={{ minWidth: "70px", marginRight: "8px" }}
                          >
                            Ghi chú:
                          </Typography.Text>
                          <Typography.Text>
                            {comments || "Không có ghi chú"}
                          </Typography.Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  {scoreItem.criteriaWithErrors &&
                  scoreItem.criteriaWithErrors.length > 0 ? (
                    <div className="mt-4">
                      {scoreItem.criteriaWithErrors.map((criteria) => {
                        const hasErrors =
                          criteria.errors && criteria.errors.length > 0;
                        const totalCriteriaDeduction = hasErrors
                          ? criteria.errors.reduce(
                              (sum, err) => sum + (err.pointMinus || 0),
                              0
                            )
                          : 0;

                        return (
                          <div key={criteria.id} className="mb-4 border-b ">
                            <Collapse>
                              <Collapse.Panel
                                header={
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center">
                                      <Typography.Text strong className="mr-2">
                                        {criteria.name}
                                      </Typography.Text>
                                      <Tag color="blue">
                                        {(criteria.weight * 100).toFixed(0)}%
                                      </Tag>
                                    </div>
                                    {hasErrors && (
                                      <Tag color="red">
                                        -{totalCriteriaDeduction} điểm
                                      </Tag>
                                    )}
                                  </div>
                                }
                              >
                                {hasErrors ? (
                                  criteria.errors.map((error, idx) => {
                                    const severityColor =
                                      error.severity === "eb"
                                        ? "red"
                                        : error.severity === "mb"
                                          ? "orange"
                                          : "blue";
                                    const severityText =
                                      error.severity === "eb"
                                        ? "Nặng"
                                        : error.severity === "mb"
                                          ? "Trung bình"
                                          : "Nhẹ";

                                    // Thêm phần trăm vào text hiển thị
                                    const displayText = error.weight
                                      ? `${severityText} (${(error.weight * 100).toFixed(0)}%)`
                                      : severityText;

                                    return (
                                      <div
                                        key={error.id || idx}
                                        className="mb-3 p-3 border rounded-md"
                                      >
                                        <div className="flex flex-col">
                                          <div className="mb-1">
                                            <Typography.Text strong>
                                              Lỗi: {error.errorTypeName}
                                            </Typography.Text>
                                          </div>
                                          <div className="mb-1">
                                            <Typography.Text>
                                              Mức độ:{" "}
                                              <Tag color={severityColor}>
                                                {displayText}
                                              </Tag>
                                            </Typography.Text>
                                          </div>
                                          <div>
                                            <Typography.Text>
                                              Điểm trừ:{" "}
                                              <span className="text-red-500">
                                                -{error.pointMinus} điểm
                                              </span>
                                            </Typography.Text>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <Typography.Text
                                    type="success"
                                    className="block py-2"
                                  >
                                    Không có lỗi ở tiêu chí này
                                  </Typography.Text>
                                )}
                              </Collapse.Panel>
                            </Collapse>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty description="Không có chi tiết đánh giá" />
                  )}
                </div>
              </Collapse.Panel>
            );
          })}
        </Collapse>
      </div>
    );
  };

  // Update the getColumnsForRoundType function to use our new component
  const getColumnsForRoundType = useMemo(() => {
    // For Final Round
    if (selectedRoundType === "Final") {
      return getFinalColumns({
        handleViewDetails: showCategoryDetail,
        loadingImages,
        allTanksAssigned,
        isRoundPublished: isRoundScorePublished,
        assigningTank,
        competitionRoundTanks,
        handleTankChange: handleTankAssignment,
        criteria: criteriaCompetitionRound, // Pass criteria to Final round too
        hasTank: currentCategoryHasTank, // Thêm tham số hasTank
      });
    }
    // For Evaluation Round (existing code)
    else if (selectedRoundType === "Evaluation") {
      return getEvaluationColumns({
        handleViewDetails: showCategoryDetail,
        loadingImages,
        allTanksAssigned,
        isRoundPublished: isRoundScorePublished,
        assigningTank,
        competitionRoundTanks,
        handleTankChange: handleTankAssignment,
        criteria: criteriaCompetitionRound, // Pass criteria from API
        hasTank: currentCategoryHasTank, // Thêm tham số hasTank
      });
    }
    // Default columns for Preliminary Round (existing code)
    const baseColumns = [
      {
        title: "Top",
        dataIndex: ["rank"],
        width: 60,
        render: (rank) => (
          <span style={{ color: "blue", fontWeight: "bold" }}>
            {rank ? `#${rank}` : "_"}
          </span>
        ),
        sorter: (a, b) => {
          // Handle null/undefined values for sorting
          const rankA = a.rank || Number.MAX_VALUE;
          const rankB = b.rank || Number.MAX_VALUE;
          return rankA - rankB;
        },
      },
      {
        title: "Mã Đăng Ký",
        dataIndex: ["registration", "registrationNumber"],
        render: (registrationNumber, record) => {
          return registrationNumber || "—";
        },
        sorter: (a, b) => {
          const regNumA = a.registration?.registrationNumber || "";
          const regNumB = b.registration?.registrationNumber || "";
          return regNumA.localeCompare(regNumB);
        },
        // defaultSortOrder: "ascend",
      },
      {
        title: "Hình ảnh",
        dataIndex: ["registration", "koiMedia"],
        render: (koiMedia, record) => {
          const id = record.key;
          const imageMedia =
            koiMedia && koiMedia.length > 0
              ? koiMedia.find((media) => media.mediaType === "Image")
              : null;

          const imageUrl = imageMedia?.mediaUrl || PLACEHOLDER_IMAGE;

          return (
            <div className="w-[70px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
              <Image
                src={imageUrl}
                alt="Hình cá"
                width={80}
                height={50}
                className="object-cover"
                preview={{
                  src: imageMedia?.mediaUrl,
                  mask: (
                    <div className="text-xs">
                      <EyeOutlined />
                    </div>
                  ),
                }}
                placeholder={
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Loading />
                  </div>
                }
                fallback={PLACEHOLDER_IMAGE}
              />
            </div>
          );
        },
      },
      {
        title: "Kích thước",
        dataIndex: ["registration", "koiSize"],
        render: (size) => (size ? `${size} cm` : "—"),
      },
      {
        title: "Giống",
        dataIndex: ["registration", "koiProfile", "variety", "name"],
        ellipsis: true,
        render: (name) => name || "—",
      },
      {
        title: "Kết quả",
        dataIndex: "roundResults",
        render: (results) => {
          if (!results || results.length === 0)
            return <Tag color="gray">Chưa có</Tag>;

          // Get the status from the roundResult field
          const status = results[0]?.status;

          if (status === "Pass") {
            return <Tag color="green">Đạt</Tag>;
          } else if (status === "Fail") {
            return <Tag color="red">Không đạt</Tag>;
          } else {
            return <Tag color="orange">{status || "Đang chờ"}</Tag>;
          }
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        render: (status) => {
          let color = "blue";
          let text = status;

          switch (status) {
            case "unpublic":
              color = "gray";
              text = "Chưa công khai";
              break;
            case "public":
              color = "green";
              text = "Đã công khai";
              break;
            case "pending":
              color = "orange";
              text = "Đang chờ";
              break;
            default:
              text = status || "—";
          }

          return <Tag color={color}>{text}</Tag>;
        },
      },
    ];

    // Only add tank column if the selected category has tanks
    const selectedCategoryData = categories?.find(
      (c) => c.id === selectedCategory
    );
    if (selectedCategoryData?.hasTank) {
      baseColumns.push({
        title: "Bể",
        dataIndex: "tankName",
        width: 100,
        render: (tankName, record) => {
          // Nếu đã công khai vòng thi thì chỉ hiển thị tên bể, không cho chọn
          if (record.status === "public") {
            return (
              <Typography.Text>{tankName || "Chưa gán bể"}</Typography.Text>
            );
          }

          return (
            <Select
              value={tankName || undefined}
              placeholder="Chọn bể"
              onChange={(value) => handleTankAssignment(record.id, value)}
              loading={assigningTank[record.id]}
              disabled={assigningTank[record.id] || record.status === "public"}
              showSearch
              optionFilterProp="children"
            >
              {competitionRoundTanks?.map((tank) => (
                <Option key={tank.id} value={tank.id}>
                  {tank.name || `Bể ${tank.id}`}
                </Option>
              ))}
            </Select>
          );
        },
      });
    }

    // Add actions column
    baseColumns.push({
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          className="text-gray-500 hover:text-blue-500"
          onClick={() => showCategoryDetail(record)}
        />
      ),
    });

    return baseColumns;
  }, [
    selectedRoundType,
    showCategoryDetail,
    loadingImages,
    allTanksAssigned,
    isRoundScorePublished,
    assigningTank,
    competitionRoundTanks,
    handleTankAssignment,
    categories,
    selectedCategory,
    criteriaCompetitionRound,
    currentCategoryHasTank,
  ]);

  // Thay đổi cách sử dụng getColumnsForRoundType
  // getColumnsForRoundType là mảng columns từ useMemo, không phải hàm
  const columns = getColumnsForRoundType;

  // Xử lý khi NextRound cập nhật trạng thái chuyển cá
  const handleFishMoveStatus = useCallback((moved, noNextRound) => {
    setFishMoved(moved);
    setIsNoNextRound(noNextRound);
  }, []);

  // Cập nhật hàm công khai điểm để hiển thị nút chuyển cá ngay lập tức
  const handlePublishRoundResults = useCallback(async () => {
    if (!selectedSubRound) return;

    setIsPublishingScores(true);
    try {
      const result = await updateRoundResult(selectedSubRound);

      if (result.statusCode === 200) {
        notification.success({
          message: "Thành công",
          description: "Đã công khai điểm vòng thi thành công",
        });

        // Cập nhật trạng thái để ẩn nút công khai điểm và hiển thị NextRound
        setAreResultsPublished(true);

        // Reset fishMoved để đảm bảo nút chuyển cá hiển thị ngay cả khi trước đó đã được chuyển
        setFishMoved(false);

        // Cập nhật dữ liệu từ API để cập nhật UI
        fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
      } else {
        notification.error({
          message: "Lỗi",
          description: `Không thể công khai điểm: ${result?.message || "Lỗi không xác định"}`,
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: `Không thể công khai điểm: ${error?.message || "Lỗi không xác định"}`,
      });
    } finally {
      setIsPublishingScores(false);
    }
  }, [
    selectedSubRound,
    updateRoundResult,
    fetchRegistrationRound,
    currentPage,
    pageSize,
  ]);

  // Update the current step based on selections
  useEffect(() => {
    if (selectedCategory) {
      setCurrentStep(0);
    }
    if (selectedRoundType) {
      setCurrentStep(1);
    }
    if (selectedSubRound) {
      setCurrentStep(2);
    }
  }, [selectedCategory, selectedRoundType, selectedSubRound]);

  // Add this state to store the number of fish to advance
  const [fishToAdvance, setFishToAdvance] = useState(null);

  // Add this effect to fetch round details when selectedSubRound changes
  useEffect(() => {
    if (selectedSubRound && selectedCategory && selectedRoundType) {
      // If we already have round data, check if we have numberOfRegistrationToAdvance
      const currentRound =
        round && Array.isArray(round)
          ? round.find((r) => r.id === selectedSubRound)
          : null;

      if (currentRound?.numberOfRegistrationToAdvance !== undefined) {
        setFishToAdvance(currentRound.numberOfRegistrationToAdvance);
      } else {
        // Fetch round data if we don't have it
        fetchRound(selectedCategory, selectedRoundType)
          .then((data) => {
            if (data) {
              const roundInfo = Array.isArray(data)
                ? data.find((r) => r.id === selectedSubRound)
                : data;

              if (roundInfo?.numberOfRegistrationToAdvance !== undefined) {
                setFishToAdvance(roundInfo.numberOfRegistrationToAdvance);
              }
            }
          })
          .catch((err) => console.error("Error fetching round details:", err));
      }
    } else {
      setFishToAdvance(null);
    }
  }, [
    selectedSubRound,
    selectedCategory,
    selectedRoundType,
    round,
    fetchRound,
  ]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md competition-round">
      <Title level={3} className="text-center mb-6 text-blue-700">
        <TrophyOutlined className="mr-2 my-3" />
        Quản lý vòng thi
      </Title>

      <Steps
        current={currentStep}
        className="mb-8 custom-steps"
        labelPlacement="vertical"
        responsive
        size="small"
      >
        <Step title="Hạng mục" icon={<AimOutlined />} />
        <Step title="Vòng thi" icon={<TrophyOutlined />} />
        <Step title="Quản lý cá thi đấu" icon={<PercentageOutlined />} />
      </Steps>

      <Card className="shadow-sm mb-6 px-0">
        <div className="p-4">
          <div className="flex flex-wrap items-end -mx-2">
            <div className="w-full sm:w-1/3 px-2 mb-4 sm:mb-0">
              <Text strong className="block text-base mb-2 text-gray-700">
                Hạng Mục:
              </Text>
              <Select
                placeholder="Chọn hạng mục"
                onChange={handleCategoryChange}
                allowClear
                value={selectedCategory}
                loading={!categories}
                disabled={!categories || categories.length === 0}
                className="w-full"
                size="large"
                suffixIcon={<AimOutlined />}
              >
                {categories?.map((category) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-1/3 px-2 mb-4 sm:mb-0">
              <Text strong className="block text-base mb-2 text-gray-700">
                Loại Vòng:
              </Text>
              <Select
                value={selectedRoundType}
                onChange={handleRoundTypeChange}
                className="w-full"
                placeholder="Chọn vòng thi"
                loading={roundLoading}
                disabled={!selectedCategory}
                size="large"
                suffixIcon={<TrophyOutlined />}
              >
                {roundTypes.map((type) => (
                  <Option key={type} value={type}>
                    {roundTypeLabels[type] || type}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-1/3 px-2 mb-4 sm:mb-0">
              <Text strong className="block text-base mb-2 text-gray-700">
                Vòng:
              </Text>
              <Select
                value={selectedSubRound}
                onChange={handleSubRoundChange}
                className="w-full"
                placeholder={roundLoading ? "Đang tải..." : "Chọn vòng"}
                loading={roundLoading}
                disabled={!selectedRoundType}
                notFoundContent={roundLoading ? <Loading /> : "Không có vòng"}
                size="large"
                suffixIcon={<TrophyOutlined />}
              >
                {round
                  ?.sort((a, b) => {
                    // Sort by roundOrder if available
                    if (
                      a.roundOrder !== undefined &&
                      b.roundOrder !== undefined
                    ) {
                      return a.roundOrder - b.roundOrder;
                    }
                    // Fall back to name sorting if no roundOrder
                    return (a.name || a.roundName || "").localeCompare(
                      b.name || b.roundName || ""
                    );
                  })
                  ?.map((item) => (
                    <Option
                      key={item.id || item.roundId}
                      value={item.id || item.roundId}
                    >
                      {item.name || item.roundName || `Vòng ${item.id}`}
                    </Option>
                  ))}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Display criteria section for both Evaluation and Final rounds */}
      {(selectedRoundType === "Evaluation" ||
        selectedRoundType === "Final") && (
        <>
          {criteriaLoading ? (
            <div className="mb-4">
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ) : (
            <CriteriaDisplay />
          )}
        </>
      )}

      <div
        className="overflow-x-auto"
        style={{
          minHeight:
            selectedSubRound && displayData.length === 0 && !registrationLoading
              ? "auto"
              : "300px",
          position: "relative", // Thêm position relative
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <Typography.Text strong>
            {displayData.length > 0 && (
              <>
                Tổng số: {registrationTotalItems || displayData.length} cá thi
                đấu
                {fishToAdvance !== null && (
                  <span className="ml-2 text-green-600">
                    (Số lượng cá qua vòng: {fishToAdvance})
                  </span>
                )}
              </>
            )}
          </Typography.Text>

          <div className="flex">
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={() => {
                if (selectedSubRound) {
                  fetchRegistrationRound(
                    selectedSubRound,
                    currentPage,
                    pageSize
                  );
                }
              }}
              disabled={!selectedSubRound || registrationLoading}
              style={{
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Làm mới
              </span>
            </Button>

            {selectedSubRound && !isRoundPublished() && !publishRequested && (
              <Button
                type="primary"
                onClick={handlePublishRound}
                loading={isPublishing}
                icon={<CheckCircleOutlined />}
                className="ml-2"
                disabled={
                  isPublishing || (currentCategoryHasTank && !allTanksAssigned)
                }
                style={{
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
                  background: "#1677ff",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  Công Khai Vòng Thi{" "}
                  {currentCategoryHasTank &&
                    !allTanksAssigned &&
                    "(Cần gán bể)"}
                </span>
              </Button>
            )}

            {selectedSubRound &&
              selectedRoundType &&
              (selectedRoundType === "Evaluation" ||
                selectedRoundType === "Final") &&
              isRoundPublished() &&
              !allEntriesHaveScores && (
                <Button
                  type="primary"
                  onClick={handleCreateFinalScore}
                  loading={roundResultLoading}
                  icon={<TrophyOutlined />}
                  className="ml-2"
                  style={{
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
                    background: "#1677ff",
                    border: "none",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Tạo Điểm Cuối Cùng
                  </span>
                </Button>
              )}

            {selectedSubRound &&
              selectedRoundType &&
              isRoundPublished() &&
              allEntriesHaveScores &&
              !areResultsPublished && (
                <Button
                  type="primary"
                  onClick={handlePublishRoundResults}
                  loading={isPublishingScores}
                  icon={<CheckCircleOutlined />}
                  disabled={isPublishingScores}
                  className="ml-2"
                  style={{
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
                    background: "#1677ff",
                    border: "none",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Công Khai Điểm
                  </span>
                </Button>
              )}

            {selectedSubRound && areResultsPublished && !fishMoved && (
              <div className="ml-2">
                <NextRound
                  registrationRound={registrationRound}
                  selectedSubRound={selectedSubRound}
                  selectedCategory={selectedCategory}
                  selectedRoundType={selectedRoundType}
                  roundTypes={roundTypes}
                  fetchRegistrationRound={fetchRegistrationRound}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onFishMoveStatusChange={handleFishMoveStatus}
                  roundStatus={(() => {
                    if (!selectedSubRound) {
                      console.log(
                        "No selectedSubRound, not passing roundStatus"
                      );
                      return null;
                    }

                    const currentRound = round?.find(
                      (r) => r.id === selectedSubRound
                    );

                    return currentRound?.status || null;
                  })()}
                />
              </div>
            )}
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={displayData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: registrationTotalItems,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
            responsive: true,
          }}
          onChange={handleTableChange}
          loading={registrationLoading}
          scroll={{ x: "max-content" }}
          size="small"
          key={`table-${selectedCategory}-${selectedRoundType}`}
          locale={{
            emptyText: (
              <Empty
                description="Không có dữ liệu"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "24px 0" }}
              />
            ),
          }}
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        title={
          currentRegistration?.registration?.registrationNumber
            ? `Mã đăng ký: ${currentRegistration.registration.registrationNumber}`
            : "Chi tiết"
        }
        placement="right"
        width={window.innerWidth > 768 ? 720 : "90%"}
        onClose={handleDrawerClose}
        open={isDetailDrawerVisible}
        maskClosable={true}
        keyboard={true}
        className="competition-round-drawer"
      >
        {currentRegistration && (
          <Tabs
            defaultActiveKey="1"
            onChange={(activeKey) => {
              if (activeKey === "score-details" && currentRegistration?.id) {
                fetchScoreDetail(currentRegistration.id);
                console.log("Refreshing score details on tab change");
              }
            }}
            size="large"
            type="card"
            className="detail-tabs"
          >
            {/* Tab 1: Thông tin cơ bản */}
            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined className="mx-2" />
                  Thông tin cơ bản
                </span>
              }
              key="1"
            >
              <Descriptions bordered column={1} className="mb-4">
                <Descriptions.Item label="Mã Đăng Ký">
                  {currentRegistration.registration?.registrationNumber ||
                    currentRegistration.registration?.id?.substring(0, 8) ||
                    "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Chủ sở hữu">
                  {currentRegistration.registration?.registerName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {currentRegistration.registration?.account?.email || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {currentRegistration.registration?.account?.phone || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Tên Cá Koi">
                  {currentRegistration.registration?.koiProfile?.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Giống">
                  {currentRegistration.registration?.koiProfile?.variety
                    ?.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Kích Thước">
                  {currentRegistration.registration?.koiSize
                    ? `${currentRegistration.registration.koiSize} cm`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Tuổi Cá">
                  {currentRegistration.registration?.koiAge
                    ? `${currentRegistration.registration.koiAge} năm`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Dòng máu">
                  {currentRegistration.registration?.koiProfile?.bloodline ||
                    "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Hạng Mục">
                  {currentRegistration.registration?.competitionCategory
                    ?.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Phí Đăng Ký">
                  {currentRegistration.registration?.registrationFee
                    ? `${currentRegistration.registration.registrationFee.toLocaleString()} VND`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng Thái">
                  <Tag
                    color={
                      currentRegistration.status === "unpublic"
                        ? "gray"
                        : currentRegistration.status === "public"
                          ? "green"
                          : currentRegistration.status === "pending"
                            ? "orange"
                            : "default"
                    }
                  >
                    {currentRegistration.status === "unpublic"
                      ? "Chưa công khai"
                      : currentRegistration.status === "public"
                        ? "Đã công khai"
                        : currentRegistration.status === "pending"
                          ? "Đang chờ"
                          : currentRegistration.status || "—"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Bể">
                  {currentRegistration.tankName || "Chưa gán bể"}
                </Descriptions.Item>
                {currentRegistration.checkInTime && (
                  <Descriptions.Item label="Thời gian check-in">
                    {new Date(currentRegistration.checkInTime).toLocaleString()}
                  </Descriptions.Item>
                )}
                {currentRegistration.checkOutTime && (
                  <Descriptions.Item label="Thời gian check-out">
                    {new Date(
                      currentRegistration.checkOutTime
                    ).toLocaleString()}
                  </Descriptions.Item>
                )}
                {currentRegistration.notes && (
                  <Descriptions.Item label="Ghi chú">
                    {currentRegistration.notes}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </TabPane>
            {/* QR Code Tab - Moved up in the tab order */}
            <TabPane
              tab={
                <span>
                  <QrcodeOutlined className="mx-2" />
                  Mã QR chấm điểm
                </span>
              }
              key="qrcode"
            >
              <div className="flex flex-col items-center">
                <Typography.Title level={4} className="mb-4">
                  Mã QR dành cho trọng tài chấm điểm
                </Typography.Title>
                {currentRegistration.registration?.qrcodeData ? (
                  <Card bordered={false} className="mb-4 shadow-md">
                    <Image
                      src={currentRegistration.registration.qrcodeData}
                      alt="QR Code chấm điểm"
                      width={300}
                      className="mx-auto"
                    />
                  </Card>
                ) : (
                  <Empty description="Không có mã QR" />
                )}
                <Typography.Text type="secondary" className="text-center mb-6">
                  Trọng tài có thể quét mã QR này để chấm điểm cho cá Koi
                </Typography.Text>
              </div>
            </TabPane>
            {/* Tab 2: Hình ảnh và video */}
            {currentRegistration.registration?.koiMedia &&
              currentRegistration.registration.koiMedia.length > 0 && (
                <TabPane
                  tab={
                    <span>
                      <FileImageOutlined className="mx-2" />
                      Hình ảnh & Video
                    </span>
                  }
                  key="2"
                >
                  <Row gutter={[16, 16]}>
                    {/* Hiển thị hình ảnh */}
                    {currentRegistration.registration.koiMedia.filter(
                      (media) => media.mediaType === "Image"
                    ).length > 0 && (
                      <Col xs={24} md={12}>
                        <div>
                          <p className="font-medium mb-3">
                            <strong>Hình Ảnh:</strong>
                          </p>
                          <div className="relative">
                            <div
                              className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-[300px]"
                              style={{ borderRadius: "8px" }}
                            >
                              <Image
                                src={
                                  currentRegistration.registration.koiMedia.find(
                                    (media) => media.mediaType === "Image"
                                  )?.mediaUrl
                                }
                                alt="Hình Ảnh Koi"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                  margin: "0 auto",
                                  display: "block",
                                }}
                                placeholder={
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "300px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Spin size="small" />
                                  </div>
                                }
                                preview={{
                                  mask: (
                                    <EyeOutlined style={{ fontSize: "18px" }} />
                                  ),
                                  icons: false,
                                }}
                              />
                            </div>
                            {currentRegistration.registration.koiMedia.filter(
                              (media) => media.mediaType === "Image"
                            ).length > 1 && (
                              <div
                                onClick={() => {
                                  // Hiển thị tất cả hình ảnh trong một modal sử dụng Image.PreviewGroup
                                  const images =
                                    currentRegistration.registration.koiMedia
                                      .filter(
                                        (media) => media.mediaType === "Image"
                                      )
                                      .map((media) => ({
                                        src: media.mediaUrl,
                                      }));

                                  // Mở preview của ảnh đầu tiên
                                  const firstImage =
                                    document.querySelector(".ant-image-img");
                                  if (firstImage) {
                                    firstImage.click();
                                  }
                                }}
                                className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-all"
                                style={{
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                              >
                                <span className="text-white font-semibold text-xl bg-black bg-opacity-40 px-4 py-2 rounded-full">
                                  +
                                  {currentRegistration.registration.koiMedia.filter(
                                    (media) => media.mediaType === "Image"
                                  ).length - 1}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Hiển thị video */}
                    {currentRegistration.registration.koiMedia.filter(
                      (media) => media.mediaType === "Video"
                    ).length > 0 && (
                      <Col xs={24} md={12}>
                        <div>
                          <p className="font-medium mb-3">
                            <strong>Video:</strong>
                          </p>
                          <div className="relative">
                            <div
                              className="bg-gray-900 rounded-lg overflow-hidden h-[300px] flex items-center justify-center"
                              style={{ borderRadius: "8px" }}
                            >
                              <video
                                controls
                                src={
                                  currentRegistration.registration.koiMedia.find(
                                    (media) => media.mediaType === "Video"
                                  )?.mediaUrl
                                }
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  maxHeight: "100%",
                                  borderRadius: "8px",
                                }}
                              />
                            </div>
                            {currentRegistration.registration.koiMedia.filter(
                              (media) => media.mediaType === "Video"
                            ).length > 1 && (
                              <div
                                onClick={() => {
                                  // Hiển thị modal với danh sách video
                                  Modal.info({
                                    title: "Tất cả video",
                                    width: "90%",
                                    style: { maxWidth: 900 },
                                    content: (
                                      <Row gutter={[16, 16]}>
                                        {currentRegistration.registration.koiMedia
                                          .filter(
                                            (media) =>
                                              media.mediaType === "Video"
                                          )
                                          .map((media, index) => (
                                            <Col
                                              xs={24}
                                              sm={12}
                                              key={`video-${index}`}
                                            >
                                              <div
                                                className="bg-gray-900 rounded-lg overflow-hidden h-[300px] flex items-center justify-center"
                                                style={{ borderRadius: "8px" }}
                                              >
                                                <video
                                                  controls
                                                  src={media.mediaUrl}
                                                  style={{
                                                    width: "100%",
                                                    height: "auto",
                                                    maxHeight: "100%",
                                                    borderRadius: "8px",
                                                  }}
                                                />
                                              </div>
                                            </Col>
                                          ))}
                                      </Row>
                                    ),
                                    footer: null,
                                    maskClosable: true,
                                    keyboard: true,
                                    okText: "Đóng",
                                    okButtonProps: {
                                      style: { display: "none" },
                                    },
                                  });
                                }}
                                className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-all"
                                style={{
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                              >
                                <span className="text-white font-semibold text-xl bg-black bg-opacity-40 px-4 py-2 rounded-full">
                                  +
                                  {currentRegistration.registration.koiMedia.filter(
                                    (media) => media.mediaType === "Video"
                                  ).length - 1}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </TabPane>
              )}
            {/* Tab 3: Kết quả */}
            {currentRegistration.roundResults &&
              currentRegistration.roundResults.length > 0 && (
                <TabPane
                  tab={
                    <span>
                      <TrophyOutlined className="mx-2" />
                      Kết quả vòng thi
                    </span>
                  }
                  key="3"
                >
                  <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={currentRegistration.roundResults}
                    renderItem={(result) => (
                      <List.Item>
                        <Card
                          title={result.roundName || "Vòng thi"}
                          extra={
                            <Tag
                              color={
                                currentRegistration.roundResults[0]?.status ===
                                "Pass"
                                  ? "green"
                                  : "red"
                              }
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                              }}
                            >
                              {currentRegistration.roundResults[0]?.status ===
                              "Pass"
                                ? "Đạt"
                                : "Không đạt"}
                            </Tag>
                          }
                        >
                          <p>
                            <strong>Thời gian:</strong>{" "}
                            {result.createdAt
                              ? new Date(result.createdAt).toLocaleString()
                              : "—"}
                          </p>
                          {result.totalScore &&
                            selectedRoundType !== "Preliminary" && (
                              <p>
                                <strong>Điểm số: {""}</strong>
                                <Tag
                                  color="blue"
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    marginRight: "5px",
                                  }}
                                >
                                  {result.totalScore}
                                </Tag>
                              </p>
                            )}
                          {result.notes && (
                            <p>
                              <strong>Ghi chú:</strong> {result.notes}
                            </p>
                          )}
                        </Card>
                      </List.Item>
                    )}
                  />
                </TabPane>
              )}
            {/* Add the Score Details Tab - Only for non-preliminary rounds */}
            {selectedRoundType !== "Preliminary" && (
              <TabPane
                tab={
                  <span>
                    <PercentageOutlined className="mx-2" />
                    Điểm chi tiết
                  </span>
                }
                key="score-details"
              >
                <ScoreDetailsTab />
              </TabPane>
            )}
          </Tabs>
        )}
      </Drawer>
    </div>
  );
}

export default CompetitionRound;
