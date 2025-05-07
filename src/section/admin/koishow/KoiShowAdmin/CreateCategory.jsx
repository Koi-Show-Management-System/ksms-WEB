// CreateCategory.jsx
import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Collapse,
  Card,
  Spin,
  Divider,
  message,
  InputNumber,
  Tag,
  notification,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import useCategory from "../../../../hooks/useCategory";
import useVariety from "../../../../hooks/useVariety";
import useAccountTeam from "../../../../hooks/useAccountTeam";
import useCriteria from "../../../../hooks/useCriteria";
import { Loading } from "../../../../components";

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

dayjs.extend(utc);
dayjs.extend(timezone);

// Thêm hàm kiểm tra loại giải thưởng cần thiết
const hasAllRequiredAwardTypes = (awards) => {
  // Kiểm tra xem đã có đủ 4 loại giải thưởng khác nhau chưa
  const types = new Set(awards.map((a) => a.awardType));

  // Phải có đủ 4 loại giải thưởng
  if (types.size >= 4) return true;

  // Hoặc phải tuân theo thứ tự: Nhất -> Nhì -> Ba -> Khuyến Khích
  const hasFirst = types.has("first");
  const hasSecond = types.has("second");
  const hasThird = types.has("third");
  const hasHonorable = types.has("honorable");

  // Nếu có Khuyến Khích phải có đủ Ba loại còn lại
  if (hasHonorable && !(hasFirst && hasSecond && hasThird)) return false;

  // Nếu có Ba phải có Nhất và Nhì
  if (hasThird && !(hasFirst && hasSecond)) return false;

  // Nếu có Nhì phải có Nhất
  if (hasSecond && !hasFirst) return false;

  return false; // Không đủ các giải theo thứ tự
};

function CreateCategory({ showId, onCategoryCreated }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [awardErrors, setAwardErrors] = useState({});
  const [evaluationOneNumber, setEvaluationOneNumber] = useState(null);
  const [evaluationTwoNumber, setEvaluationTwoNumber] = useState(null);
  const [roundsErrors, setRoundsErrors] = useState({});

  const {
    createCategory,
    isLoading: isCreating,
    error,
    createSuccess,
    resetCreateStatus,
  } = useCategory();
  const { variety, fetchVariety, isLoading: isLoadingVariety } = useVariety();
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const {
    criteria,
    fetchCriteria,
    isLoading: isLoadingCriteria,
  } = useCriteria();

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

  const [category, setCategory] = useState({
    name: "",
    sizeMin: "",
    sizeMax: "",
    description: "",
    maxEntries: null,
    minEntries: null,
    registrationFee: 0,
    status: "pending",
    startTime: null,
    endTime: null,
    koiShowId: showId,
    hasTank: undefined,
    createAwardCateShowRequests: [],
    createCompetionCategoryVarieties: [],
    createRoundRequests: [],
    createRefereeAssignmentRequests: [],
    createCriteriaCompetitionCategoryRequests: [],
  });

  useEffect(() => {
    fetchVariety();
    fetchAccountTeam(1, 100);
    fetchCriteria(1, 100);
  }, []);

  // Clean up any criteria for Preliminary round
  useEffect(() => {
    if (category.createCriteriaCompetitionCategoryRequests?.length > 0) {
      setCategory((prev) => {
        // Remove any criteria for Preliminary round
        const filteredCriteria =
          prev.createCriteriaCompetitionCategoryRequests.filter(
            (criteria) => criteria.roundType !== "Preliminary"
          );

        return {
          ...prev,
          createCriteriaCompetitionCategoryRequests: filteredCriteria,
        };
      });
    }
  }, []);

  useEffect(() => {
    if (createSuccess) {
      setIsModalVisible(false);
      resetCategory();

      if (onCategoryCreated) {
        onCategoryCreated();
      }

      resetCreateStatus();
    }
  }, [createSuccess]);

  const resetCategory = () => {
    setCategory({
      name: "",
      sizeMin: "",
      sizeMax: "",
      description: "",
      maxEntries: null,
      minEntries: null,
      registrationFee: 0,
      status: "pending",
      startTime: null,
      endTime: null,
      hasTank: undefined,
      createAwardCateShowRequests: [],
      createCompetionCategoryVarieties: [],
      createRoundRequests: [
        // Initialize with fixed rounds
        {
          name: "Vòng 1",
          roundOrder: 1,
          roundType: "Preliminary",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: null,
          status: "pending",
        },
        {
          name: "Vòng 1",
          roundOrder: 1,
          roundType: "Evaluation",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: null,
          status: "pending",
        },
        {
          name: "Vòng 2",
          roundOrder: 2,
          roundType: "Evaluation",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: null,
          status: "pending",
        },
        {
          name: "Vòng 1",
          roundOrder: 1,
          roundType: "Final",
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: null,
          status: "pending",
        },
      ],
      createRefereeAssignmentRequests: [],
      createCriteriaCompetitionCategoryRequests: [],
    });
    setShowErrors(false);
    setEvaluationOneNumber(null);
    setEvaluationTwoNumber(null);
    setRoundsErrors({});
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    resetCategory();
    setIsModalVisible(false);
    resetCreateStatus();
  };

  const handleCategoryChange = (field, value) => {
    // Add validation for different fields
    if (field === "name" && value && value.length > 100) {
      message.error("Tên hạng mục không được vượt quá 100 ký tự!");
      return;
    }

    if ((field === "sizeMin" || field === "sizeMax") && value > 100) {
      message.error("Kích thước không được vượt quá 100cm!");
      return;
    }

    if (field === "registrationFee" && value > 10000000) {
      message.error("Phí đăng ký không được vượt quá 10 triệu VND!");
      return;
    }

    if ((field === "minEntries" || field === "maxEntries") && value > 1000) {
      message.error("Số lượng tham gia không được vượt quá 1000!");
      return;
    }

    // Khi cập nhật maxEntries, kiểm tra và cập nhật lỗi nếu số cá qua vòng vượt quá giới hạn
    if (field === "maxEntries" && value > 0) {
      // Kiểm tra số cá qua vòng đánh giá 1 có vượt quá maxEntries không
      if (evaluationOneNumber && evaluationOneNumber > value) {
        const newRoundsErrors = { ...roundsErrors };
        newRoundsErrors.evaluationOne = `Số cá qua vòng (${evaluationOneNumber}) không được vượt quá số lượng tham gia tối đa (${value})`;
        setRoundsErrors(newRoundsErrors);
      } else {
        // Xóa lỗi nếu hợp lệ
        const newRoundsErrors = { ...roundsErrors };
        delete newRoundsErrors.evaluationOne;
        setRoundsErrors(newRoundsErrors);
      }

      // Kiểm tra số cá qua vòng đánh giá 2 có vượt quá maxEntries không
      if (evaluationTwoNumber && evaluationTwoNumber > value) {
        const newRoundsErrors = { ...roundsErrors };
        const currentError = newRoundsErrors.evaluationTwo || "";
        newRoundsErrors.evaluationTwo = `${currentError ? currentError + " và k" : "K"}hông được vượt quá số lượng tham gia tối đa (${value})`;
        setRoundsErrors(newRoundsErrors);
      }
    }

    setCategory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Thêm hàm kiểm tra có đủ 4 loại giải thưởng hay không
  const handleAddAward = () => {
    // Kiểm tra nếu đã có đủ 4 loại giải thưởng
    if (
      category.createAwardCateShowRequests?.length >= 4 ||
      hasAllRequiredAwardTypes(category.createAwardCateShowRequests || [])
    ) {
      message.warning("Đã có đủ các loại giải thưởng!");
      return;
    }

    // Xác định loại giải thưởng tiếp theo dựa vào những loại giải đã có
    const existingAwardTypes =
      category.createAwardCateShowRequests?.map((a) => a.awardType) || [];

    // Kiểm tra theo thứ tự đúng: Nhất -> Nhì -> Ba -> Khuyến Khích
    let nextAwardType = "";
    let awardName = "";

    if (!existingAwardTypes.includes("first")) {
      nextAwardType = "first";
      awardName = "Giải Nhất";
    } else if (!existingAwardTypes.includes("second")) {
      nextAwardType = "second";
      awardName = "Giải Nhì";
    } else if (!existingAwardTypes.includes("third")) {
      nextAwardType = "third";
      awardName = "Giải Ba";
    } else if (!existingAwardTypes.includes("honorable")) {
      nextAwardType = "honorable";
      awardName = "Giải Khuyến Khích";
    }

    // Kiểm tra nếu không có loại giải tiếp theo hợp lệ
    if (!nextAwardType) {
      message.warning("Không thể thêm giải thưởng mới!");
      return;
    }

    setCategory((prev) => ({
      ...prev,
      createAwardCateShowRequests: [
        ...prev.createAwardCateShowRequests,
        {
          name: awardName,
          awardType: nextAwardType,
          prizeValue: "",
          description: "",
        },
      ],
    }));
  };

  const handleRemoveAward = (awardIndex) => {
    // Lấy giải thưởng cần xóa
    const awardToRemove = category.createAwardCateShowRequests[awardIndex];

    // Không có giải thưởng để xóa hoặc không tìm thấy giải
    if (!awardToRemove) {
      return;
    }

    // Dựa vào loại giải cần xóa, xác định những giải nào cần xóa theo
    let updatedAwards = [...category.createAwardCateShowRequests];

    if (awardToRemove.awardType === "first") {
      // Nếu xóa giải Nhất, xóa tất cả các giải
      message.info("Xóa giải Nhất sẽ xóa tất cả các giải thưởng");
      updatedAwards = [];
    } else if (awardToRemove.awardType === "second") {
      // Nếu xóa giải Nhì, xóa cả giải Ba và Khuyến khích
      message.info("Xóa giải Nhì sẽ xóa cả giải Ba và Khuyến Khích (nếu có)");
      // Giữ lại giải Nhất, xóa tất cả giải Nhì, Ba, và Khuyến khích
      updatedAwards = updatedAwards.filter(
        (award) => award.awardType === "first"
      );
    } else if (awardToRemove.awardType === "third") {
      // Nếu xóa giải Ba, xóa cả giải Khuyến khích
      message.info("Xóa giải Ba sẽ xóa cả giải Khuyến Khích (nếu có)");
      // Giữ lại giải Nhất và Nhì, xóa tất cả giải Ba và Khuyến khích
      updatedAwards = updatedAwards.filter(
        (award) => award.awardType === "first" || award.awardType === "second"
      );
    } else {
      // Nếu xóa giải Khuyến khích, chỉ xóa nó
      updatedAwards = updatedAwards.filter((_, i) => i !== awardIndex);
    }

    // Cập nhật state
    setCategory((prev) => ({
      ...prev,
      createAwardCateShowRequests: updatedAwards,
    }));
  };

  const handleAwardChange = (awardIndex, field, value) => {
    // Kiểm tra giá trị giải thưởng
    if (field === "prizeValue" && value < 0) {
      message.error("Giá trị giải thưởng không được nhỏ hơn 0");
      return;
    }

    // Add validation for prize value
    if (field === "prizeValue" && value > 100000000000) {
      message.error("Giá trị giải thưởng không được vượt quá 100 tỷ VND!");
      return;
    }

    // Validate giá trị giải thưởng theo thứ tự: Nhất > Nhì > Ba > Khuyến Khích
    if (field === "prizeValue" && value) {
      const currentAward = category.createAwardCateShowRequests[awardIndex];
      const allAwards = category.createAwardCateShowRequests;

      // Cập nhật state lỗi
      const newAwardErrors = { ...awardErrors };

      // Xóa lỗi cũ trước khi kiểm tra lại
      newAwardErrors[awardIndex] = "";

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
          newAwardErrors[awardIndex] = "Giải Nhất phải có giá trị cao nhất";
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
          newAwardErrors[awardIndex] =
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
            newAwardErrors[awardIndex] =
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
          newAwardErrors[awardIndex] =
            "Giải Ba phải có giá trị nhỏ hơn Giải Nhì";
        } else {
          const hasHonorableWithHigherValue = allAwards.some(
            (award) =>
              award.awardType === "honorable" &&
              award.prizeValue &&
              Number(award.prizeValue) >= Number(value)
          );

          if (hasHonorableWithHigherValue) {
            newAwardErrors[awardIndex] =
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
          newAwardErrors[awardIndex] =
            "Giải Khuyến Khích phải có giá trị thấp nhất";
        }
      }

      setAwardErrors(newAwardErrors);
    }

    // Kiểm tra thứ tự khi chọn loại giải
    if (field === "awardType") {
      const awards = [...category.createAwardCateShowRequests];
      const otherAwards = awards.filter((_, i) => i !== awardIndex);
      const currentAward = awards[awardIndex];

      // Tạo danh sách giải thưởng mới sau khi thay đổi
      const newAwards = [...otherAwards, { ...currentAward, awardType: value }];

      // Kiểm tra xem các loại giải đã có
      const hasFirst = newAwards.some((a) => a.awardType === "first");
      const hasSecond = newAwards.some((a) => a.awardType === "second");
      const hasThird = newAwards.some((a) => a.awardType === "third");
      const hasHonorable = newAwards.some((a) => a.awardType === "honorable");

      // Không cho phép chọn Giải Ba nếu không có Giải Nhất hoặc Giải Nhì
      if (value === "third" && (!hasFirst || !hasSecond)) {
        message.error(
          "Không thể chọn Giải Ba khi không có Giải Nhất hoặc Giải Nhì"
        );
        return;
      }

      // Không cho phép chọn Giải Nhì nếu không có Giải Nhất
      if (value === "second" && !hasFirst) {
        message.error("Không thể chọn Giải Nhì khi không có Giải Nhất");
        return;
      }

      // Không cho phép chọn Giải Khuyến Khích nếu không có Giải Nhất, Giải Nhì hoặc Giải Ba
      if (value === "honorable" && (!hasFirst || !hasSecond || !hasThird)) {
        message.error(
          "Không thể chọn Giải Khuyến Khích khi không có đủ Giải Nhất, Nhì và Ba"
        );
        return;
      }

      // Không cho phép thay đổi loại giải làm mất tính hợp lệ của các giải khác
      // Không thể bỏ Giải Nhất nếu đã có Giải Nhì hoặc cao hơn
      if (
        currentAward.awardType === "first" &&
        value !== "first" &&
        (hasSecond || hasThird || hasHonorable)
      ) {
        message.error(
          "Không thể đổi Giải Nhất khi đã có Giải Nhì, Ba hoặc Khuyến Khích"
        );
        return;
      }

      // Không thể bỏ Giải Nhì nếu đã có Giải Ba hoặc cao hơn
      if (
        currentAward.awardType === "second" &&
        value !== "second" &&
        (hasThird || hasHonorable)
      ) {
        message.error(
          "Không thể đổi Giải Nhì khi đã có Giải Ba hoặc Khuyến Khích"
        );
        return;
      }

      // Không thể bỏ Giải Ba nếu đã có Giải Khuyến Khích
      if (
        currentAward.awardType === "third" &&
        value !== "third" &&
        hasHonorable
      ) {
        message.error("Không thể đổi Giải Ba khi đã có Giải Khuyến Khích");
        return;
      }

      // Tự động điền tên giải thưởng dựa vào loại giải
      let awardName = "";
      switch (value) {
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

      // Cập nhật cả awardType và name
      setCategory((prev) => ({
        ...prev,
        createAwardCateShowRequests: prev.createAwardCateShowRequests.map(
          (award, i) =>
            i === awardIndex
              ? { ...award, awardType: value, name: awardName }
              : award
        ),
      }));
      return;
    }

    setCategory((prev) => ({
      ...prev,
      createAwardCateShowRequests: prev.createAwardCateShowRequests.map(
        (award, i) => (i === awardIndex ? { ...award, [field]: value } : award)
      ),
    }));
  };

  const handleVarietyChange = (selectedVarieties) => {
    setCategory((prev) => ({
      ...prev,
      createCompetionCategoryVarieties: selectedVarieties,
    }));
  };

  const handleRefereeChange = (selectedReferees) => {
    setCategory((prev) => {
      // Get current referee assignments
      const currentAssignments = prev.createRefereeAssignmentRequests || [];

      // Keep existing assignments for referees who are still selected
      const existingAssignments = currentAssignments.filter((assignment) =>
        selectedReferees.includes(assignment.refereeAccountId)
      );

      // Find new referees that weren't previously selected
      const existingRefereeIds = existingAssignments.map(
        (a) => a.refereeAccountId
      );
      const newRefereeIds = selectedReferees.filter(
        (id) => !existingRefereeIds.includes(id)
      );

      // Create assignments for new referees with empty roundTypes
      const newAssignments = newRefereeIds.map((refereeId) => ({
        refereeAccountId: refereeId,
        roundTypes: [],
      }));

      // Return both existing assignments (with their roundTypes preserved) and new assignments
      return {
        ...prev,
        createRefereeAssignmentRequests: [
          ...existingAssignments,
          ...newAssignments,
        ],
      };
    });
  };

  const handleRefereeRoundChange = (refereeId, selectedRounds) => {
    // Check if the selected rounds includes "Preliminary"
    if (selectedRounds.includes("Preliminary")) {
      // Check if any other referee is already assigned to Preliminary
      const otherRefereeHasPreliminary =
        category.createRefereeAssignmentRequests.some(
          (referee) =>
            referee.refereeAccountId !== refereeId &&
            referee.roundTypes?.includes("Preliminary")
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

    setCategory((prev) => ({
      ...prev,
      createRefereeAssignmentRequests: prev.createRefereeAssignmentRequests.map(
        (assignment) =>
          assignment.refereeAccountId === refereeId
            ? { ...assignment, roundTypes: selectedRounds }
            : assignment
      ),
    }));
  };

  const handleCriteriaSelection = (values) => {
    setCategory((prev) => ({
      ...prev,
      tempSelectedCriteria: values.map((id) => ({
        criteriaId: id,
        weight: 0,
        order: 0,
      })),
    }));
  };

  const getFinalJson = () => {
    return category.map(({ tempSelectedCriteria, ...category }) => category);
  };

  const handleMainRoundChange = (value) => {
    if (
      !category.tempSelectedCriteria ||
      category.tempSelectedCriteria.length === 0
    ) {
      return;
    }

    const newCriteriaList = category.tempSelectedCriteria.map(
      (criteria, index) => ({
        ...criteria,
        roundType: value,
        order:
          category.createCriteriaCompetitionCategoryRequests.length + index + 1,
      })
    );

    setCategory((prev) => {
      // Create a new object without tempSelectedCriteria
      const { tempSelectedCriteria, ...rest } = prev;

      return {
        ...rest,
        createCriteriaCompetitionCategoryRequests: [
          ...prev.createCriteriaCompetitionCategoryRequests,
          ...newCriteriaList,
        ],
        // Don't include tempSelectedCriteria in the new state
      };
    });
  };

  const handleWeightChange = (criteriaId, roundType, value) => {
    const weightValue = Number(value) / 100; // Convert from percentage to decimal

    setCategory((prev) => ({
      ...prev,
      createCriteriaCompetitionCategoryRequests:
        prev.createCriteriaCompetitionCategoryRequests.map((criteria) =>
          criteria.criteriaId === criteriaId && criteria.roundType === roundType
            ? { ...criteria, weight: weightValue }
            : criteria
        ),
    }));
  };

  const handleRemoveCriteria = (criteriaId) => {
    setCategory((prev) => ({
      ...prev,
      createCriteriaCompetitionCategoryRequests:
        prev.createCriteriaCompetitionCategoryRequests.filter(
          (criteria) => criteria.criteriaId !== criteriaId
        ),
    }));
  };

  const handleAddSubRound = (mainRound) => {
    const existingSubRounds = category.createRoundRequests.filter(
      (round) => round.roundType === mainRound
    );

    const newRound = {
      name: `Vòng ${existingSubRounds.length + 1}`,
      roundOrder: existingSubRounds.length + 1,
      roundType: mainRound,
      startTime: dayjs().format(),
      endTime: dayjs().add(1, "day").format(),
      numberOfRegistrationToAdvance: null,
      status: "pending",
    };

    setCategory((prev) => ({
      ...prev,
      createRoundRequests: [...prev.createRoundRequests, newRound],
    }));
  };

  const handleRemoveSubRound = (roundToRemove) => {
    setCategory((prev) => {
      const updatedCategory = { ...prev };
      // Lọc ra các vòng còn lại
      const remainingRounds = updatedCategory.createRoundRequests.filter(
        (round) => round.name !== roundToRemove.name
      );

      // Cập nhật lại roundOrder cho các vòng cùng loại
      const updatedRounds = remainingRounds.map((round) => {
        if (round.roundType === roundToRemove.roundType) {
          const sameTypeRounds = remainingRounds.filter(
            (r) => r.roundType === round.roundType && r.name !== round.name
          );
          const newOrder =
            sameTypeRounds.filter((r) => r.name < round.name).length + 1;
          return {
            ...round,
            roundOrder: newOrder,
            name: `${roundLabelMap[round.roundType]} ${newOrder}`,
          };
        }
        return round;
      });

      return {
        ...updatedCategory,
        createRoundRequests: updatedRounds,
      };
    });
  };

  const validateCategory = () => {
    setShowErrors(true);

    let hasError = false;
    let errorDetails = [];

    // Basic validation
    if (!category.name) {
      errorDetails.push("tên hạng mục");
      hasError = true;
    }

    if (!category.sizeMin) {
      errorDetails.push("kích thước tối thiểu");
      hasError = true;
    }

    if (!category.sizeMax) {
      errorDetails.push("kích thước tối đa");
      hasError = true;
    }

    if (!category.description) {
      errorDetails.push("mô tả hạng mục");
      hasError = true;
    }

    if (category.hasTank === undefined) {
      errorDetails.push("thông tin bể trưng bày");
      hasError = true;
    }

    // Kiểm tra kích thước tối đa phải lớn hơn kích thước tối thiểu
    if (parseFloat(category.sizeMax) <= parseFloat(category.sizeMin)) {
      errorDetails.push("kích thước tối đa phải lớn hơn kích thước tối thiểu");
      hasError = true;
    }

    // Kiểm tra số lượng tham gia tối đa phải lớn hơn số lượng tham gia tối thiểu
    if (parseInt(category.maxEntries) < parseInt(category.minEntries)) {
      errorDetails.push(
        "số lượng tham gia tối đa phải lớn hơn số lượng tham gia tối thiểu"
      );
      hasError = true;
    }

    // Validate số cá qua vòng
    if (evaluationOneNumber < 1) {
      errorDetails.push("số cá qua vòng Đánh Giá 1 phải từ 1 trở lên");
      hasError = true;
    }

    if (evaluationTwoNumber < 1) {
      errorDetails.push("số cá qua vòng Đánh Giá 2 phải từ 1 trở lên");
      hasError = true;
    }

    if (
      evaluationOneNumber &&
      evaluationTwoNumber &&
      evaluationTwoNumber >= evaluationOneNumber
    ) {
      errorDetails.push(
        "số cá qua vòng Đánh Giá 2 phải nhỏ hơn vòng Đánh Giá 1"
      );
      hasError = true;
    }

    // Kiểm tra số cá qua vòng không vượt quá số lượng tham gia tối đa
    if (
      evaluationOneNumber &&
      category.maxEntries &&
      evaluationOneNumber > category.maxEntries
    ) {
      errorDetails.push(
        `số cá qua vòng Đánh Giá 1 (${evaluationOneNumber}) không được vượt quá số lượng tham gia tối đa (${category.maxEntries})`
      );
      hasError = true;
    }

    if (
      evaluationTwoNumber &&
      category.maxEntries &&
      evaluationTwoNumber > category.maxEntries
    ) {
      errorDetails.push(
        `số cá qua vòng Đánh Giá 2 (${evaluationTwoNumber}) không được vượt quá số lượng tham gia tối đa (${category.maxEntries})`
      );
      hasError = true;
    }

    // Variety validation
    if (
      !category.createCompetionCategoryVarieties ||
      category.createCompetionCategoryVarieties.length === 0
    ) {
      errorDetails.push("chọn ít nhất một giống cá");
      hasError = true;
    }

    // Rounds validation
    if (category.createRoundRequests.length === 0) {
      errorDetails.push("thêm ít nhất một vòng thi");
      hasError = true;
    }

    // Kiểm tra các lỗi trong roundsErrors
    if (Object.keys(roundsErrors).length > 0) {
      // Nếu có lỗi về số cá qua vòng vượt quá số lượng tham gia tối đa
      if (roundsErrors.evaluationOne) {
        errorDetails.push(roundsErrors.evaluationOne);
        hasError = true;
      }

      if (roundsErrors.evaluationTwo) {
        errorDetails.push(roundsErrors.evaluationTwo);
        hasError = true;
      }
    }

    // Kiểm tra số cá qua vòng
    const invalidRounds = category.createRoundRequests.filter(
      (round) =>
        // Chỉ kiểm tra với vòng có hiển thị trường số cá qua vòng
        !(
          round.roundType === "Preliminary" ||
          (round.roundType === "Final" &&
            (category.createRoundRequests.filter((r) => r.roundType === "Final")
              .length < 2 ||
              round.roundOrder !== 1))
        ) &&
        (!round.numberOfRegistrationToAdvance ||
          round.numberOfRegistrationToAdvance < 1)
    );

    if (invalidRounds.length > 0) {
      const invalidRoundNames = invalidRounds
        .map((round) => round.name)
        .join(", ");
      errorDetails.push(
        `vui lòng nhập số cá qua vòng từ 1 trở lên cho vòng: ${invalidRoundNames}`
      );
      hasError = true;
    }

    // Criteria validation
    const criteriaByRound = {};
    mainRounds.forEach((round) => {
      criteriaByRound[round.value] =
        category.createCriteriaCompetitionCategoryRequests.filter(
          (c) => c.roundType === round.value
        );
    });

    Object.entries(criteriaByRound).forEach(([roundType, criteriaList]) => {
      // Skip validation for Preliminary round since it only uses pass/fail
      if (roundType === "Preliminary") return;

      if (criteriaList.length < 1) {
        errorDetails.push(`${roundLabelMap[roundType]} cần ít nhất 1 tiêu chí`);
        hasError = true;
      }

      // Kiểm tra tổng trọng số
      const totalWeight = criteriaList.reduce(
        (total, c) => total + (c.weight * 100 || 0),
        0
      );
      if (totalWeight !== 100) {
        errorDetails.push(
          `${roundLabelMap[roundType]} phải có tổng trọng số bằng 100% (hiện tại: ${totalWeight}%)`
        );
        hasError = true;
      }
    });

    // Awards validation
    if (category.createAwardCateShowRequests.length === 0) {
      errorDetails.push("thêm ít nhất một giải thưởng");
      hasError = true;
    }

    // Kiểm tra thông tin chi tiết của từng giải thưởng
    const invalidAwards = category.createAwardCateShowRequests.filter(
      (award) =>
        !award.name?.trim() ||
        !award.awardType ||
        !award.prizeValue ||
        award.prizeValue <= 0 ||
        !award.description?.trim()
    );

    if (invalidAwards.length > 0) {
      errorDetails.push(
        `${invalidAwards.length} giải thưởng chưa điền đầy đủ thông tin (loại giải, giá trị, mô tả)`
      );
      hasError = true;
    }

    // Referee validation
    if (category.createRefereeAssignmentRequests.length === 0) {
      errorDetails.push("chọn ít nhất một trọng tài");
      hasError = true;
    }

    // Check if all referees have assigned rounds
    const refereesWithoutRounds =
      category.createRefereeAssignmentRequests.filter(
        (r) => r.roundTypes.length === 0
      );

    if (refereesWithoutRounds.length > 0) {
      errorDetails.push("chọn vòng chấm điểm cho tất cả trọng tài");
      hasError = true;
    }

    // Hiển thị thông báo lỗi nếu có
    if (hasError) {
      notification.error({
        message: "Thông tin hạng mục không hợp lệ",
        description: (
          <div>
            <p>Thông tin cần bổ sung hoặc chỉnh sửa:</p>
            <ul className="list-disc pl-4 mt-2">
              {errorDetails.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          </div>
        ),
        placement: "topRight",
        duration: 3,
      });
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateCategory()) {
      return;
    }

    const { tempSelectedCriteria, ...categoryData } = category;

    // Ensure showId is set
    categoryData.koiShowId = showId;

    // Ensure numeric fields are properly formatted
    categoryData.sizeMin = parseFloat(categoryData.sizeMin);
    categoryData.sizeMax = parseFloat(categoryData.sizeMax);
    categoryData.maxEntries = parseInt(categoryData.maxEntries);
    categoryData.minEntries = parseInt(categoryData.minEntries);
    categoryData.registrationFee = parseFloat(categoryData.registrationFee);

    // Ensure award values are numbers
    categoryData.createAwardCateShowRequests =
      categoryData.createAwardCateShowRequests.map((award) => ({
        ...award,
        prizeValue: parseFloat(award.prizeValue) || 0,
      }));

    // Cập nhật số cá qua vòng từ state vào rounds
    categoryData.createRoundRequests = categoryData.createRoundRequests.map(
      (round) => {
        // Với vòng đánh giá chính, sử dụng giá trị từ state
        if (round.roundType === "Evaluation" && round.roundOrder === 1) {
          return {
            ...round,
            numberOfRegistrationToAdvance: evaluationOneNumber,
          };
        } else if (round.roundType === "Evaluation" && round.roundOrder === 2) {
          return {
            ...round,
            numberOfRegistrationToAdvance: evaluationTwoNumber,
          };
        }

        // Với vòng Preliminary hoặc vòng Final không đủ điều kiện, đặt giá trị là null
        if (
          round.roundType === "Preliminary" ||
          (round.roundType === "Final" &&
            (categoryData.createRoundRequests.filter(
              (r) => r.roundType === "Final"
            ).length < 2 ||
              round.roundOrder !== 1))
        ) {
          return {
            ...round,
            numberOfRegistrationToAdvance: null,
          };
        }

        // Các vòng khác, giữ giá trị hoặc convert sang số
        return {
          ...round,
          numberOfRegistrationToAdvance:
            parseInt(round.numberOfRegistrationToAdvance) || null,
        };
      }
    );

    console.log("Category data to submit:", categoryData);
    await createCategory(categoryData);
  };

  const getTotalWeightColor = (criteriaList) => {
    const totalWeight = criteriaList.reduce(
      (total, criteria) => total + criteria.weight,
      0
    );
    if (totalWeight < 0.5) return "red";
    if (totalWeight < 0.75) return "yellow";
    return "green";
  };

  const calculateTotalWeight = (criteriaList) => {
    const totalWeight = criteriaList.reduce(
      (total, criteria) => total + criteria.weight,
      0
    );
    return Math.round(totalWeight * 100);
  };

  // Helper function to get a specific round
  const getRound = (roundType, roundOrder) => {
    if (!category.createRoundRequests) return null;
    return category.createRoundRequests.find(
      (r) => r.roundType === roundType && r.roundOrder === roundOrder
    );
  };

  // Helper function to update a round's property
  const updateRound = (roundType, roundOrder, field, value) => {
    setCategory((prev) => {
      const updatedCategory = { ...prev };

      if (!updatedCategory.createRoundRequests) {
        // Initialize rounds if they don't exist
        updatedCategory.createRoundRequests = [
          {
            name: "Vòng 1",
            roundOrder: 1,
            roundType: "Preliminary",
            startTime: dayjs().format(),
            endTime: dayjs().add(1, "day").format(),
            numberOfRegistrationToAdvance: null,
            status: "pending",
          },
          {
            name: "Vòng 1",
            roundOrder: 1,
            roundType: "Evaluation",
            startTime: dayjs().format(),
            endTime: dayjs().add(1, "day").format(),
            numberOfRegistrationToAdvance: null,
            status: "pending",
          },
          {
            name: "Vòng 2",
            roundOrder: 2,
            roundType: "Evaluation",
            startTime: dayjs().format(),
            endTime: dayjs().add(1, "day").format(),
            numberOfRegistrationToAdvance: null,
            status: "pending",
          },
          {
            name: "Vòng 1",
            roundOrder: 1,
            roundType: "Final",
            startTime: dayjs().format(),
            endTime: dayjs().add(1, "day").format(),
            numberOfRegistrationToAdvance: null,
            status: "pending",
          },
        ];
      }

      const roundIndex = updatedCategory.createRoundRequests.findIndex(
        (r) => r.roundType === roundType && r.roundOrder === roundOrder
      );

      if (roundIndex === -1) {
        // If round not found, create it
        const newRound = {
          name: `Vòng ${roundOrder}`,
          roundOrder: roundOrder,
          roundType: roundType,
          startTime: dayjs().format(),
          endTime: dayjs().add(1, "day").format(),
          numberOfRegistrationToAdvance: null,
          status: "pending",
        };
        updatedCategory.createRoundRequests.push(newRound);
        return updatedCategory;
      }

      // Update the specific field in the round
      updatedCategory.createRoundRequests[roundIndex] = {
        ...updatedCategory.createRoundRequests[roundIndex],
        [field]: value,
      };

      return updatedCategory;
    });
  };

  // Thêm hàm xử lý khi thay đổi số cá qua vòng 1
  const handleEvaluationOneNumberChange = (value) => {
    setEvaluationOneNumber(value);

    // Kiểm tra tính hợp lệ của vòng 2 khi cập nhật vòng 1
    if (evaluationTwoNumber && value && evaluationTwoNumber >= value) {
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
    if (value && category.maxEntries && value > category.maxEntries) {
      const newRoundsErrors = { ...roundsErrors };
      newRoundsErrors.evaluationOne = `Số cá qua vòng (${value}) không được vượt quá số lượng tham gia tối đa (${category.maxEntries})`;
      setRoundsErrors(newRoundsErrors);
    } else {
      // Xóa lỗi nếu hợp lệ
      const newRoundsErrors = { ...roundsErrors };
      delete newRoundsErrors.evaluationOne;
      setRoundsErrors(newRoundsErrors);
    }

    // Update round in category state
    updateRound("Evaluation", 1, "numberOfRegistrationToAdvance", value);
  };

  // Thêm hàm xử lý khi thay đổi số cá qua vòng 2
  const handleEvaluationTwoNumberChange = (value) => {
    // Kiểm tra giá trị so với vòng 1
    if (evaluationOneNumber && value && value >= evaluationOneNumber) {
      const newRoundsErrors = { ...roundsErrors };
      newRoundsErrors.evaluationTwo = `Số cá qua vòng ở vòng 2 (${value}) phải nhỏ hơn số cá qua vòng ở vòng 1 (${evaluationOneNumber})`;
      setRoundsErrors(newRoundsErrors);
    } else {
      // Xóa lỗi nếu hợp lệ
      const newRoundsErrors = { ...roundsErrors };
      delete newRoundsErrors.evaluationTwo;
      setRoundsErrors(newRoundsErrors);
    }

    // Kiểm tra số cá qua vòng không vượt quá số lượng tham gia tối đa
    if (value && category.maxEntries && value > category.maxEntries) {
      const newRoundsErrors = { ...roundsErrors };
      const currentErrors = newRoundsErrors.evaluationTwo || "";
      newRoundsErrors.evaluationTwo = `${currentErrors ? currentErrors + " và k" : "K"}hông được vượt quá số lượng tham gia tối đa (${category.maxEntries})`;
      setRoundsErrors(newRoundsErrors);
    }

    setEvaluationTwoNumber(value);

    // Update round in category state
    updateRound("Evaluation", 2, "numberOfRegistrationToAdvance", value);
  };

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-600"
      >
        Tạo mới
      </Button>

      <Modal
        title="Tạo Hạng Mục Mới"
        open={isModalVisible}
        onCancel={handleCancel}
        width={800}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isCreating}
            onClick={handleCreate}
            className="bg-blue-500"
          >
            Tạo mới
          </Button>,
        ]}
      >
        <div className="p-4">
          {/* Basic Information */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên hạng mục
            </label>
            <Input
              placeholder="Nhập tên hạng mục"
              value={category.name}
              onChange={(e) => handleCategoryChange("name", e.target.value)}
              maxLength={100}
            />
            {showErrors && !category.name && (
              <p className="text-red-500 text-xs mt-1">
                Tên hạng mục là bắt buộc.
              </p>
            )}
            {category.name && (
              <p className="text-gray-500 text-xs mt-1">
                {category.name.length}/100 ký tự
              </p>
            )}
          </div>
          <div className="flex ">
            <div className="mb-4 flex-1 ">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn giống cá Koi
              </label>
              {isLoadingVariety ? (
                <Loading />
              ) : (
                <Select
                  mode="multiple"
                  placeholder="Chọn giống cá koi"
                  className="w-full"
                  value={category.createCompetionCategoryVarieties}
                  onChange={handleVarietyChange}
                >
                  {variety.map((item) => (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              )}
              {showErrors &&
                (!category.createCompetionCategoryVarieties ||
                  category.createCompetionCategoryVarieties.length === 0) && (
                  <p className="text-red-500 text-xs mt-1">
                    Chọn ít nhất một giống.
                  </p>
                )}
            </div>
            <div className="flex-1 mx-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phí tham gia (VND)
              </label>
              <InputNumber
                min={0}
                placeholder="Nhập phí tham gia"
                value={category.registrationFee}
                onChange={(value) =>
                  handleCategoryChange("registrationFee", value)
                }
                addonAfter="VND"
                className="w-full"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              />
              {showErrors &&
                (!category.registrationFee || category.registrationFee < 0) && (
                  <p className="text-red-500 text-xs mt-1">
                    Phí đăng ký là bắt buộc.
                  </p>
                )}
            </div>
          </div>

          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kích thước tối thiểu (cm)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Nhập kích thước tối thiểu"
                value={category.sizeMin}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value < 0) return;
                  if (value > 100) {
                    message.error("Kích thước không được vượt quá 100cm!");
                    return;
                  }
                  handleCategoryChange("sizeMin", e.target.value);
                }}
              />
              {showErrors && !category.sizeMin && (
                <p className="text-red-500 text-xs mt-1">
                  Kích thước tối thiểu là bắt buộc.
                </p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kích thước tối đa (cm)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Nhập kích thước tối đa"
                value={category.sizeMax}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value < 0) return;
                  if (value > 100) {
                    message.error("Kích thước không được vượt quá 100cm!");
                    return;
                  }
                  handleCategoryChange("sizeMax", e.target.value);
                }}
              />
              {showErrors && !category.sizeMax && (
                <p className="text-red-500 text-xs mt-1">
                  Kích thước tối đa là bắt buộc.
                </p>
              )}
              {showErrors &&
                category.sizeMax &&
                category.sizeMin &&
                parseFloat(category.sizeMax) <=
                  parseFloat(category.sizeMin) && (
                  <p className="text-red-500 text-xs mt-1">
                    Kích thước tối đa phải lớn hơn kích thước tối thiểu.
                  </p>
                )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Có bể trưng bày
              </label>
              <Select
                placeholder="Có/Không"
                className="w-full"
                value={category.hasTank}
                onChange={(value) => handleCategoryChange("hasTank", value)}
              >
                <Option value={true}>Có</Option>
                <Option value={false}>Không</Option>
              </Select>
              {showErrors && category.hasTank === undefined && (
                <p className="text-red-500 text-xs mt-1">
                  Vui lòng chọn có hoặc không
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <TextArea
              placeholder="Nhập mô tả thể loại"
              value={category.description}
              onChange={(e) =>
                handleCategoryChange("description", e.target.value)
              }
              rows={3}
            />
            {showErrors && !category.description && (
              <p className="text-red-500 text-xs mt-1">Mô tả là bắt buộc.</p>
            )}
          </div>

          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng tham gia tối thiểu
              </label>
              <InputNumber
                min={0}
                max={1000}
                placeholder="Nhập số lượng tham gia tối thiểu"
                value={category.minEntries}
                onChange={(value) => handleCategoryChange("minEntries", value)}
                className="w-full"
              />
              {showErrors &&
                (!category.minEntries || category.minEntries <= 0) && (
                  <p className="text-red-500 text-xs mt-1">
                    Số lượng tham gia tối thiểu phải lớn hơn 0.
                  </p>
                )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng tham gia tối đa
              </label>
              <InputNumber
                min={0}
                max={1000}
                placeholder="Nhập số lượng tối đa"
                value={category.maxEntries}
                onChange={(value) => handleCategoryChange("maxEntries", value)}
                className="w-full"
              />
              {showErrors &&
                (!category.maxEntries || category.maxEntries <= 0) && (
                  <p className="text-red-500 text-xs mt-1">
                    Số lượng tham gia tối đa phải lớn hơn 0.
                  </p>
                )}
              {showErrors &&
                category.maxEntries &&
                category.minEntries &&
                parseInt(category.maxEntries) <
                  parseInt(category.minEntries) && (
                  <p className="text-red-500 text-xs mt-1">
                    Số lượng tối đa phải lớn hơn số lượng tối thiểu.
                  </p>
                )}
            </div>
          </div>

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

                  {/* Hidden fields để đảm bảo dữ liệu Vòng 1 của Vòng Sơ Khảo được lưu trữ */}
                  <input
                    type="hidden"
                    value={getRound("Preliminary", 1)?.name || "Vòng 1"}
                    onChange={(e) =>
                      updateRound("Preliminary", 1, "name", e.target.value)
                    }
                  />
                  <input
                    type="hidden"
                    value={getRound("Preliminary", 1)?.roundOrder || 1}
                    onChange={(e) =>
                      updateRound(
                        "Preliminary",
                        1,
                        "roundOrder",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <input
                    type="hidden"
                    value={getRound("Preliminary", 1)?.status || "pending"}
                    onChange={(e) =>
                      updateRound("Preliminary", 1, "status", e.target.value)
                    }
                  />
                  <input
                    type="hidden"
                    value={
                      getRound("Preliminary", 1)?.startTime || dayjs().format()
                    }
                    onChange={(e) =>
                      updateRound("Preliminary", 1, "startTime", e.target.value)
                    }
                  />
                  <input
                    type="hidden"
                    value={
                      getRound("Preliminary", 1)?.endTime ||
                      dayjs().add(1, "day").format()
                    }
                    onChange={(e) =>
                      updateRound("Preliminary", 1, "endTime", e.target.value)
                    }
                  />
                </div>
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
                          onChange={handleEvaluationOneNumberChange}
                          style={{ width: "100%" }}
                        />
                        {roundsErrors.evaluationOne && (
                          <p className="text-red-500 text-xs mt-1">
                            {roundsErrors.evaluationOne}
                          </p>
                        )}
                        {showErrors &&
                          (!evaluationOneNumber || evaluationOneNumber < 1) && (
                            <p className="text-red-500 text-xs mt-1">
                              Số cá qua vòng phải từ 1 trở lên.
                            </p>
                          )}
                        <p className="text-gray-500 text-xs mt-1">
                          Không được vượt quá số lượng tham gia tối đa (
                          {category.maxEntries || "?"})
                        </p>
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
                          onChange={handleEvaluationTwoNumberChange}
                          style={{ width: "100%" }}
                        />
                        {roundsErrors.evaluationTwo && (
                          <p className="text-red-500 text-xs mt-1">
                            {roundsErrors.evaluationTwo}
                          </p>
                        )}
                        {showErrors &&
                          (!evaluationTwoNumber || evaluationTwoNumber < 1) &&
                          !roundsErrors.evaluationTwo && (
                            <p className="text-red-500 text-xs mt-1">
                              Số cá qua vòng phải từ 1 trở lên.
                            </p>
                          )}
                        <p className="text-gray-500 text-xs mt-1">
                          Không được vượt quá số lượng tham gia tối đa (
                          {category.maxEntries || "?"}) và phải nhỏ hơn vòng 1
                        </p>
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

                {/* Hidden fields để đảm bảo dữ liệu Vòng 1 của Vòng Chung Kết được lưu trữ */}
                <input
                  type="hidden"
                  value={getRound("Final", 1)?.name || "Vòng 1"}
                  onChange={(e) =>
                    updateRound("Final", 1, "name", e.target.value)
                  }
                />
                <input
                  type="hidden"
                  value={getRound("Final", 1)?.roundOrder || 1}
                  onChange={(e) =>
                    updateRound(
                      "Final",
                      1,
                      "roundOrder",
                      parseInt(e.target.value)
                    )
                  }
                />
                <input
                  type="hidden"
                  value={getRound("Final", 1)?.status || "pending"}
                  onChange={(e) =>
                    updateRound("Final", 1, "status", e.target.value)
                  }
                />
                <input
                  type="hidden"
                  value={getRound("Final", 1)?.startTime || dayjs().format()}
                  onChange={(e) =>
                    updateRound("Final", 1, "startTime", e.target.value)
                  }
                />
                <input
                  type="hidden"
                  value={
                    getRound("Final", 1)?.endTime ||
                    dayjs().add(1, "day").format()
                  }
                  onChange={(e) =>
                    updateRound("Final", 1, "endTime", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Criteria Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu chí đánh giá
            </label>
            <Collapse defaultActiveKey={["preliminary", "evaluation", "final"]}>
              {mainRounds.map((round) => {
                const criteriaInRound =
                  category.createCriteriaCompetitionCategoryRequests?.filter(
                    (c) => c.roundType === round.value
                  ) || [];

                return (
                  <Collapse.Panel
                    key={round.value}
                    header={`${round.label}`}
                    extra={
                      <div className="flex items-center">
                        {round.value !== "Preliminary" ? (
                          <>
                            <Tag color="blue">
                              {criteriaInRound.length} tiêu chí
                            </Tag>
                            {criteriaInRound.length > 0 && (
                              <Tag
                                color={getTotalWeightColor(criteriaInRound)}
                                className="ml-2"
                              >
                                Tổng: {calculateTotalWeight(criteriaInRound)}%
                              </Tag>
                            )}
                          </>
                        ) : (
                          <Tag color="orange">Chấm đạt/không đạt</Tag>
                        )}
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      {round.value === "Preliminary" ? (
                        <div className="p-4 bg-gray-50 rounded border border-orange-200">
                          <p className="text-orange-600">
                            <strong>Vòng Sơ Khảo</strong> chỉ áp dụng hình thức
                            chấm đạt/không đạt (Pass/Fail). Trọng tài sẽ đánh
                            giá các cá thể có đủ điều kiện tham gia vòng tiếp
                            theo hay không mà không sử dụng tiêu chí đánh giá
                            chi tiết.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2 mb-4">
                            <Select
                              mode="multiple"
                              placeholder="Chọn tiêu chí"
                              className="w-full"
                              value={criteriaInRound.map((c) => {
                                const criteriaDetail = criteria.find(
                                  (cr) => cr.id === c.criteriaId
                                );
                                return criteriaDetail?.name || c.criteriaId;
                              })}
                              onChange={(values) => {
                                // Kiểm tra trùng lặp trong vòng hiện tại
                                const hasDuplicates = values.some(
                                  (value, index) =>
                                    values.indexOf(value) !== index
                                );

                                if (hasDuplicates) {
                                  message.error(
                                    "Không được chọn trùng tiêu chí trong cùng một vòng"
                                  );
                                  return;
                                }

                                // Xóa các tiêu chí cũ của vòng này
                                const otherCriteria =
                                  category.createCriteriaCompetitionCategoryRequests?.filter(
                                    (c) => c.roundType !== round.value
                                  ) || [];

                                // Thêm các tiêu chí mới với weight mặc định là 0
                                const newCriteria = values.map(
                                  (criteriaName, index) => {
                                    const criteriaDetail = criteria.find(
                                      (cr) => cr.name === criteriaName
                                    );
                                    return {
                                      criteriaId: criteriaDetail?.id,
                                      roundType: round.value,
                                      weight: 0,
                                      order: index + 1,
                                    };
                                  }
                                );

                                setCategory((prev) => ({
                                  ...prev,
                                  createCriteriaCompetitionCategoryRequests: [
                                    ...otherCriteria,
                                    ...newCriteria,
                                  ],
                                }));
                              }}
                            >
                              {criteria
                                .filter(
                                  (item) =>
                                    !criteriaInRound.some(
                                      (c) => c.criteriaId === item.id
                                    )
                                )
                                .map((item) => (
                                  <Option key={item.id} value={item.name}>
                                    {item.name}
                                  </Option>
                                ))}
                            </Select>
                          </div>

                          {criteriaInRound.length > 0 && (
                            <div className="space-y-2">
                              {criteriaInRound.map((criteriaItem, idx) => {
                                const criteriaDetail = criteria.find(
                                  (c) => c.id === criteriaItem.criteriaId
                                );

                                return (
                                  <div
                                    key={criteriaItem.criteriaId}
                                    className="flex items-center space-x-4 p-2 bg-gray-50 rounded"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {criteriaDetail?.name}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        suffix="%"
                                        value={criteriaItem.weight * 100 || 0}
                                        onChange={(e) => {
                                          const newWeight =
                                            parseFloat(e.target.value) / 100;
                                          if (newWeight < 0 || newWeight > 1) {
                                            message.error(
                                              "Trọng số phải nằm trong khoảng 0-100%"
                                            );
                                            return;
                                          }

                                          // Kiểm tra trùng % với các tiêu chí khác
                                          const hasDuplicateWeight =
                                            criteriaInRound.some(
                                              (c) =>
                                                c.criteriaId !==
                                                  criteriaItem.criteriaId &&
                                                c.weight === newWeight
                                            );

                                          if (hasDuplicateWeight) {
                                            message.error(
                                              "Không được đặt cùng một tỷ lệ % cho các tiêu chí khác nhau"
                                            );
                                            return;
                                          }

                                          setCategory((prev) => {
                                            const updatedCategory = { ...prev };
                                            const criteriaIndex =
                                              updatedCategory.createCriteriaCompetitionCategoryRequests.findIndex(
                                                (c) =>
                                                  c.criteriaId ===
                                                    criteriaItem.criteriaId &&
                                                  c.roundType === round.value
                                              );

                                            if (criteriaIndex !== -1) {
                                              updatedCategory.createCriteriaCompetitionCategoryRequests[
                                                criteriaIndex
                                              ] = {
                                                ...updatedCategory
                                                  .createCriteriaCompetitionCategoryRequests[
                                                  criteriaIndex
                                                ],
                                                weight: newWeight,
                                              };
                                            }

                                            return updatedCategory;
                                          });
                                        }}
                                        className="w-24"
                                        placeholder="Nhập %"
                                      />
                                      <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                          setCategory((prev) => {
                                            const updatedCategory = { ...prev };
                                            updatedCategory.createCriteriaCompetitionCategoryRequests =
                                              updatedCategory.createCriteriaCompetitionCategoryRequests.filter(
                                                (c) =>
                                                  !(
                                                    c.criteriaId ===
                                                      criteriaItem.criteriaId &&
                                                    c.roundType === round.value
                                                  )
                                              );

                                            return updatedCategory;
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Collapse.Panel>
                );
              })}
            </Collapse>
          </div>

          {/* Awards */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giải thưởng
            </label>
            <Button
              onClick={handleAddAward}
              icon={<PlusOutlined />}
              className="mb-2"
              disabled={category.createAwardCateShowRequests?.length >= 4}
            >
              Thêm Giải Thưởng
            </Button>

            {/* Show error if no awards */}
            {showErrors && (
              <>
                {category.createAwardCateShowRequests.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">
                    Cần có ít nhất một giải thưởng
                  </p>
                )}
              </>
            )}

            {category.createAwardCateShowRequests.length > 0 && (
              <Collapse className="mt-3">
                {category.createAwardCateShowRequests.map(
                  (award, awardIndex) => (
                    <Panel
                      header={`Giải thưởng ${awardIndex + 1}`}
                      key={awardIndex}
                      extra={
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAward(awardIndex);
                          }}
                        >
                          Xóa
                        </Button>
                      }
                    >
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Loại Giải Thưởng
                            </label>
                            <Select
                              placeholder="Chọn loại giải thưởng"
                              value={award.awardType}
                              onChange={(value) =>
                                handleAwardChange(
                                  awardIndex,
                                  "awardType",
                                  value
                                )
                              }
                              className="w-full"
                            >
                              {!category.createAwardCateShowRequests.some(
                                (a) => a.awardType === "first" && a !== award
                              ) && <Option value="first">Giải Nhất</Option>}

                              {!category.createAwardCateShowRequests.some(
                                (a) => a.awardType === "second" && a !== award
                              ) && <Option value="second">Giải Nhì</Option>}

                              {!category.createAwardCateShowRequests.some(
                                (a) => a.awardType === "third" && a !== award
                              ) && <Option value="third">Giải Ba</Option>}

                              {!category.createAwardCateShowRequests.some(
                                (a) =>
                                  a.awardType === "honorable" && a !== award
                              ) && (
                                <Option value="honorable">
                                  Giải Khuyến Khích
                                </Option>
                              )}
                            </Select>
                            {showErrors && !award.awardType && (
                              <p className="text-red-500 text-xs font-medium mt-1">
                                Loại giải thưởng là bắt buộc. Mỗi hạng mục phải
                                có đủ 4 loại giải.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Giá Trị Giải Thưởng
                          </label>
                          <InputNumber
                            min={0}
                            max={100000000000}
                            style={{ width: "100%" }}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                            placeholder="Nhập giá trị (VND)"
                            value={award.prizeValue}
                            onChange={(value) =>
                              handleAwardChange(awardIndex, "prizeValue", value)
                            }
                            addonAfter="VND"
                            className="w-full"
                          />
                          {awardErrors[awardIndex] && (
                            <p className="text-red-500 text-xs mt-1">
                              {awardErrors[awardIndex]}
                            </p>
                          )}
                          {showErrors &&
                            (!award.prizeValue || award.prizeValue <= 0) && (
                              <p className="text-red-500 text-xs mt-1">
                                Giá trị giải thưởng phải lớn hơn 0.
                              </p>
                            )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Mô Tả Giải Thưởng
                          </label>
                          <TextArea
                            rows={2}
                            placeholder="Nhập mô tả giải thưởng"
                            value={award.description}
                            onChange={(e) =>
                              handleAwardChange(
                                awardIndex,
                                "description",
                                e.target.value
                              )
                            }
                          />
                          {showErrors && !award.description && (
                            <p className="text-red-500 text-xs mt-1">
                              Mô tả giải thưởng là bắt buộc.
                            </p>
                          )}
                        </div>
                      </Space>
                    </Panel>
                  )
                )}
              </Collapse>
            )}
          </div>

          {/* Referee Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn trọng tài
            </label>
            <Select
              mode="multiple"
              placeholder="Chọn trọng tài"
              className="w-full"
              value={category.createRefereeAssignmentRequests.map(
                (r) => r.refereeAccountId
              )}
              onChange={handleRefereeChange}
            >
              {referee.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.fullName}
                </Option>
              ))}
            </Select>

            {/* Show error if no referees */}
            {showErrors &&
              category.createRefereeAssignmentRequests.length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  Cần chọn ít nhất một trọng tài.
                </p>
              )}
          </div>

          {/* Referee Assignments */}
          {category.createRefereeAssignmentRequests.length > 0 && (
            <Collapse className="mb-4">
              {category.createRefereeAssignmentRequests.map((assignment) => (
                <Collapse.Panel
                  key={assignment.refereeAccountId}
                  header={`Trọng tài: ${
                    referee.find((r) => r.id === assignment.refereeAccountId)
                      ?.fullName || "Không xác định"
                  }`}
                  extra={
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefereeChange(
                          category.createRefereeAssignmentRequests
                            .filter(
                              (r) =>
                                r.refereeAccountId !==
                                assignment.refereeAccountId
                            )
                            .map((r) => r.refereeAccountId)
                        );
                      }}
                    />
                  }
                >
                  <label className="block text-sm font-medium text-gray-700">
                    Chọn vòng chấm điểm cho trọng tài này
                  </label>
                  <Select
                    mode="multiple"
                    className="w-full"
                    value={assignment.roundTypes}
                    onChange={(value) =>
                      handleRefereeRoundChange(
                        assignment.refereeAccountId,
                        value
                      )
                    }
                  >
                    {mainRounds.map((round) => (
                      <Option key={round.value} value={round.value}>
                        {round.label}
                      </Option>
                    ))}
                  </Select>

                  {/* Show error if referee has no rounds */}
                  {showErrors && assignment.roundTypes.length === 0 && (
                    <p className="text-red-500 text-xs mt-1">
                      Cần chọn ít nhất một vòng chấm điểm cho trọng tài này.
                    </p>
                  )}
                </Collapse.Panel>
              ))}
            </Collapse>
          )}

          {/* Status */}
        </div>
      </Modal>
    </>
  );
}

export default CreateCategory;
