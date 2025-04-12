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

  // Category state
  const { categories, fetchCategories } = useCategory();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Round state
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const { round, fetchRound, isLoading: roundLoading } = useRound();

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
    // Check if every registration has a tankName
    return registrationRound.every((item) => Boolean(item.tankName));
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

      if (value) {
        fetchTanks(value, 1, 100, true);
      }
    },
    [fetchTanks]
  );

  // Handle round type selection
  const handleRoundTypeChange = useCallback(
    (value) => {
      // Reset sub-round
      setSelectedSubRound(null);
      setSelectedRoundType(value);

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
        // First set the selected sub round
        setSelectedSubRound(value);

        // Only fetch if we have a valid value
        if (value && typeof value === "string" && value !== "undefined") {
          // Use a local variable to track if we should update
          let shouldUpdateState = true;

          // Wrap in try/catch to prevent any unhandled rejection errors
          try {
            // Fetch registration data - store the promise but don't chain state updates here
            const fetchPromise = fetchRegistrationRound(value, 1, pageSize);

            // Handle the data separately to avoid tight coupling of state updates
            fetchPromise
              .then((data) => {
                // Only update state if component is still mounted and we should update
                if (
                  isMounted.current &&
                  shouldUpdateState &&
                  Array.isArray(data)
                ) {
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
    ]
  );

  // Add this ref at the top of your component with other refs
  const previousRegistrationRoundRef = useRef(null);

  // Fix the problematic useEffect that was also updating areResultsPublished
  // Use a ref to track changes instead of depending on the state variable
  useEffect(() => {
    // Create a cleanup function that runs when the component unmounts
    const handleRegistrationDataChange = () => {
      if (registrationRound && registrationRound.length > 0) {
        // Only update if the data has actually changed
        if (registrationRound !== previousRegistrationRoundRef.current) {
          const allPublished = registrationRound.every(
            (item) =>
              item.roundResults &&
              item.roundResults.length > 0 &&
              item.roundResults[0]?.isPublic === true
          );

          // Update the state using the functional form to avoid stale closures
          setAreResultsPublished((prevState) => {
            // Only update if the value has changed
            if (allPublished !== prevState) {
              return allPublished;
            }
            return prevState;
          });

          // Update ref to prevent unnecessary updates
          previousRegistrationRoundRef.current = registrationRound;
        }
      }
    };

    // Call it once
    handleRegistrationDataChange();

    // Only run this effect when registrationRound changes
    // This is safe because we're using refs and functional updates
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

      // Kiểm tra xem có điểm đã công khai chưa
      const hasPublishedScores = dataWithIndex.some(
        (item) =>
          item.roundResults &&
          item.roundResults.length > 0 &&
          item.roundResults[0]?.totalScore !== undefined &&
          item.roundResults[0]?.isPublic === true
      );

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
          if (scoreA !== scoreB) return scoreB - scoreA;
        }

        // If scores are equal or not available, sort by rank
        const rankA = a.registration?.rank || Number.MAX_VALUE;
        const rankB = b.registration?.rank || Number.MAX_VALUE;
        if (rankA !== rankB) return rankA - rankB;

        // If ranks are equal or not available, sort by registration number
        const regNumA = a.registration?.registrationNumber || "";
        const regNumB = b.registration?.registrationNumber || "";
        return regNumA.localeCompare(regNumB);
      });

      // Nếu đã có điểm công khai, tính toán thứ hạng dựa trên điểm số
      if (hasPublishedScores) {
        // Tạo một bản sao để sắp xếp theo điểm
        const rankedData = [...sortedData];

        // Gán thứ hạng dựa trên vị trí sau khi sắp xếp
        let currentRank = 1;
        let previousScore = null;

        rankedData.forEach((item, index) => {
          const score = item.roundResults && item.roundResults[0]?.totalScore;

          // Nếu điểm khác với điểm trước đó, tăng thứ hạng
          if (score !== previousScore) {
            currentRank = index + 1;
          }

          // Gán thứ hạng mới
          item.calculatedRank = currentRank;
          previousScore = score;
        });

        return rankedData;
      }

      // Nếu chưa có điểm công khai, trả về dữ liệu đã sắp xếp nhưng không tính thứ hạng
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

  // Update the getColumnsForRoundType function to use our new component
  const getColumnsForRoundType = useMemo(() => {
    // For Final Round
    if (selectedRoundType === "Final") {
      console.log(
        "Using FINAL round columns with criteria:",
        criteriaCompetitionRound
      );
      return getFinalColumns({
        handleViewDetails: showCategoryDetail,
        loadingImages,
        allTanksAssigned,
        isRoundPublished: isRoundScorePublished,
        assigningTank,
        competitionRoundTanks,
        handleTankChange: handleTankAssignment,
        criteria: criteriaCompetitionRound, // Pass criteria to Final round too
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
      });
    }
    // Default columns for Preliminary Round (existing code)
    const baseColumns = [
      {
        title: "Top",
        dataIndex: ["rank"],
        width: 40,
        render: (rank) => (
          <span style={{ color: "blue", fontWeight: "bold" }}>
            {rank ? `#${rank}` : "_"}
          </span>
        ),
        sorter: (a, b) => {
          // Handle null/undefined values for sorting
          const rankA = a.registration?.rank || Number.MAX_VALUE;
          const rankB = b.registration?.rank || Number.MAX_VALUE;
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
  ]);

  // Handle publishing round - Make sure it doesn't trigger on render
  const handlePublishRound = useCallback(async () => {
    if (!selectedSubRound) {
      notification.warning({
        message: "Thông báo",
        description: "Vui lòng chọn vòng thi trước khi công khai",
      });
      return;
    }

    try {
      setIsPublishing(true);
      const result = await updatePublishRound(selectedSubRound);

      if (result?.success) {
        notification.success({
          message: "Thành công",
          description: "Đã công khai vòng thi thành công",
        });

        // Refresh data - ONLY if component is still mounted
        if (isMounted.current) {
          fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: `Không thể công khai vòng thi: ${result?.error?.message || "Lỗi không xác định"}`,
        });
      }
    } catch (error) {
      console.error("[PublishRound] Error:", error);
      notification.error({
        message: "Lỗi",
        description: `Không thể công khai vòng thi: ${error?.message || "Lỗi không xác định"}`,
      });
    } finally {
      if (isMounted.current) {
        setIsPublishing(false);
      }
    }
  }, [
    selectedSubRound,
    updatePublishRound,
    fetchRegistrationRound,
    currentPage,
    pageSize,
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

      console.log("API Response:", result);

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
      console.log("Fetching tanks for category:", selectedCategory);
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
        {/* <Typography.Title level={5} className="mb-3">
          Tiêu chí đánh giá
        </Typography.Title> */}
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
            const scoreDate = new Date(scoreItem.createdAt).toLocaleString();

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
                  </Card>

                  {scoreItem.comments && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <Typography.Text strong>Nhận xét: </Typography.Text>
                      <Typography.Text>{scoreItem.comments}</Typography.Text>
                    </div>
                  )}

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
                                              Lỗi nhỏ: {error.errorTypeName}
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

  // Thay đổi cách sử dụng getColumnsForRoundType
  // getColumnsForRoundType là mảng columns từ useMemo, không phải hàm
  const columns = getColumnsForRoundType;

  // Cập nhật hàm công khai điểm để sử dụng state
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

        // Cập nhật trạng thái để ẩn nút ngay lập tức
        setAreResultsPublished(true);

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

  // Thêm state để theo dõi xem fish đã được chuyển sang vòng tiếp theo chưa
  const [fishMoved, setFishMoved] = useState(false);
  const [isNoNextRound, setIsNoNextRound] = useState(false);

  // Xử lý khi NextRound cập nhật trạng thái chuyển cá
  const handleFishMoveStatus = useCallback((moved, noNextRound) => {
    setFishMoved(moved);
    setIsNoNextRound(noNextRound);
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="mb-4">
        <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
          <div className="w-full md:w-1/4">
            <div className="text-lg font-medium mb-2">Hạng Mục:</div>
            <Select
              placeholder="Chọn hạng mục"
              onChange={handleCategoryChange}
              allowClear
              value={selectedCategory}
              loading={!categories}
              disabled={!categories || categories.length === 0}
              className="w-full"
            >
              {categories?.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </div>

          {selectedCategory && (
            <div className="w-full md:w-1/4">
              <div className="text-lg font-medium mb-2">Loại Vòng:</div>
              <Select
                value={selectedRoundType}
                onChange={handleRoundTypeChange}
                className="w-full"
                placeholder="Chọn vòng"
              >
                {roundTypes.map((type) => (
                  <Option key={type} value={type}>
                    {roundTypeLabels[type] || type}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {selectedRoundType && (
            <div className="w-full md:w-1/4">
              <div className="text-lg font-medium mb-2">Vòng:</div>
              <Select
                value={selectedSubRound}
                onChange={handleSubRoundChange}
                className="w-full"
                placeholder={roundLoading ? "Đang tải..." : "Chọn vòng "}
                loading={roundLoading}
                notFoundContent={roundLoading ? <Loading /> : "Không có vòng "}
              >
                {round?.map((item) => (
                  <Option
                    key={item.id || item.roundId}
                    value={item.id || item.roundId}
                  >
                    {item.name || item.roundName || `Vòng ${item.id}`}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* Only render the button container if there's at least one button to show */}
          {selectedSubRound &&
            (!isRoundPublished() ||
            (selectedRoundType &&
              isRoundPublished() &&
              (!allEntriesHaveScores ||
                (allEntriesHaveScores && !areResultsPublished))) ? (
              <div>
                {!isRoundPublished() && (
                  <>
                    <Button
                      type="primary"
                      size="middle"
                      className="w-full"
                      onClick={() => {
                        if (!allTanksAssigned) {
                          notification.warning({
                            message: "Cần gán bể cho tất cả",
                            description:
                              "Vui lòng gán bể cho tất cả các cá trước khi công khai vòng thi.",
                          });
                        } else {
                          handlePublishRound();
                        }
                      }}
                      loading={isPublishing}
                      icon={<TrophyOutlined />}
                      disabled={!allTanksAssigned}
                    >
                      Công khai vòng thi
                    </Button>
                  </>
                )}

                {/* Show Create Final Score button when needed */}
                {selectedRoundType &&
                  (selectedRoundType === "Evaluation" ||
                    selectedRoundType === "Final") &&
                  isRoundPublished() &&
                  !allEntriesHaveScores && (
                    <Button
                      type="primary"
                      size="middle"
                      className="w-full mt-2"
                      onClick={handleCreateFinalScore}
                      loading={roundResultLoading}
                      icon={<TrophyOutlined />}
                    >
                      Tạo Điểm Cuối Cùng
                    </Button>
                  )}

                {/* New button for publishing round results - now checking fish moved status */}
                {selectedRoundType &&
                  isRoundPublished() &&
                  allEntriesHaveScores &&
                  !areResultsPublished && (
                    <Button
                      type="primary"
                      size="middle"
                      className="w-full mt-2"
                      onClick={handlePublishRoundResults}
                      loading={isPublishingScores}
                      icon={<CheckCircleOutlined />}
                      disabled={isPublishingScores}
                    >
                      Công Khai Điểm
                    </Button>
                  )}
              </div>
            ) : null)}

          {/* Adjust NextRound component to take more space when buttons are hidden */}
          {selectedSubRound && (
            <div
              className={`w-full ${!isRoundPublished() || (selectedRoundType && isRoundPublished() && !allEntriesHaveScores) ? "md:w-1/4" : "md:w-1/3"}`}
            >
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
              />
            </div>
          )}
        </div>
      </div>

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
        className="overflow-auto"
        style={{
          minHeight:
            selectedSubRound && displayData.length === 0 && !registrationLoading
              ? "auto"
              : "300px",
        }}
      >
        <Table
          columns={columns}
          dataSource={displayData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: registrationTotalItems,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          onChange={handleTableChange}
          loading={registrationLoading}
          scroll={{ x: "max-content" }}
          size="small"
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
        width={720}
        onClose={handleDrawerClose}
        open={isDetailDrawerVisible}
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
                <Descriptions.Item label="Tên Người Đăng Ký">
                  {currentRegistration.registration?.registerName || "—"}
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
                  <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={currentRegistration.registration.koiMedia}
                    renderItem={(media) => (
                      <List.Item>
                        {media.mediaType === "Image" ? (
                          <Card title="Hình Ảnh">
                            <Image
                              src={media.mediaUrl}
                              alt="Hình Ảnh Koi"
                              style={{
                                width: "100%",
                                maxHeight: "400px",
                                objectFit: "contain",
                              }}
                            />
                          </Card>
                        ) : media.mediaType === "Video" ? (
                          <Card title="Video">
                            <video
                              controls
                              src={media.mediaUrl}
                              style={{ width: "100%" }}
                            />
                          </Card>
                        ) : null}
                      </List.Item>
                    )}
                  />
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
                          {result.totalScore && (
                            <p>
                              <strong>Điểm số:</strong>
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
            {/* Add the Score Details Tab */}
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
          </Tabs>
        )}
      </Drawer>
    </Card>
  );
}

export default CompetitionRound;
