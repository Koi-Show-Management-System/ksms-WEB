import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Spin,
  message,
  Tabs,
  Row,
  Col,
  Collapse,
  List,
  Descriptions,
  Card,
  Tag,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import useVariety from "../../../../hooks/useVariety";
import useCategory from "../../../../hooks/useCategory";
import useAccountTeam from "../../../../hooks/useAccountTeam";
import useCriteria from "../../../../hooks/useCriteria";
import { Loading } from "../../../../components";

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

dayjs.extend(utc);
dayjs.extend(timezone);

function EditCategory({ categoryId, onClose, onCategoryUpdated, showId }) {
  const { currentCategory, getCategoryDetail, updateCategory, isLoading } =
    useCategory();
  const { variety, fetchVariety, isLoading: isLoadingVariety } = useVariety();
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const {
    criteria,
    fetchCriteria,
    isLoading: isLoadingCriteria,
  } = useCriteria();
  const [criteriaWeights, setCriteriaWeights] = useState({});
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [editingAwardIndex, setEditingAwardIndex] = useState(null);
  const [editingCriteria, setEditingCriteria] = useState(false);
  const [editingReferees, setEditingReferees] = useState(false);
  const [tempSelectedCriteria, setTempSelectedCriteria] = useState([]);
  const [selectedRoundForCriteria, setSelectedRoundForCriteria] =
    useState(null);
  const [awardErrors, setAwardErrors] = useState({});

  const referee = accountManage.referees || [];

  const mainRounds = [
    { value: "Preliminary", label: "Vòng Sơ Khảo" },
    { value: "Evaluation", label: "Vòng Đánh Giá Chính" },
    { value: "Final", label: "Vòng Chung Kết" },
  ];

  const roundLabelMap = {
    Preliminary: "Vòng Sơ Khảo",
    Evaluation: "Vòng Đánh Giá Chính",
    Final: "Vòng Chung Kết",
  };

  useEffect(() => {
    getCategoryDetail(categoryId);
    fetchVariety();
    fetchAccountTeam(1, 100);
    fetchCriteria(1, 100);
  }, [categoryId]);

  useEffect(() => {
    if (currentCategory) {
      const formData = {
        name: currentCategory.name,
        sizeMin: currentCategory.sizeMin,
        sizeMax: currentCategory.sizeMax,
        description: currentCategory.description,
        maxEntries: currentCategory.maxEntries,
        minEntries: currentCategory.minEntries,
        registrationFee: currentCategory.registrationFee,
        categoryVarieties:
          currentCategory.categoryVarieties?.map((cv) => cv.variety.id) || [],
        awards: currentCategory.awards || [],
        criteriaCompetitionCategories:
          currentCategory.criteriaCompetitionCategories || [],
        refereeAssignments: currentCategory.refereeAssignments || [],
        rounds: currentCategory.rounds || [],
        hasTank: currentCategory.hasTank,
      };

      form.setFieldsValue(formData);
    }
  }, [currentCategory, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = form.getFieldsValue(true);

      // Validate field limits
      if (values.name && values.name.length > 100) {
        message.error("Tên hạng mục không được vượt quá 100 ký tự!");
        setActiveTab("1");
        return;
      }

      if (values.sizeMin > 100) {
        message.error("Kích thước tối thiểu không được vượt quá 100cm!");
        setActiveTab("1");
        return;
      }

      if (values.sizeMax > 100) {
        message.error("Kích thước tối đa không được vượt quá 100cm!");
        setActiveTab("1");
        return;
      }

      if (values.registrationFee > 10000000) {
        message.error("Phí đăng ký không được vượt quá 10 triệu VND!");
        setActiveTab("1");
        return;
      }

      if (values.minEntries > 1000) {
        message.error("Số lượng tham gia tối thiểu không được vượt quá 1000!");
        setActiveTab("1");
        return;
      }

      if (values.maxEntries > 1000) {
        message.error("Số lượng tham gia tối đa không được vượt quá 1000!");
        setActiveTab("1");
        return;
      }

      // Validate awards
      if (!validateAwards(formData.awards)) {
        setActiveTab("3"); // Switch to the awards tab
        return;
      }

      // Validate criteria for each round
      const criteriaByRound = {};
      mainRounds.forEach((round) => {
        criteriaByRound[round.value] = (
          formData.criteriaCompetitionCategories || []
        ).filter((c) => c.roundType === round.value);
      });

      let hasCriteriaError = false;
      let criteriaErrorMessage = "";

      Object.entries(criteriaByRound).forEach(([roundType, criteriaList]) => {
        // Check if each round has at least one criterion
        if (criteriaList.length < 1) {
          hasCriteriaError = true;
          criteriaErrorMessage = `${roundLabelMap[roundType]} cần ít nhất 1 tiêu chí`;
        }

        // Check if total weight equals 100%
        const totalWeight = criteriaList.reduce(
          (total, c) => total + (c.weight * 100 || 0),
          0
        );

        // Allow small floating point errors (99.9, 100.1)
        if (totalWeight < 99.5 || totalWeight > 100.5) {
          hasCriteriaError = true;
          criteriaErrorMessage = `${roundLabelMap[roundType]} phải có tổng trọng số bằng 100% (hiện tại: ${totalWeight.toFixed(1)}%)`;
        }
      });

      if (hasCriteriaError) {
        message.error(criteriaErrorMessage);
        setActiveTab("4"); // Switch to the criteria tab
        return;
      }

      const refereeAssignments = processRefereeAssignments(
        formData.refereeAssignments || []
      );

      // Validate referee assignments
      if (refereeAssignments.length === 0) {
        message.error("Vui lòng chọn ít nhất một trọng tài");
        setActiveTab("5"); // Switch to the referee tab
        return;
      }

      // Check if all referees have assigned rounds
      const refereesWithoutRounds = refereeAssignments.filter(
        (r) => !r.roundTypes || r.roundTypes.length === 0
      );

      if (refereesWithoutRounds.length > 0) {
        message.error("Vui lòng chọn vòng chấm điểm cho tất cả trọng tài");
        setActiveTab("5"); // Switch to the referee tab
        return;
      }

      const updatePayload = {
        id: categoryId,
        name: values.name,
        koiShowId: showId || currentCategory.koiShowId,
        sizeMin: parseFloat(values.sizeMin),
        sizeMax: parseFloat(values.sizeMax),
        description: values.description,
        minEntries: parseInt(
          values.minEntries || currentCategory.minEntries || 0
        ),
        maxEntries: parseInt(
          values.maxEntries || currentCategory.maxEntries || 0
        ),
        registrationFee: parseFloat(values.registrationFee || 0),

        createCompetionCategoryVarieties: formData.categoryVarieties || [],

        createAwardCateShowRequests: (formData.awards || []).map((award) => ({
          id: award.id,
          name: award.name,
          awardType: award.awardType || "default",
          prizeValue: parseFloat(award.prizeValue) || 0,
          description: award.description || "",
        })),

        createCriteriaCompetitionCategoryRequests: (
          formData.criteriaCompetitionCategories || []
        ).map((criteria) => ({
          id: criteria.id,
          criteriaId: criteria.criteriaId || criteria.criteria?.id,
          roundType: criteria.roundType,
          weight: parseFloat(criteria.weight) || 0,
          order: parseInt(criteria.order) || 0,
        })),

        createRefereeAssignmentRequests: refereeAssignments,

        createRoundRequests: (formData.rounds || []).map((round) => {
          // Xử lý giá trị numberOfRegistrationToAdvance
          let numberOfRegistrationToAdvance =
            round.numberOfRegistrationToAdvance;

          // Với vòng Preliminary hoặc vòng Final không đủ điều kiện, đặt giá trị là null
          if (
            round.roundType === "Preliminary" ||
            (round.roundType === "Final" &&
              (formData.rounds.filter((r) => r?.roundType === "Final").length <
                2 ||
                round.roundOrder !== 1))
          ) {
            numberOfRegistrationToAdvance = null;
          }
          // Với các vòng khác, đảm bảo giá trị là số
          else if (typeof numberOfRegistrationToAdvance === "string") {
            numberOfRegistrationToAdvance =
              parseInt(numberOfRegistrationToAdvance, 10) || 0;
          } else if (
            numberOfRegistrationToAdvance === null ||
            numberOfRegistrationToAdvance === undefined
          ) {
            numberOfRegistrationToAdvance = 0;
          }

          return {
            id: round.id,
            name: round.name,
            roundOrder: parseInt(round.roundOrder) || 0,
            roundType: round.roundType,
            startTime: round.startTime || null,
            endTime: round.endTime || null,
            numberOfRegistrationToAdvance: numberOfRegistrationToAdvance,
            status: round.status || "pending",
          };
        }),

        hasTank: values.hasTank,
      };

      await updateCategory(categoryId, updatePayload);
      onClose();
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const processRefereeAssignments = (assignments = []) => {
    if (!assignments || assignments.length === 0) return [];

    const refereeMap = {};

    assignments.forEach((assignment) => {
      const refereeId =
        assignment.refereeAccount?.id || assignment.refereeAccountId;
      if (!refereeId) return;

      if (!refereeMap[refereeId]) {
        refereeMap[refereeId] = {
          id: assignment.id,
          refereeAccountId: refereeId,
          roundTypes: [],
        };
      }

      if (
        assignment.roundType &&
        !refereeMap[refereeId].roundTypes.includes(assignment.roundType)
      ) {
        refereeMap[refereeId].roundTypes.push(assignment.roundType);
      }
    });

    return Object.values(refereeMap).filter(
      (item) => item.roundTypes.length > 0
    );
  };

  const hasAllRequiredAwardTypes = (awards) => {
    if (!awards || awards.length === 0) return false;

    // Check if we have at least one award of each required type
    const requiredTypes = ["first", "second", "third", "honorable"];
    const awardTypes = awards.map((award) => award.awardType);

    // First check: ensure all required types exist
    return requiredTypes.every((type) => awardTypes.includes(type));
  };

  const validateAwards = (awards) => {
    if (!awards || awards.length === 0) {
      message.error(
        "Vui lòng thêm ít nhất các giải thưởng bắt buộc: Giải Nhất, Giải Nhì, Giải Ba và Giải Khuyến Khích"
      );
      return false;
    }

    // Check if any award doesn't have a type selected
    const awardsMissingType = awards.filter((award) => !award.awardType);
    if (awardsMissingType.length > 0) {
      message.error(
        `Vui lòng chọn loại giải thưởng cho tất cả giải thưởng đã thêm`
      );
      return false;
    }

    const requiredTypes = {
      first: "Giải Nhất",
      second: "Giải Nhì",
      third: "Giải Ba",
      honorable: "Giải Khuyến Khích",
    };

    const awardTypes = awards.map((award) => award.awardType);

    // Check for duplicate award types - not allowed
    const typeCounts = {};
    awardTypes.forEach((type) => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const duplicateTypes = Object.entries(typeCounts)
      .filter(([_, count]) => count > 1)
      .map(([type, _]) => {
        switch (type) {
          case "first":
            return "Giải Nhất";
          case "second":
            return "Giải Nhì";
          case "third":
            return "Giải Ba";
          case "honorable":
            return "Giải Khuyến Khích";
          default:
            return type;
        }
      });

    if (duplicateTypes.length > 0) {
      message.error(
        `Không thể có nhiều giải thưởng cùng loại: ${duplicateTypes.join(", ")}`
      );
      return false;
    }

    // Check for missing required award types
    const missingTypes = Object.entries(requiredTypes)
      .filter(([type]) => !awardTypes.includes(type))
      .map(([_, label]) => label);

    if (missingTypes.length > 0) {
      message.error(
        `Vui lòng thêm các giải thưởng còn thiếu: ${missingTypes.join(", ")}`
      );
      return false;
    }

    // Validate prize value for each award
    const invalidPrizes = awards.filter(
      (award) => !award.prizeValue || award.prizeValue <= 0
    );
    if (invalidPrizes.length > 0) {
      message.error("Giá trị giải thưởng phải lớn hơn 0");
      return false;
    }

    // Check for award description
    const missingDescriptions = awards.filter(
      (award) => !award.description?.trim()
    );
    if (missingDescriptions.length > 0) {
      message.error("Tất cả giải thưởng cần có mô tả");
      return false;
    }

    return true;
  };

  // Handle adding a new award
  const handleAddAward = () => {
    const currentAwards = form.getFieldValue("awards") || [];
    form.setFieldsValue({
      awards: [
        ...currentAwards,
        { name: "", awardType: "", prizeValue: "", description: "" },
      ],
    });
    setEditingAwardIndex(currentAwards.length);
  };

  // Handle removing an award by award field name
  const handleRemoveAward = (fieldName) => {
    const currentAwards = form.getFieldValue("awards") || [];
    form.setFieldsValue({
      awards: currentAwards.filter((_, i) => i !== fieldName),
    });
    setEditingAwardIndex(null);
  };

  // Handle editing an award
  const handleEditAward = (fieldName) => {
    // Xóa lỗi khi mở form chỉnh sửa
    const newAwardErrors = { ...awardErrors };
    delete newAwardErrors[fieldName];
    setAwardErrors(newAwardErrors);

    setEditingAwardIndex(fieldName);
  };

  // Handle saving award changes
  const handleSaveAward = () => {
    setEditingAwardIndex(null);
  };

  // Handle award type change to update award name
  const handleAwardTypeChange = (type, fieldName) => {
    // Xóa lỗi khi thay đổi loại giải
    const newAwardErrors = { ...awardErrors };
    delete newAwardErrors[fieldName];
    setAwardErrors(newAwardErrors);

    let awardName = "";
    switch (type) {
      case "first":
        awardName = "Giải Nhất";
        break;
      case "second":
        awardName = "Giải Nhì";
        break;
      case "third":
        awardName = "Giải Ba";
        break;
      case "honorable":
        awardName = "Giải Khuyến Khích";
        break;
      default:
        awardName = "";
    }

    // Check if this award type already exists
    const currentAwards = form.getFieldValue("awards") || [];
    const otherAwards = currentAwards.filter((_, i) => i !== fieldName);

    if (otherAwards.some((award) => award.awardType === type)) {
      message.error(`Không thể có hai giải thưởng cùng loại: ${awardName}`);
      return;
    }

    // Maintain the proper order of award types
    const hasFirst =
      otherAwards.some((a) => a.awardType === "first") || type === "first";
    const hasSecond =
      otherAwards.some((a) => a.awardType === "second") || type === "second";
    const hasThird =
      otherAwards.some((a) => a.awardType === "third") || type === "third";

    // Validate the award type selection order
    if (type === "second" && !hasFirst) {
      message.error("Không thể chọn Giải Nhì khi chưa có Giải Nhất");
      return;
    }

    if (type === "third" && (!hasFirst || !hasSecond)) {
      message.error(
        "Không thể chọn Giải Ba khi chưa có Giải Nhất hoặc Giải Nhì"
      );
      return;
    }

    if (type === "honorable" && (!hasFirst || !hasSecond || !hasThird)) {
      message.error(
        "Không thể chọn Giải Khuyến Khích khi chưa có đủ Giải Nhất, Nhì, và Ba"
      );
      return;
    }

    // Update the award name based on type
    currentAwards[fieldName].name = awardName;
    currentAwards[fieldName].awardType = type;
    form.setFieldsValue({
      awards: currentAwards,
    });
  };

  // Handle criteria selection
  const handleCriteriaSelection = (values) => {
    const selectedCriteriaDetails = values.map((id) => {
      const criteriaInfo = criteria.find((c) => c.id === id);
      return {
        criteriaId: id,
        weight: 0,
        order: 0,
      };
    });
    setTempSelectedCriteria(selectedCriteriaDetails);
  };

  const handleAddCriteriaToRound = (roundType) => {
    if (!tempSelectedCriteria || tempSelectedCriteria.length === 0) {
      message.warning("Vui lòng chọn tiêu chí trước");
      return;
    }

    const currentCriteria =
      form.getFieldValue("criteriaCompetitionCategories") || [];
    const existingCriteriaInRound = currentCriteria.filter(
      (c) => c.roundType === roundType
    );

    const newCriteria = tempSelectedCriteria.map((criteriaItem, index) => {
      const criteriaInfo = criteria.find(
        (c) => c.id === criteriaItem.criteriaId
      );

      return {
        criteriaId: criteriaItem.criteriaId,
        criteria: {
          id: criteriaItem.criteriaId,
          name: criteriaInfo?.name || "Tiêu chí không xác định",
        },
        roundType: roundType,
        // Đảm bảo weight đã là decimal (0-1)
        weight: criteriaItem.weight || 0,
        order: existingCriteriaInRound.length + index + 1,
      };
    });

    console.log("New criteria to add:", newCriteria);

    // Cập nhật form với các tiêu chí mới
    const updatedCriteria = [...currentCriteria, ...newCriteria];
    form.setFieldsValue({
      criteriaCompetitionCategories: updatedCriteria,
    });

    console.log("Updated criteria after adding new ones:", updatedCriteria);

    setTempSelectedCriteria([]);
    setSelectedRoundForCriteria(null);
  };

  const handleRemoveCriteria = (criteriaId, roundType) => {
    const currentCriteria =
      form.getFieldValue("criteriaCompetitionCategories") || [];

    // Xử lý cả hai trường hợp: criteriaId hoặc criteria.id
    const updatedCriteria = currentCriteria.filter(
      (c) =>
        !(
          (c.criteriaId === criteriaId || c.criteria?.id === criteriaId) &&
          c.roundType === roundType
        )
    );

    console.log(
      "Removing criteria with id:",
      criteriaId,
      "and roundType:",
      roundType
    );
    console.log(
      "Criteria before:",
      currentCriteria.length,
      "after:",
      updatedCriteria.length
    );

    // Reindex the order property for each round type
    const reindexedCriteria = [...updatedCriteria];
    const roundGroups = {};

    // Group criteria by roundType
    reindexedCriteria.forEach((criteria) => {
      if (!roundGroups[criteria.roundType]) {
        roundGroups[criteria.roundType] = [];
      }
      roundGroups[criteria.roundType].push(criteria);
    });

    // Sort and reindex each group
    Object.keys(roundGroups).forEach((round) => {
      roundGroups[round].sort((a, b) => (a.order || 0) - (b.order || 0));
      roundGroups[round].forEach((criteria, index) => {
        criteria.order = index + 1;
      });
    });

    // Cập nhật form
    form.setFieldsValue({
      criteriaCompetitionCategories: reindexedCriteria,
    });

    // Cập nhật state để kích hoạt render lại
    setCriteriaWeights({ ...criteriaWeights });

    // Thông báo xóa thành công
    message.success("Đã xóa tiêu chí");
  };
  const handleWeightChange = (criteriaId, roundType, value) => {
    const key = `${criteriaId}-${roundType}`;

    // Update the local state
    setCriteriaWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Chuyển từ phần trăm sang decimal (0-1)
    const weightValue = (parseFloat(value) || 0) / 100;

    const currentCriteria =
      form.getFieldValue("criteriaCompetitionCategories") || [];

    const updatedCriteria = currentCriteria.map((criteria) => {
      if (
        (criteria.criteriaId === criteriaId ||
          criteria.criteria?.id === criteriaId) &&
        criteria.roundType === roundType
      ) {
        return { ...criteria, weight: weightValue };
      }
      return criteria;
    });

    form.setFieldsValue({
      criteriaCompetitionCategories: updatedCriteria,
    });
  };
  // Handle referee selection
  const handleRefereeChange = (selectedReferees) => {
    const currentAssignments = form.getFieldValue("refereeAssignments") || [];

    // Keep existing assignments for selected referees
    const existingAssignments = currentAssignments.filter((a) =>
      selectedReferees.includes(a.refereeAccount?.id || a.refereeAccountId)
    );

    // Add new referees without assignments
    const existingRefereeIds = existingAssignments.map(
      (a) => a.refereeAccount?.id || a.refereeAccountId
    );

    const newAssignments = selectedReferees
      .filter((id) => !existingRefereeIds.includes(id))
      .map((id) => ({
        refereeAccountId: id,
        refereeAccount: referee.find((r) => r.id === id),
        roundType: null,
      }));

    form.setFieldsValue({
      refereeAssignments: [...existingAssignments, ...newAssignments],
    });
  };

  // Handle referee round assignment
  const handleRefereeRoundChange = (refereeId, selectedRounds) => {
    const currentAssignments = form.getFieldValue("refereeAssignments") || [];

    // Lọc ra các phân công của trọng tài khác
    const otherAssignments = currentAssignments.filter(
      (a) => (a.refereeAccount?.id || a.refereeAccountId) !== refereeId
    );

    // Nếu không có vòng nào được chọn, loại bỏ trọng tài này
    if (!selectedRounds || selectedRounds.length === 0) {
      form.setFieldsValue({
        refereeAssignments: otherAssignments,
      });
      return;
    }

    const newAssignments = selectedRounds.map((round) => {
      const existingAssignment = currentAssignments.find(
        (a) =>
          (a.refereeAccount?.id || a.refereeAccountId) === refereeId &&
          a.roundType === round
      );

      if (existingAssignment) {
        return existingAssignment;
      } else {
        return {
          refereeAccountId: refereeId,
          refereeAccount: referee.find((r) => r.id === refereeId),
          roundType: round,
        };
      }
    });

    form.setFieldsValue({
      refereeAssignments: [...otherAssignments, ...newAssignments],
    });
  };
  const getRefereeRounds = (refereeId) => {
    const assignments = form.getFieldValue("refereeAssignments") || [];
    return assignments
      .filter((a) => (a.refereeAccount?.id || a.refereeAccountId) === refereeId)
      .map((a) => a.roundType);
  };

  const handleAddSubRound = (mainRound) => {
    const currentRounds = form.getFieldValue("rounds") || [];

    const roundsOfType = currentRounds.filter(
      (round) => round && round.roundType === mainRound
    );
    const maxOrder = roundsOfType.reduce(
      (max, round) => Math.max(max, round.roundOrder || 0),
      0
    );

    // Xác định giá trị mặc định cho numberOfRegistrationToAdvance
    let defaultNumberToAdvance = 0;

    // Với vòng Preliminary luôn đặt null
    if (mainRound === "Preliminary") {
      defaultNumberToAdvance = null;
    }
    // Với vòng Final, chỉ vòng đầu tiên khi có từ 2 vòng trở lên mới cần nhập
    else if (mainRound === "Final") {
      const finalRoundsCount = roundsOfType.length + 1; // +1 vì đang thêm vòng mới
      const isFirstRound = maxOrder + 1 === 1;

      if (finalRoundsCount < 2 || !isFirstRound) {
        defaultNumberToAdvance = null;
      }
    }

    const newRound = {
      name: `Vòng ${maxOrder + 1}`,
      roundOrder: maxOrder + 1,
      roundType: mainRound,
      numberOfRegistrationToAdvance: defaultNumberToAdvance,
      status: "pending",
    };

    form.setFieldsValue({
      rounds: [...currentRounds, newRound],
    });
  };

  // Xóa vòng thi
  const handleRemoveRound = (fieldName) => {
    const currentRounds = form.getFieldValue("rounds");
    const newRounds = currentRounds.filter((_, index) => index !== fieldName);
    form.setFieldsValue({ rounds: newRounds });
  };

  const handleShowAddCriteriaModal = (roundType) => {
    setSelectedRoundForCriteria(roundType);
    setTempSelectedCriteria([]);
  };

  // Add a sort function for award types by priority
  const getAwardTypeOrder = (type) => {
    switch (type) {
      case "first":
        return 1;
      case "second":
        return 2;
      case "third":
        return 3;
      case "honorable":
        return 4;
      default:
        return 99; // Unknown types at the end
    }
  };

  // Sort awards by their type
  const sortAwardsByType = (awards) => {
    return [...awards].sort(
      (a, b) => getAwardTypeOrder(a.awardType) - getAwardTypeOrder(b.awardType)
    );
  };

  // Thêm handler chuyên biệt cho việc thay đổi giá trị giải thưởng
  const handleAwardPrizeValueChange = (value, fieldName) => {
    if (value < 0) {
      message.error("Giá trị giải thưởng không được nhỏ hơn 0");
      return;
    }

    if (value > 100000000000) {
      message.error("Giá trị giải thưởng không được vượt quá 100 tỷ VND!");
      return;
    }

    // Cập nhật giá trị trong form
    const currentAwards = form.getFieldValue("awards") || [];
    form.setFieldsValue({
      awards: currentAwards.map((award, index) =>
        index === fieldName ? { ...award, prizeValue: value } : award
      ),
    });

    // Validate giá trị giải thưởng theo thứ tự: Nhất > Nhì > Ba > Khuyến Khích
    if (value) {
      const currentAward = currentAwards[fieldName];
      const allAwards = currentAwards;

      // Cập nhật state lỗi
      const newAwardErrors = { ...awardErrors };

      // Xóa lỗi cũ trước khi kiểm tra lại
      newAwardErrors[fieldName] = "";

      // Kiểm tra giá trị giải thưởng dựa trên loại giải
      if (currentAward.awardType === "first") {
        // Giải Nhất phải có giá trị cao nhất
        const hasInvalidValue = allAwards.some(
          (award) =>
            award.awardType !== "first" &&
            award.prizeValue &&
            Number(award.prizeValue) >= Number(value)
        );

        if (hasInvalidValue) {
          newAwardErrors[fieldName] = "Giải Nhất phải có giá trị cao nhất";
        }
      } else if (currentAward.awardType === "second") {
        // Giải Nhì phải nhỏ hơn giải Nhất và lớn hơn giải Ba, Khuyến Khích
        const firstAward = allAwards.find(
          (award) => award.awardType === "first"
        );

        if (
          firstAward &&
          firstAward.prizeValue &&
          Number(value) >= Number(firstAward.prizeValue)
        ) {
          newAwardErrors[fieldName] =
            "Giải Nhì phải có giá trị nhỏ hơn Giải Nhất";
        } else {
          const hasLowerAwardWithHigherValue = allAwards.some(
            (award) =>
              (award.awardType === "third" ||
                award.awardType === "honorable") &&
              award.prizeValue &&
              Number(award.prizeValue) >= Number(value)
          );

          if (hasLowerAwardWithHigherValue) {
            newAwardErrors[fieldName] =
              "Giải Nhì phải có giá trị cao hơn Giải Ba và Giải Khuyến Khích";
          }
        }
      } else if (currentAward.awardType === "third") {
        // Giải Ba phải nhỏ hơn giải Nhì và lớn hơn giải Khuyến Khích
        const secondAward = allAwards.find(
          (award) => award.awardType === "second"
        );

        if (
          secondAward &&
          secondAward.prizeValue &&
          Number(value) >= Number(secondAward.prizeValue)
        ) {
          newAwardErrors[fieldName] =
            "Giải Ba phải có giá trị nhỏ hơn Giải Nhì";
        } else {
          const hasHonorableWithHigherValue = allAwards.some(
            (award) =>
              award.awardType === "honorable" &&
              award.prizeValue &&
              Number(award.prizeValue) >= Number(value)
          );

          if (hasHonorableWithHigherValue) {
            newAwardErrors[fieldName] =
              "Giải Ba phải có giá trị cao hơn Giải Khuyến Khích";
          }
        }
      } else if (currentAward.awardType === "honorable") {
        // Giải Khuyến Khích phải có giá trị thấp nhất
        const hasHigherAward = allAwards.some(
          (award) =>
            (award.awardType === "first" ||
              award.awardType === "second" ||
              award.awardType === "third") &&
            award.prizeValue &&
            Number(award.prizeValue) <= Number(value)
        );

        if (hasHigherAward) {
          newAwardErrors[fieldName] =
            "Giải Khuyến Khích phải có giá trị thấp nhất";
        }
      }

      setAwardErrors(newAwardErrors);
    }
  };

  return (
    <Modal
      open={true}
      title="Chỉnh sửa Hạng Mục"
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="back" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          icon={<SaveOutlined />}
        >
          Lưu
        </Button>,
      ]}
    >
      {isLoading || isLoadingVariety ? (
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane tab="Thông tin cơ bản" key="1">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="name"
                    label="Tên hạng mục"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên hạng mục",
                      },
                      {
                        max: 100,
                        message: "Tên hạng mục không được vượt quá 100 ký tự!",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Nhập tên hạng mục"
                      maxLength={100}
                      showCount
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="categoryVarieties"
                    label="Chọn loại cá Koi"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ít nhất một loại cá Koi",
                      },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn loại cá Koi"
                      loading={isLoadingVariety}
                    >
                      {variety.map((item) => (
                        <Option key={item.id} value={item.id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sizeMin"
                    label="Kích thước tối thiểu (cm)"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập kích thước tối thiểu",
                      },
                      {
                        type: "number",
                        max: 100,
                        message:
                          "Kích thước tối thiểu không được vượt quá 100cm!",
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      className="w-full"
                      placeholder="Nhập kích thước tối thiểu"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sizeMax"
                    label="Kích thước tối đa (cm)"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập kích thước tối đa",
                      },
                      {
                        type: "number",
                        max: 100,
                        message: "Kích thước tối đa không được vượt quá 100cm!",
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      className="w-full"
                      placeholder="Nhập kích thước tối đa"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="minEntries"
                    label="Số lượng tham gia tối thiểu"
                    rules={[
                      {
                        type: "number",
                        max: 1000,
                        message:
                          "Số lượng tham gia tối thiểu không được vượt quá 1000!",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={1000}
                      className="w-full"
                      placeholder="Nhập số lượng tối thiểu"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="maxEntries"
                    label="Số lượng tham gia tối đa"
                    rules={[
                      {
                        type: "number",
                        max: 1000,
                        message:
                          "Số lượng tham gia tối đa không được vượt quá 1000!",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={1000}
                      className="w-full"
                      placeholder="Nhập số lượng tối đa"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="registrationFee"
                    label="Phí tham gia"
                    rules={[
                      {
                        type: "number",
                        max: 10000000,
                        message:
                          "Phí đăng ký không được vượt quá 10 triệu VND!",
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={10000000}
                      placeholder="Nhập phí tham gia"
                      className="w-full"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="hasTank" label="Có bể trưng bày">
                    <Select placeholder="Chọn có/không">
                      <Option value={true}>Có</Option>
                      <Option value={false}>Không</Option>
                    </Select>
                  </Form.Item>
                </Col>
                {/* <Col span={12}>
                  <Form.Item name="status" label="Trạng thái">
                    <Select>
                      <Option value="pending">Chờ duyệt</Option>
                      <Option value="approved">Đã duyệt</Option>
                      <Option value="upcoming">Sắp diễn ra</Option>
                    </Select>
                  </Form.Item>
                </Col> */}
                <Col span={24}>
                  <Form.Item name="description" label="Mô tả">
                    <TextArea rows={4} placeholder="Nhập mô tả" />
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Vòng Thi Đấu" key="2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Các loại vòng thi
                </label>
                {mainRounds.map((round) => (
                  <div key={round.value} className="mb-4">
                    <div className="flex justify-between items-center p-2 border rounded-md">
                      <span className="font-semibold">{round.label}</span>
                      <span
                        className="cursor-pointer text-blue-500 hover:text-blue-700 flex items-center"
                        onClick={() => handleAddSubRound(round.value)}
                      >
                        <PlusOutlined className="mr-1" />
                      </span>
                    </div>

                    {/* Display sub-rounds */}
                    <Form.List name="rounds">
                      {(fields) => {
                        // Filter rounds by type
                        const roundsOfType = fields.filter(
                          (field) =>
                            form.getFieldValue([
                              "rounds",
                              field.name,
                              "roundType",
                            ]) === round.value
                        );

                        return (
                          <>
                            {roundsOfType.length > 0 ? (
                              <Collapse className="mt-2">
                                {roundsOfType
                                  .sort((a, b) => {
                                    const orderA =
                                      form.getFieldValue([
                                        "rounds",
                                        a.name,
                                        "roundOrder",
                                      ]) || 0;
                                    const orderB =
                                      form.getFieldValue([
                                        "rounds",
                                        b.name,
                                        "roundOrder",
                                      ]) || 0;
                                    return orderA - orderB;
                                  })
                                  .map((field) => (
                                    <Panel
                                      header={form.getFieldValue([
                                        "rounds",
                                        field.name,
                                        "name",
                                      ])}
                                      key={field.key}
                                      extra={
                                        <span
                                          className="text-red-500 cursor-pointer hover:text-red-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveRound(field.name);
                                          }}
                                        >
                                          <DeleteOutlined />
                                        </span>
                                      }
                                    >
                                      <Space
                                        direction="vertical"
                                        style={{ width: "100%" }}
                                      >
                                        <div>
                                          <Form.Item
                                            name={[field.name, "name"]}
                                            label="Tên Vòng"
                                            rules={[
                                              {
                                                required: true,
                                                message:
                                                  "Vui lòng nhập tên vòng",
                                              },
                                            ]}
                                          >
                                            <Input placeholder="Nhập tên vòng" />
                                          </Form.Item>
                                        </div>

                                        {/* <div>
                                        <Form.Item
                                          name={[field.name, "roundOrder"]}
                                          label="Thứ tự vòng"
                                          rules={[
                                            {
                                              required: true,
                                              message:
                                                "Vui lòng nhập thứ tự vòng",
                                            },
                                          ]}
                                        >
                                          <InputNumber
                                            min={1}
                                            className="w-full"
                                          />
                                        </Form.Item>
                                      </div> */}

                                        <div>
                                          {!(
                                            // Vòng sơ khảo luôn ẩn
                                            (
                                              form.getFieldValue([
                                                "rounds",
                                                field.name,
                                                "roundType",
                                              ]) === "Preliminary" ||
                                              // Vòng chung kết chỉ hiện khi có 2 vòng trở lên và là vòng 1
                                              (form.getFieldValue([
                                                "rounds",
                                                field.name,
                                                "roundType",
                                              ]) === "Final" &&
                                                (form
                                                  .getFieldValue("rounds")
                                                  ?.filter(
                                                    (r) =>
                                                      r?.roundType === "Final"
                                                  )?.length < 2 ||
                                                  form.getFieldValue([
                                                    "rounds",
                                                    field.name,
                                                    "roundOrder",
                                                  ]) !== 1))
                                            )
                                          ) && (
                                            <Form.Item
                                              name={[
                                                field.name,
                                                "numberOfRegistrationToAdvance",
                                              ]}
                                              label="Số lượng cá qua vòng"
                                            >
                                              <InputNumber
                                                min={0}
                                                max={100}
                                                className="w-full"
                                                parser={(value) => {
                                                  const parsed = parseInt(
                                                    value,
                                                    10
                                                  );
                                                  return isNaN(parsed)
                                                    ? 0
                                                    : parsed;
                                                }}
                                              />
                                            </Form.Item>
                                          )}
                                        </div>

                                        {/* <div>
                                        <Form.Item
                                          name={[field.name, "status"]}
                                          label="Trạng thái"
                                        >
                                          <Select>
                                            <Option value="pending">
                                              Chờ duyệt
                                            </Option>
                                            <Option value="active">
                                              Đang diễn ra
                                            </Option>
                                            <Option value="completed">
                                              Hoàn thành
                                            </Option>
                                          </Select>
                                        </Form.Item>
                                      </div> */}
                                      </Space>
                                    </Panel>
                                  ))}
                              </Collapse>
                            ) : (
                              <div className="text-center text-gray-500 py-4 mt-2 border border-dashed rounded-md">
                                Không có vòng thi nào thuộc {round.label}.
                              </div>
                            )}
                          </>
                        );
                      }}
                    </Form.List>
                  </div>
                ))}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Giải thưởng" key="3">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-bold m-0">Danh sách giải thưởng</h3>

                <Tooltip title="Thêm giải thưởng">
                  <PlusOutlined onClick={handleAddAward} />{" "}
                </Tooltip>
              </div>

              <Form.List name="awards">
                {(fields) => {
                  // Sort fields by award type - this is just for display
                  const sortedFields = fields
                    .map((field) => ({
                      field,
                      award: form.getFieldValue(["awards", field.name]),
                    }))
                    .sort((a, b) => {
                      const typeA = a.award?.awardType || "";
                      const typeB = b.award?.awardType || "";
                      return (
                        getAwardTypeOrder(typeA) - getAwardTypeOrder(typeB)
                      );
                    });

                  return (
                    <div>
                      {sortedFields.map(({ field }, index) => (
                        <Card
                          key={field.key}
                          title={(() => {
                            const awardType = form.getFieldValue([
                              "awards",
                              field.name,
                              "awardType",
                            ]);
                            switch (awardType) {
                              case "first":
                                return "Giải Nhất";
                              case "second":
                                return "Giải Nhì";
                              case "third":
                                return "Giải Ba";
                              case "honorable":
                                return "Giải Khuyến Khích";
                              default:
                                return `Giải thưởng ${index + 1}`;
                            }
                          })()}
                          className="mb-3"
                          size="small"
                          extra={
                            <Space>
                              {editingAwardIndex === field.name ? (
                                <Tooltip title="Lưu">
                                  <Button
                                    type="text"
                                    icon={
                                      <CheckOutlined
                                        style={{ color: "#52c41a" }}
                                      />
                                    }
                                    onClick={handleSaveAward}
                                  />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Chỉnh sửa">
                                  <Button
                                    type="text"
                                    icon={
                                      <EditOutlined
                                        style={{ color: "#1890ff" }}
                                      />
                                    }
                                    onClick={() => handleEditAward(field.name)}
                                  />
                                </Tooltip>
                              )}
                              <Tooltip title="Xóa">
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveAward(field.name)}
                                />
                              </Tooltip>
                            </Space>
                          }
                        >
                          {editingAwardIndex === field.name ? (
                            <Row gutter={16}>
                              {/* Hide the name field from UI, but keep it in form data */}
                              <Form.Item
                                name={[field.name, "name"]}
                                hidden={true}
                              >
                                <Input />
                              </Form.Item>
                              <Col span={12}>
                                <Form.Item
                                  name={[field.name, "awardType"]}
                                  label="Loại giải thưởng"
                                  rules={[
                                    {
                                      required: true,
                                      message: "Vui lòng nhập loại giải thưởng",
                                    },
                                  ]}
                                >
                                  <Select
                                    placeholder="Chọn loại giải thưởng"
                                    onChange={(value) =>
                                      handleAwardTypeChange(value, field.name)
                                    }
                                  >
                                    <Option value="first">Giải Nhất</Option>
                                    <Option value="second">Giải Nhì</Option>
                                    <Option value="third">Giải Ba</Option>
                                    <Option value="honorable">
                                      Giải Khuyến Khích
                                    </Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item
                                  name={[field.name, "prizeValue"]}
                                  label="Giá trị giải thưởng"
                                  rules={[
                                    {
                                      required: true,
                                      message:
                                        "Vui lòng nhập giá trị giải thưởng",
                                    },
                                    {
                                      type: "number",
                                      max: 100000000000,
                                      message:
                                        "Giá trị giải thưởng không được vượt quá 100 tỷ VND!",
                                    },
                                  ]}
                                >
                                  <InputNumber
                                    placeholder="Nhập giá trị (VND)"
                                    min={0}
                                    max={100000000000}
                                    formatter={(value) =>
                                      `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                      )
                                    }
                                    parser={(value) =>
                                      value.replace(/\$\s?|(,*)/g, "")
                                    }
                                    className="w-full"
                                    onChange={(value) =>
                                      handleAwardPrizeValueChange(
                                        value,
                                        field.name
                                      )
                                    }
                                  />
                                </Form.Item>
                                {awardErrors[field.name] && (
                                  <div className="text-red-500 text-xs mb-2 mt-1">
                                    {awardErrors[field.name]}
                                  </div>
                                )}
                              </Col>
                              <Col span={24}>
                                <Form.Item
                                  name={[field.name, "description"]}
                                  label="Mô tả giải thưởng"
                                >
                                  <TextArea
                                    rows={2}
                                    placeholder="Nhập mô tả giải thưởng"
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          ) : (
                            <Descriptions column={1} size="small">
                              {/* Don't show name field in view mode */}
                              <Descriptions.Item label="Loại giải thưởng">
                                {(() => {
                                  const awardType = form.getFieldValue([
                                    "awards",
                                    field.name,
                                    "awardType",
                                  ]);
                                  switch (awardType) {
                                    case "first":
                                      return "Giải Nhất";
                                    case "second":
                                      return "Giải Nhì";
                                    case "third":
                                      return "Giải Ba";
                                    case "honorable":
                                      return "Giải Khuyến Khích";
                                    default:
                                      return awardType;
                                  }
                                })()}
                              </Descriptions.Item>
                              <Descriptions.Item label="Giá trị">
                                {form
                                  .getFieldValue([
                                    "awards",
                                    field.name,
                                    "prizeValue",
                                  ])
                                  .toLocaleString()}
                                VND
                              </Descriptions.Item>
                              {awardErrors[field.name] && (
                                <Descriptions.Item className="text-red-500 text-xs">
                                  {awardErrors[field.name]}
                                </Descriptions.Item>
                              )}
                              <Descriptions.Item label="Mô tả">
                                {form.getFieldValue([
                                  "awards",
                                  field.name,
                                  "description",
                                ])}
                              </Descriptions.Item>
                            </Descriptions>
                          )}
                        </Card>
                      ))}

                      {fields.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          Chưa có giải thưởng nào. Vui lòng thêm giải thưởng.
                        </div>
                      )}
                    </div>
                  );
                }}
              </Form.List>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Tiêu chí đánh giá" key="4">
              <div className="mb-4">
                <h3 className="text-lg font-bold m-0">Danh Sách Tiêu Chí</h3>
              </div>

              {/* Danh sách tiêu chí */}
              <Tabs tabPosition="left">
                {mainRounds.map((round) => {
                  const criteriaInRound = (
                    form.getFieldValue("criteriaCompetitionCategories") || []
                  )
                    .filter((c) => c.roundType === round.value)
                    .sort((a, b) => a.order - b.order);

                  return (
                    <Tabs.TabPane tab={round.label} key={round.value}>
                      {criteriaInRound.length > 0 ? (
                        <List
                          dataSource={criteriaInRound}
                          renderItem={(item) => (
                            <List.Item
                              key={
                                item.id ||
                                `${item.criteriaId}-${item.roundType}`
                              }
                              actions={[
                                <InputNumber
                                  min={0}
                                  max={100}
                                  formatter={(value) => `${value}%`}
                                  parser={(value) => value.replace("%", "")}
                                  value={
                                    criteriaWeights[
                                      `${item.criteriaId || item.criteria?.id}-${item.roundType}`
                                    ] !== undefined
                                      ? criteriaWeights[
                                          `${item.criteriaId || item.criteria?.id}-${item.roundType}`
                                        ]
                                      : (item.weight * 100).toFixed(0)
                                  }
                                  onChange={(value) =>
                                    handleWeightChange(
                                      item.criteriaId || item.criteria?.id,
                                      item.roundType,
                                      value
                                    )
                                  }
                                  className="w-24"
                                />,
                                <Tooltip title="Xóa tiêu chí">
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      handleRemoveCriteria(
                                        item.criteriaId || item.criteria?.id,
                                        item.roundType
                                      )
                                    }
                                    size="small"
                                  />
                                </Tooltip>,
                              ]}
                            >
                              <List.Item.Meta
                                title={`${item.order}. ${
                                  item.criteria?.name ||
                                  "Tiêu chí không xác định"
                                }`}
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <div className="text-center text-gray-500 rounded-md">
                          Chưa có tiêu chí nào cho {round.label}
                        </div>
                      )}

                      {/* Luôn hiển thị nút thêm tiêu chí, không cần điều kiện editingCriteria */}
                      <div className="flex justify-center mt-3">
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() =>
                            handleShowAddCriteriaModal(round.value)
                          }
                        >
                          Thêm tiêu chí cho {round.label}
                        </Button>
                      </div>
                    </Tabs.TabPane>
                  );
                })}
              </Tabs>

              {/* Modal thêm tiêu chí cho vòng được chọn - không phụ thuộc vào editingCriteria */}
              <Modal
                title={`Thêm tiêu chí cho ${roundLabelMap[selectedRoundForCriteria] || ""}`}
                open={selectedRoundForCriteria !== null}
                onOk={() => handleAddCriteriaToRound(selectedRoundForCriteria)}
                onCancel={() => setSelectedRoundForCriteria(null)}
                okText="Thêm"
                cancelText="Hủy"
              >
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn tiêu chí
                  </label>
                  <Select
                    mode="multiple"
                    placeholder="Chọn tiêu chí"
                    className="w-full mb-2"
                    onChange={handleCriteriaSelection}
                    loading={isLoadingCriteria}
                  >
                    {criteria
                      .filter((item) => {
                        // Get current criteria for the selected round
                        const existingCriteria = (
                          form.getFieldValue("criteriaCompetitionCategories") ||
                          []
                        )
                          .filter(
                            (c) => c.roundType === selectedRoundForCriteria
                          )
                          .map((c) => c.criteriaId || c.criteria?.id);

                        // Only show criteria that are not already assigned to this round
                        return !existingCriteria.includes(item.id);
                      })
                      .map((item) => (
                        <Option key={item.id} value={item.id}>
                          {item.name}
                        </Option>
                      ))}
                  </Select>
                </div>

                {tempSelectedCriteria.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thiết lập trọng số cho tiêu chí
                    </label>
                    <div className="space-y-2 ">
                      {tempSelectedCriteria.map((criteriaItem, index) => {
                        const criteriaInfo = criteria.find(
                          (c) => c.id === criteriaItem.criteriaId
                        );
                        return (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                          >
                            <span className="flex-1">
                              {criteriaInfo?.name ||
                                criteriaItem.criteriaName ||
                                criteriaItem.criteriaId}
                            </span>
                            <InputNumber
                              min={0}
                              max={100}
                              formatter={(value) => `${value}%`}
                              parser={(value) => value.replace("%", "")}
                              value={(criteriaItem.weight * 100).toFixed(0)}
                              onChange={(value) => {
                                const updatedCriteria = [
                                  ...tempSelectedCriteria,
                                ];
                                updatedCriteria[index].weight =
                                  Number(value) / 100;
                                setTempSelectedCriteria(updatedCriteria);
                              }}
                              className="w-24"
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                const updatedCriteria = [
                                  ...tempSelectedCriteria,
                                ];
                                updatedCriteria.splice(index, 1);
                                setTempSelectedCriteria(updatedCriteria);
                              }}
                              size="small"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Modal>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Trọng tài" key="5">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-bold m-0">Danh Sách Trọng Tài</h3>
                {!editingReferees ? (
                  <Tooltip title="Chỉnh sửa trọng tài">
                    <Button
                      type="text"
                      icon={<EditOutlined style={{ color: "#1890ff" }} />}
                      onClick={() => setEditingReferees(true)}
                    />
                  </Tooltip>
                ) : (
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() => setEditingReferees(false)}
                  >
                    Hoàn tất
                  </Button>
                )}
              </div>

              <Form.List name="refereeAssignments">
                {(fields) => {
                  // Group referees to avoid duplicates
                  const refereeIds = fields
                    .map(
                      (field) =>
                        form.getFieldValue([
                          "refereeAssignments",
                          field.name,
                          "refereeAccount",
                        ])?.id ||
                        form.getFieldValue([
                          "refereeAssignments",
                          field.name,
                          "refereeAccountId",
                        ])
                    )
                    .filter(Boolean) // Remove null/undefined
                    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

                  return (
                    <div>
                      {/* Chọn trọng tài - chỉ hiển thị khi đang chỉnh sửa */}
                      {editingReferees && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chọn trọng tài
                          </label>
                          <Select
                            mode="multiple"
                            placeholder="Chọn trọng tài"
                            className="w-full mb-2"
                            value={refereeIds}
                            onChange={handleRefereeChange}
                          >
                            {referee.map((r) => (
                              <Option key={r.id} value={r.id}>
                                {r.fullName}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      )}

                      {/* Hiển thị danh sách trọng tài */}
                      <Collapse className="mb-4">
                        {refereeIds.map((refereeId) => {
                          const refereeInfo = referee.find(
                            (r) => r.id === refereeId
                          );
                          const assignedRounds =
                            getRefereeRounds(refereeId).filter(Boolean);

                          return (
                            <Collapse.Panel
                              key={refereeId}
                              header={`Trọng tài: ${
                                refereeInfo?.fullName || "Không xác định"
                              }`}
                              extra={
                                editingReferees && (
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefereeChange(
                                        refereeIds.filter(
                                          (id) => id !== refereeId
                                        )
                                      );
                                    }}
                                    size="small"
                                  />
                                )
                              }
                            >
                              {editingReferees ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chọn vòng chấm điểm cho trọng tài này
                                  </label>
                                  <Select
                                    mode="multiple"
                                    className="w-full"
                                    value={assignedRounds}
                                    onChange={(value) =>
                                      handleRefereeRoundChange(refereeId, value)
                                    }
                                    placeholder="Chọn vòng chấm điểm"
                                  >
                                    {mainRounds.map((round) => (
                                      <Option
                                        key={round.value}
                                        value={round.value}
                                      >
                                        {round.label}
                                      </Option>
                                    ))}
                                  </Select>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm">
                                    <strong>Email:</strong> {refereeInfo?.email}
                                  </p>
                                  <div className="mt-2 flex">
                                    <p className="text-sm mb-1">
                                      <strong>Vòng chấm điểm:</strong>
                                    </p>
                                    <div className="flex">
                                      {assignedRounds.length > 0 ? (
                                        assignedRounds.map((round) => (
                                          <Tag
                                            key={round}
                                            color={
                                              round === "Preliminary"
                                                ? "orange"
                                                : round === "Evaluation"
                                                  ? "blue"
                                                  : round === "Final"
                                                    ? "green"
                                                    : "default"
                                            }
                                            className="mr-1 mb-1"
                                          >
                                            {roundLabelMap[round] || round}
                                          </Tag>
                                        ))
                                      ) : (
                                        <span className="text-gray-500 text-sm">
                                          Chưa được phân công vòng nào
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Collapse.Panel>
                          );
                        })}

                        {refereeIds.length === 0 && (
                          <div className="text-center text-gray-500 py-4 border border-dashed rounded-md">
                            Chưa có trọng tài nào được chọn
                          </div>
                        )}
                      </Collapse>
                    </div>
                  );
                }}
              </Form.List>
            </Tabs.TabPane>
          </Tabs>
        </Form>
      )}
    </Modal>
  );
}

export default EditCategory;
