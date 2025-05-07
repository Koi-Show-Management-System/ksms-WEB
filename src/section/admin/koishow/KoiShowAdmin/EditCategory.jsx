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
  notification,
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

// Thêm constants cho validation
const MAX_NAME_LENGTH = 100;
const MAX_SIZE = 100;
const MAX_REGISTRATION_FEE = 10000000; // 10 million VND
const MAX_ENTRIES = 1000;
const MAX_PRIZE_VALUE = 100000000000; // 100 billion VND

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
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [isOpenAddCriteriaModal, setIsOpenAddCriteriaModal] = useState(false);
  const [infoStep, setInfoStep] = useState("general");
  const [roundTypeForCriteria, setRoundTypeForCriteria] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [editingAwardIndex, setEditingAwardIndex] = useState(null);
  const [editingCriteria, setEditingCriteria] = useState(false);
  const [editingReferees, setEditingReferees] = useState(false);
  const [tempSelectedCriteria, setTempSelectedCriteria] = useState([]);
  const [selectedRoundForCriteria, setSelectedRoundForCriteria] =
    useState(null);
  const [awardErrors, setAwardErrors] = useState({});
  const [evaluationOneNumber, setEvaluationOneNumber] = useState(1);
  const [evaluationTwoNumber, setEvaluationTwoNumber] = useState(1);
  const [roundsErrors, setRoundsErrors] = useState({});

  const referee = (accountManage.referees || []).filter(
    (r) => r.status === "active"
  );

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

  // Clean up any criteria for Preliminary round
  useEffect(() => {
    if (currentCategory?.criteriaCompetitionCategories?.length > 0) {
      // Remove any criteria for Preliminary round
      const filteredCriteria =
        currentCategory.criteriaCompetitionCategories.filter(
          (criteria) => criteria.roundType !== "Preliminary"
        );

      // Update form with filtered criteria
      form.setFieldsValue({
        criteriaCompetitionCategories: filteredCriteria,
      });
    }
  }, [currentCategory, form]);

  useEffect(() => {
    if (currentCategory && currentCategory.rounds) {
      const evaluationRound1 = currentCategory.rounds.find(
        (r) => r.roundType === "Evaluation" && r.roundOrder === 1
      );
      const evaluationRound2 = currentCategory.rounds.find(
        (r) => r.roundType === "Evaluation" && r.roundOrder === 2
      );

      if (evaluationRound1 && evaluationRound1.numberOfRegistrationToAdvance) {
        setEvaluationOneNumber(evaluationRound1.numberOfRegistrationToAdvance);
      }

      if (evaluationRound2 && evaluationRound2.numberOfRegistrationToAdvance) {
        setEvaluationTwoNumber(evaluationRound2.numberOfRegistrationToAdvance);
      }
    }
  }, [currentCategory]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = form.getFieldsValue(true);

      // Validate tên hạng mục
      if (values.name && values.name.length > MAX_NAME_LENGTH) {
        message.error(
          `Tên hạng mục không được vượt quá ${MAX_NAME_LENGTH} ký tự!`
        );
        setActiveTab("1");
        return;
      }

      // Validate kích thước
      if (
        values.sizeMin &&
        values.sizeMax &&
        parseFloat(values.sizeMin) >= parseFloat(values.sizeMax)
      ) {
        message.error("Kích thước tối thiểu phải nhỏ hơn kích thước tối đa!");
        setActiveTab("1");
        return;
      }

      if (values.sizeMin > MAX_SIZE) {
        message.error(
          `Kích thước tối thiểu không được vượt quá ${MAX_SIZE}cm!`
        );
        setActiveTab("1");
        return;
      }

      if (values.sizeMax > MAX_SIZE) {
        message.error(`Kích thước tối đa không được vượt quá ${MAX_SIZE}cm!`);
        setActiveTab("1");
        return;
      }

      // Validate phí đăng ký
      if (values.registrationFee > MAX_REGISTRATION_FEE) {
        message.error(
          `Phí đăng ký không được vượt quá ${MAX_REGISTRATION_FEE.toLocaleString("vi-VN")} VND (10 triệu)!`
        );
        setActiveTab("1");
        return;
      }

      // Validate số lượng tham gia
      if (
        values.minEntries &&
        values.maxEntries &&
        parseInt(values.minEntries) > parseInt(values.maxEntries)
      ) {
        message.error(
          "Số lượng tham gia tối thiểu phải nhỏ hơn hoặc bằng số lượng tối đa!"
        );
        setActiveTab("1");
        return;
      }

      if (values.minEntries > MAX_ENTRIES) {
        message.error(
          `Số lượng tham gia tối thiểu không được vượt quá ${MAX_ENTRIES}!`
        );
        setActiveTab("1");
        return;
      }

      if (values.maxEntries > MAX_ENTRIES) {
        message.error(
          `Số lượng tham gia tối đa không được vượt quá ${MAX_ENTRIES}!`
        );
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
        // Skip validation for Preliminary round
        if (roundType === "Preliminary") return;

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

      // Cập nhật số cá qua vòng từ state vào rounds
      if (formData.rounds && formData.rounds.length > 0) {
        const updatedRounds = formData.rounds.map((round) => {
          if (round.roundType === "Evaluation" && round.roundOrder === 1) {
            return {
              ...round,
              numberOfRegistrationToAdvance: evaluationOneNumber,
            };
          } else if (
            round.roundType === "Evaluation" &&
            round.roundOrder === 2
          ) {
            return {
              ...round,
              numberOfRegistrationToAdvance: evaluationTwoNumber,
            };
          }
          return round;
        });
        formData.rounds = updatedRounds;
      }

      // Validate số cá qua vòng
      if (evaluationOneNumber < 1) {
        message.error("Số cá qua vòng Đánh Giá 1 phải từ 1 trở lên");
        setActiveTab("2");
        return;
      }

      if (evaluationTwoNumber < 1) {
        message.error("Số cá qua vòng Đánh Giá 2 phải từ 1 trở lên");
        setActiveTab("2");
        return;
      }

      if (evaluationTwoNumber >= evaluationOneNumber) {
        message.error("Số cá qua vòng Đánh Giá 2 phải nhỏ hơn vòng Đánh Giá 1");
        setActiveTab("2");
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

  const validateAwards = (awards) => {
    if (!awards || awards.length === 0) {
      message.error("Vui lòng thêm ít nhất một giải thưởng");
      return false;
    }

    // Check if any award doesn't have a type selected
    const awardsMissingType = awards.filter((award) => !award.awardType);
    if (awardsMissingType.length > 0) {
      message.error(
        "Vui lòng chọn loại giải thưởng cho tất cả giải thưởng đã thêm"
      );
      return false;
    }

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

    // Kiểm tra số lượng giải thưởng đã có
    const hasFirst = currentAwards.some((award) => award.awardType === "first");
    const hasSecond = currentAwards.some(
      (award) => award.awardType === "second"
    );
    const hasThird = currentAwards.some((award) => award.awardType === "third");
    const hasHonorable = currentAwards.some(
      (award) => award.awardType === "honorable"
    );

    // Nếu đã có đủ 4 loại giải thưởng thì không cho thêm nữa
    if (hasFirst && hasSecond && hasThird && hasHonorable) {
      message.warning(
        "Đã có đủ 4 loại giải thưởng (Nhất, Nhì, Ba, Khuyến Khích). Không thể thêm giải thưởng mới."
      );
      return;
    }

    // Xác định loại giải thưởng tiếp theo được phép thêm
    let nextAwardType = "";
    let nextAwardName = "";

    if (!hasFirst) {
      nextAwardType = "first";
      nextAwardName = "Giải Nhất";
    } else if (!hasSecond) {
      nextAwardType = "second";
      nextAwardName = "Giải Nhì";
    } else if (!hasThird) {
      nextAwardType = "third";
      nextAwardName = "Giải Ba";
    } else if (!hasHonorable) {
      nextAwardType = "honorable";
      nextAwardName = "Giải Khuyến Khích";
    }

    form.setFieldsValue({
      awards: [
        ...currentAwards,
        {
          name: nextAwardName,
          awardType: nextAwardType,
          prizeValue: "",
          description: "",
        },
      ],
    });
    setEditingAwardIndex(currentAwards.length);
  };

  // Handle removing an award by award field name
  const handleRemoveAward = (fieldName) => {
    const currentAwards = form.getFieldValue("awards") || [];
    const awardToRemove = currentAwards[fieldName];

    // Không có giải thưởng để xóa hoặc không tìm thấy giải
    if (!awardToRemove) {
      return;
    }

    let updatedAwards = [...currentAwards];
    let indicesToDelete = [fieldName]; // Mặc định xóa giải được chọn

    // Xác định chỉ số của các giải theo loại
    const firstIndex = updatedAwards.findIndex((a) => a.awardType === "first");
    const secondIndex = updatedAwards.findIndex(
      (a) => a.awardType === "second"
    );
    const thirdIndex = updatedAwards.findIndex((a) => a.awardType === "third");
    const honorableIndex = updatedAwards.findIndex(
      (a) => a.awardType === "honorable"
    );

    if (awardToRemove.awardType === "first") {
      // Xóa tất cả các giải thưởng
      message.info("Xóa giải Nhất sẽ xóa tất cả các giải thưởng");
      updatedAwards = [];
    } else if (awardToRemove.awardType === "second") {
      // Xóa giải Nhì và tất cả giải thấp hơn
      message.info("Xóa giải Nhì sẽ xóa cả giải Ba và Khuyến Khích (nếu có)");
      if (thirdIndex !== -1) indicesToDelete.push(thirdIndex);
      if (honorableIndex !== -1) indicesToDelete.push(honorableIndex);

      // Lọc giữ lại những giải không nằm trong danh sách cần xóa
      updatedAwards = updatedAwards.filter(
        (_, index) => !indicesToDelete.includes(index)
      );
    } else if (awardToRemove.awardType === "third") {
      // Xóa giải Ba và Khuyến Khích
      message.info("Xóa giải Ba sẽ xóa cả giải Khuyến Khích (nếu có)");
      if (honorableIndex !== -1) indicesToDelete.push(honorableIndex);

      // Lọc giữ lại những giải không nằm trong danh sách cần xóa
      updatedAwards = updatedAwards.filter(
        (_, index) => !indicesToDelete.includes(index)
      );
    } else {
      // Xóa chỉ giải Khuyến Khích
      updatedAwards = updatedAwards.filter((_, index) => index !== fieldName);
    }

    form.setFieldsValue({
      awards: updatedAwards,
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

    // Update the award name based on type
    currentAwards[fieldName].name = awardName;
    currentAwards[fieldName].awardType = type;
    form.setFieldsValue({
      awards: currentAwards,
    });
  };

  // Handle criteria selection
  const handleCriteriaSelection = (values) => {
    if (!values || values.length === 0) {
      setTempSelectedCriteria([]);
      return;
    }

    const selectedCriteriaDetails = values.map((id) => {
      const criteriaInfo = criteria.find((c) => c.id === id);
      return {
        criteriaId: id,
        criteria: criteriaInfo,
        roundType: selectedRoundForCriteria, // Track the round explicitly
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

    // Ensure we're only adding criteria to the selected round
    if (roundType !== selectedRoundForCriteria) {
      message.error(
        `Lỗi: Không khớp loại vòng (${roundType} vs ${selectedRoundForCriteria})`
      );
      return;
    }

    const currentCriteria =
      form.getFieldValue("criteriaCompetitionCategories") || [];

    // Filter existing criteria by the selected round type
    const existingCriteriaInRound = currentCriteria.filter(
      (c) => c.roundType === roundType
    );

    // Check if any of the selected criteria already exist in any round
    let duplicateCriteriaNames = [];

    for (const selectedCriteria of tempSelectedCriteria) {
      // Find if this criteria exists in any round
      const existingCriteriaEntry = currentCriteria.find(
        (c) =>
          c.criteriaId === selectedCriteria.criteriaId ||
          c.criteria?.id === selectedCriteria.criteriaId
      );

      if (existingCriteriaEntry) {
        // Find the criteria info to get the name
        const criteriaInfo = criteria.find(
          (c) => c.id === selectedCriteria.criteriaId
        );
        const criteriaName =
          criteriaInfo?.name || `Tiêu chí ID: ${selectedCriteria.criteriaId}`;

        // Add to the list of duplicates with the round it's already used in
        const roundName =
          roundLabelMap[existingCriteriaEntry.roundType] ||
          existingCriteriaEntry.roundType;
        duplicateCriteriaNames.push(
          `${criteriaName} (đã dùng trong ${roundName})`
        );
      }
    }

    if (duplicateCriteriaNames.length > 0) {
      message.warning(
        `Các tiêu chí sau đã được sử dụng trong vòng khác: ${duplicateCriteriaNames.join(", ")}`
      );
      return;
    }

    // Make sure each criteria explicitly has the current round type
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
        roundType: roundType, // Ensure we're setting the round type correctly
        weight: criteriaItem.weight || 0,
        order: existingCriteriaInRound.length + index + 1,
      };
    });

    // Create a completely new array to ensure React detects the change
    const updatedCriteria = [...currentCriteria, ...newCriteria];

    form.setFieldsValue({
      criteriaCompetitionCategories: updatedCriteria,
    });

    setTempSelectedCriteria([]);
    setSelectedRoundForCriteria(null);

    // Show success message
    message.success(
      `Đã thêm ${newCriteria.length} tiêu chí vào ${roundLabelMap[roundType]}`
    );
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

    // Find the exact criteria by both criteriaId and roundType to ensure we're updating the right one
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

    // Calculate and check total weight for this round
    const criteriaInThisRound = updatedCriteria.filter(
      (c) => c.roundType === roundType
    );
    const totalWeight = criteriaInThisRound.reduce(
      (total, c) => total + (c.weight * 100 || 0),
      0
    );

    // Provide feedback about the weights
    if (Math.abs(totalWeight - 100) > 0.5) {
      message.warning(
        `Tổng trọng số cho ${roundLabelMap[roundType]} là ${totalWeight.toFixed(1)}%. Cần điều chỉnh về 100%.`
      );
    }
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

    // Check if the selected rounds includes "Preliminary"
    if (selectedRounds.includes("Preliminary")) {
      // Check if any other referee is already assigned to Preliminary
      const otherRefereeHasPreliminary = currentAssignments.some(
        (assignment) =>
          (assignment.refereeAccount?.id || assignment.refereeAccountId) !==
            refereeId && assignment.roundType === "Preliminary"
      );

      // If another referee already has Preliminary round, remove it from selectedRounds
      if (otherRefereeHasPreliminary) {
        notification.warning({
          message: "Chỉ 1 trọng tài được chấm vòng sơ khảo",
          description:
            "Đã có trọng tài khác được chọn chấm vòng sơ khảo. Mỗi hạng mục chỉ được 1 trọng tài chấm vòng sơ khảo.",
          placement: "topRight",
          duration: 5,
        });
        // Remove Preliminary from selected rounds
        selectedRounds = selectedRounds.filter(
          (round) => round !== "Preliminary"
        );
      }
    }

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
    // Don't allow adding criteria for Preliminary round
    if (roundType === "Preliminary") {
      message.info("Vòng Sơ Khảo chỉ sử dụng chấm đạt/không đạt (Pass/Fail)");
      return;
    }

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

    if (value > MAX_PRIZE_VALUE) {
      message.error(
        `Giá trị giải thưởng không được vượt quá ${MAX_PRIZE_VALUE.toLocaleString("vi-VN")} VND (100 tỷ)!`
      );
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

  // Helper function to get a specific round
  const getRound = (roundType, roundOrder) => {
    const rounds = form.getFieldValue("rounds") || [];
    return rounds.find(
      (r) => r.roundType === roundType && r.roundOrder === roundOrder
    );
  };

  // Helper function to update a round's property
  const updateRound = (roundType, roundOrder, field, value) => {
    const currentRounds = form.getFieldValue("rounds") || [];
    const rounds = [...currentRounds];

    const roundIndex = rounds.findIndex(
      (r) => r.roundType === roundType && r.roundOrder === roundOrder
    );

    if (roundIndex === -1) {
      // Nếu round chưa tồn tại, thêm các round cần thiết
      if (
        !rounds.some((r) => r.roundType === "Preliminary" && r.roundOrder === 1)
      ) {
        rounds.push({
          name: "Vòng 1",
          roundOrder: 1,
          roundType: "Preliminary",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: null,
          status: "pending",
        });
      }

      if (
        !rounds.some((r) => r.roundType === "Evaluation" && r.roundOrder === 1)
      ) {
        rounds.push({
          name: "Vòng 1",
          roundOrder: 1,
          roundType: "Evaluation",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: 1,
          status: "pending",
        });
      }

      if (
        !rounds.some((r) => r.roundType === "Evaluation" && r.roundOrder === 2)
      ) {
        rounds.push({
          name: "Vòng 2",
          roundOrder: 2,
          roundType: "Evaluation",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: 1,
          status: "pending",
        });
      }

      if (!rounds.some((r) => r.roundType === "Final" && r.roundOrder === 1)) {
        rounds.push({
          name: "Vòng 1",
          roundOrder: 1,
          roundType: "Final",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: null,
          status: "pending",
        });
      }

      // Tìm round sau khi đã thêm
      const newRoundIndex = rounds.findIndex(
        (r) => r.roundType === roundType && r.roundOrder === roundOrder
      );

      if (newRoundIndex !== -1) {
        // Cập nhật giá trị
        rounds[newRoundIndex][field] = value;
      }
    } else {
      // Cập nhật giá trị cho round đã có
      rounds[roundIndex][field] = value;
    }

    // Cập nhật vào form
    form.setFieldsValue({ rounds });
  };

  // Thêm hàm xử lý khi thay đổi số cá qua vòng 1
  const handleEvaluationOneNumberChange = (value) => {
    setEvaluationOneNumber(value);

    // Kiểm tra tính hợp lệ của vòng 2 khi cập nhật vòng 1
    if (evaluationTwoNumber >= value) {
      const newRoundsErrors = { ...roundsErrors };
      newRoundsErrors.evaluationTwo = `Số cá qua vòng ở vòng 2 (${evaluationTwoNumber}) phải nhỏ hơn số cá qua vòng ở vòng 1 (${value})`;
      setRoundsErrors(newRoundsErrors);
    } else {
      // Xóa lỗi nếu hợp lệ
      const newRoundsErrors = { ...roundsErrors };
      delete newRoundsErrors.evaluationTwo;
      setRoundsErrors(newRoundsErrors);
    }

    // Kiểm tra số cá qua vòng không vượt quá số lượng tham gia tối đa
    const maxEntries = form.getFieldValue("maxEntries");
    if (value && maxEntries && value > maxEntries) {
      const newRoundsErrors = { ...roundsErrors };
      newRoundsErrors.evaluationOne = `Số cá qua vòng (${value}) không được vượt quá số lượng tham gia tối đa (${maxEntries})`;
      setRoundsErrors(newRoundsErrors);
    } else {
      // Xóa lỗi nếu hợp lệ
      const newRoundsErrors = { ...roundsErrors };
      delete newRoundsErrors.evaluationOne;
      setRoundsErrors(newRoundsErrors);
    }
  };

  // Thay đổi hàm setEvaluationTwoNumber để kiểm tra giá trị nhập vào
  const handleEvaluationTwoNumberChange = (value) => {
    // Kiểm tra giá trị so với vòng 1
    if (value >= evaluationOneNumber) {
      const newRoundsErrors = { ...roundsErrors };
      newRoundsErrors.evaluationTwo = `Số cá qua vòng ở vòng 2 (${value}) phải nhỏ hơn số cá qua vòng ở vòng 1 (${evaluationOneNumber})`;
      setRoundsErrors(newRoundsErrors);
    } else {
      // Xóa lỗi nếu hợp lệ
      const newRoundsErrors = { ...roundsErrors };
      delete newRoundsErrors.evaluationTwo;
      setRoundsErrors(newRoundsErrors);
    }
    setEvaluationTwoNumber(value);
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
                        max: MAX_NAME_LENGTH,
                        message: `Tên hạng mục không được vượt quá ${MAX_NAME_LENGTH} ký tự!`,
                      },
                    ]}
                  >
                    <Input
                      placeholder="Nhập tên hạng mục"
                      maxLength={MAX_NAME_LENGTH}
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
                    dependencies={["sizeMax"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập kích thước tối thiểu",
                      },
                      {
                        type: "number",
                        max: MAX_SIZE,
                        message: `Kích thước tối thiểu không được vượt quá ${MAX_SIZE}cm!`,
                      },
                      {
                        validator: (_, value) => {
                          const sizeMax = form.getFieldValue("sizeMax");
                          if (
                            value &&
                            sizeMax &&
                            parseFloat(value) >= parseFloat(sizeMax)
                          ) {
                            return Promise.reject(
                              "Kích thước tối thiểu phải nhỏ hơn kích thước tối đa"
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={MAX_SIZE}
                      className="w-full"
                      placeholder="Nhập kích thước tối thiểu"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sizeMax"
                    label="Kích thước tối đa (cm)"
                    dependencies={["sizeMin"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập kích thước tối đa",
                      },
                      {
                        type: "number",
                        max: MAX_SIZE,
                        message: `Kích thước tối đa không được vượt quá ${MAX_SIZE}cm!`,
                      },
                      {
                        validator: (_, value) => {
                          const sizeMin = form.getFieldValue("sizeMin");
                          if (
                            value &&
                            sizeMin &&
                            parseFloat(value) <= parseFloat(sizeMin)
                          ) {
                            return Promise.reject(
                              "Kích thước tối đa phải lớn hơn kích thước tối thiểu"
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={MAX_SIZE}
                      className="w-full"
                      placeholder="Nhập kích thước tối đa"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="minEntries"
                    label="Số lượng tham gia tối thiểu"
                    dependencies={["maxEntries"]}
                    rules={[
                      {
                        type: "number",
                        max: MAX_ENTRIES,
                        message: `Số lượng tham gia tối thiểu không được vượt quá ${MAX_ENTRIES}!`,
                      },
                      {
                        validator: (_, value) => {
                          const maxEntries = form.getFieldValue("maxEntries");
                          if (
                            value &&
                            maxEntries &&
                            parseInt(value) > parseInt(maxEntries)
                          ) {
                            return Promise.reject(
                              "Số lượng tối thiểu phải nhỏ hơn hoặc bằng số lượng tối đa"
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={MAX_ENTRIES}
                      className="w-full"
                      placeholder="Nhập số lượng tối thiểu"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="maxEntries"
                    label="Số lượng tham gia tối đa"
                    dependencies={["minEntries"]}
                    rules={[
                      {
                        type: "number",
                        max: MAX_ENTRIES,
                        message: `Số lượng tham gia tối đa không được vượt quá ${MAX_ENTRIES}!`,
                      },
                      {
                        validator: (_, value) => {
                          const minEntries = form.getFieldValue("minEntries");
                          if (
                            value &&
                            minEntries &&
                            parseInt(value) < parseInt(minEntries)
                          ) {
                            return Promise.reject(
                              "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu"
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={MAX_ENTRIES}
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
                        max: MAX_REGISTRATION_FEE,
                        message: `Phí đăng ký không được vượt quá ${MAX_REGISTRATION_FEE.toLocaleString("vi-VN")} VND (10 triệu)!`,
                      },
                      {
                        validator: (_, value) => {
                          if (value && value < 0) {
                            return Promise.reject(
                              "Phí đăng ký không được nhỏ hơn 0"
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={MAX_REGISTRATION_FEE}
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
              {/* Competition Rounds */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Các loại vòng thi
                </label>
                <div className="space-y-4">
                  {/* Vòng Sơ Khảo */}
                  <div className="mb-4">
                    <div className="p-2 border rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Vòng Sơ Khảo</span>
                        <Tag color="orange" size="small">
                          1 vòng
                        </Tag>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        Vòng sơ khảo chỉ áp dụng hình thức chấm đạt/không đạt
                        (Pass/Fail)
                      </p>
                    </div>
                    {/* Không hiển thị dropdown cho Vòng 1 */}
                  </div>

                  {/* Vòng Đánh Giá Chính */}
                  <div className="mb-4">
                    <div className="p-2 border rounded-md">
                      <span className="font-semibold">Vòng Đánh Giá Chính</span>
                    </div>
                    <Collapse className="mt-2">
                      <Panel header="Vòng 1" key="evaluation_1">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Số cá qua vòng
                            </label>
                            <InputNumber
                              min={1}
                              placeholder="Tối thiểu 1 cá"
                              value={evaluationOneNumber}
                              onChange={(value) =>
                                handleEvaluationOneNumberChange(value)
                              }
                              style={{ width: "100%" }}
                            />
                            {roundsErrors.evaluationOne && (
                              <p className="text-red-500 text-xs mt-1">
                                {roundsErrors.evaluationOne}
                              </p>
                            )}
                            {showErrors &&
                              (!evaluationOneNumber ||
                                evaluationOneNumber < 1) && (
                                <p className="text-red-500 text-xs mt-1">
                                  Số cá qua vòng phải từ 1 trở lên.
                                </p>
                              )}
                          </div>
                        </Space>
                      </Panel>
                      <Panel header="Vòng 2" key="evaluation_2">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Số cá qua vòng
                            </label>
                            <InputNumber
                              min={1}
                              placeholder="Tối thiểu 1 cá"
                              value={evaluationTwoNumber}
                              onChange={(value) =>
                                handleEvaluationTwoNumberChange(value)
                              }
                              style={{ width: "100%" }}
                            />
                            {roundsErrors.evaluationTwo && (
                              <p className="text-red-500 text-xs mt-1">
                                {roundsErrors.evaluationTwo}
                              </p>
                            )}
                            {showErrors &&
                              (!evaluationTwoNumber ||
                                evaluationTwoNumber < 1) &&
                              !roundsErrors.evaluationTwo && (
                                <p className="text-red-500 text-xs mt-1">
                                  Số cá qua vòng phải từ 1 trở lên.
                                </p>
                              )}
                          </div>
                        </Space>
                      </Panel>
                    </Collapse>
                  </div>

                  {/* Vòng Chung Kết */}
                  <div className="mb-4">
                    <div className="p-2 border rounded-md flex justify-between items-center">
                      <span className="font-semibold">Vòng Chung Kết</span>
                      <Tag className="ml-2" color="green" size="small">
                        1 vòng
                      </Tag>
                    </div>
                    {/* Không hiển thị dropdown cho Vòng 1 */}
                  </div>
                </div>
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
                                      max: MAX_PRIZE_VALUE,
                                      message: `Giá trị giải thưởng không được vượt quá ${MAX_PRIZE_VALUE.toLocaleString("vi-VN")} VND (100 tỷ)!`,
                                    },
                                  ]}
                                >
                                  <InputNumber
                                    placeholder="Nhập giá trị (VND)"
                                    min={0}
                                    max={MAX_PRIZE_VALUE}
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
                      {round.value === "Preliminary" ? (
                        <div className="p-4 bg-gray-50 rounded border border-orange-200">
                          <p className="text-orange-600">
                            <strong>Vòng Sơ Khảo</strong> chỉ áp dụng hình thức
                            chấm đạt/không đạt (Pass/Fail). Trọng tài sẽ đánh
                            giá các cá thể có đủ điều kiện tham gia vòng tiếp đủ
                            điều kiện tham gia vòng tiếp theo hay không mà không
                            sử dụng tiêu chí đánh giá chi tiết.
                          </p>
                        </div>
                      ) : (
                        <>
                          {criteriaInRound.length > 0 ? (
                            <div>
                              {/* Add total weight display */}
                              <div className="mb-3 p-2 bg-blue-50 rounded flex justify-between items-center">
                                <span className="font-medium">
                                  Tổng trọng số:
                                </span>
                                <Tag
                                  color={
                                    Math.abs(
                                      criteriaInRound.reduce(
                                        (sum, c) => sum + (c.weight * 100 || 0),
                                        0
                                      ) - 100
                                    ) < 0.5
                                      ? "success"
                                      : "error"
                                  }
                                >
                                  {criteriaInRound
                                    .reduce(
                                      (sum, c) => sum + (c.weight * 100 || 0),
                                      0
                                    )
                                    .toFixed(1)}
                                  %
                                </Tag>
                              </div>

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
                                        parser={(value) =>
                                          value.replace("%", "")
                                        }
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
                                            item.criteriaId ||
                                              item.criteria?.id,
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
                                              item.criteriaId ||
                                                item.criteria?.id,
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
                            </div>
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
                        </>
                      )}
                    </Tabs.TabPane>
                  );
                })}
              </Tabs>

              {/* Modal thêm tiêu chí cho vòng được chọn - không phụ thuộc vào editingCriteria */}
              <Modal
                title={`Thêm tiêu chí cho ${roundLabelMap[selectedRoundForCriteria] || ""}`}
                open={selectedRoundForCriteria !== null}
                onOk={() => {
                  if (
                    !tempSelectedCriteria ||
                    tempSelectedCriteria.length === 0
                  ) {
                    message.warning("Vui lòng chọn tiêu chí trước");
                    return;
                  }
                  handleAddCriteriaToRound(selectedRoundForCriteria);
                }}
                onCancel={() => {
                  setSelectedRoundForCriteria(null);
                  setTempSelectedCriteria([]);
                }}
                afterClose={() => {
                  setTempSelectedCriteria([]);
                }}
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
                    value={tempSelectedCriteria.map((item) => item.criteriaId)}
                  >
                    {criteria
                      .filter((item) => {
                        // Get current criteria for all rounds
                        const existingCriteria = (
                          form.getFieldValue("criteriaCompetitionCategories") ||
                          []
                        ).map((c) => c.criteriaId || c.criteria?.id);

                        // Only show criteria that are not already assigned to any round
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
