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

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

dayjs.extend(utc);
dayjs.extend(timezone);

function CreateCategory({ showId, onCategoryCreated }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

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

  const [category, setCategory] = useState({
    name: "",
    sizeMin: "",
    sizeMax: "",
    description: "",
    maxEntries: 0,
    minEntries: 0,
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
      maxEntries: 0,
      minEntries: 0,
      registrationFee: 0,
      status: "pending",
      startTime: null,
      endTime: null,
      hasTank: undefined,
      createAwardCateShowRequests: [],
      createCompetionCategoryVarieties: [],
      createRoundRequests: [],
      createRefereeAssignmentRequests: [],
      createCriteriaCompetitionCategoryRequests: [],
    });
    setShowErrors(false);
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
    setCategory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Thêm hàm kiểm tra có đủ 4 loại giải thưởng hay không
  const hasAllRequiredAwardTypes = (awards) => {
    const requiredTypes = ["first", "second", "third", "honorable"];
    const awardTypes = awards.map((award) => award.awardType);

    // Kiểm tra xem mỗi loại giải bắt buộc có trong danh sách không
    return requiredTypes.every((type) => awardTypes.includes(type));
  };

  const handleAddAward = () => {
    // Kiểm tra nếu đã có đủ 4 loại giải thưởng
    if (
      category.createAwardCateShowRequests?.length >= 4 ||
      hasAllRequiredAwardTypes(category.createAwardCateShowRequests || [])
    ) {
      message.warning("Đã có đủ 4 loại giải thưởng!");
      return;
    }

    setCategory((prev) => ({
      ...prev,
      createAwardCateShowRequests: [
        ...prev.createAwardCateShowRequests,
        { name: "", awardType: "", prizeValue: "", description: "" },
      ],
    }));
  };

  const handleRemoveAward = (awardIndex) => {
    setCategory((prev) => ({
      ...prev,
      createAwardCateShowRequests: prev.createAwardCateShowRequests.filter(
        (_, i) => i !== awardIndex
      ),
    }));
  };

  const handleAwardChange = (awardIndex, field, value) => {
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
    setCategory((prev) => ({
      ...prev,
      createRefereeAssignmentRequests: selectedReferees.map((refereeId) => ({
        refereeAccountId: refereeId,
        roundTypes: [],
      })),
    }));
  };

  const handleRefereeRoundChange = (refereeId, selectedRounds) => {
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

    // Basic validation
    if (
      !category.name ||
      !category.sizeMin ||
      !category.sizeMax ||
      !category.description ||
      category.hasTank === undefined
    ) {
      message.error("Vui lòng điền đầy đủ thông tin cơ bản");
      return false;
    }

    // Kiểm tra kích thước tối đa phải lớn hơn kích thước tối thiểu
    if (parseFloat(category.sizeMax) <= parseFloat(category.sizeMin)) {
      message.error("Kích thước tối đa phải lớn hơn kích thước tối thiểu");
      return false;
    }

    // Kiểm tra số lượng tham gia tối đa phải lớn hơn số lượng tham gia tối thiểu
    if (parseInt(category.maxEntries) < parseInt(category.minEntries)) {
      message.error(
        "Số lượng tham gia tối đa phải lớn hơn số lượng tham gia tối thiểu"
      );
      return false;
    }

    // Variety validation
    if (
      !category.createCompetionCategoryVarieties ||
      category.createCompetionCategoryVarieties.length === 0
    ) {
      message.error("Vui lòng chọn ít nhất một giống cá");
      return false;
    }

    // Rounds validation
    if (category.createRoundRequests.length === 0) {
      message.error("Vui lòng thêm ít nhất một vòng thi");
      return false;
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
      message.error(
        `Vui lòng nhập số cá qua vòng từ 1 trở lên cho vòng: ${invalidRoundNames}`
      );
      return false;
    }

    // Criteria validation
    const criteriaByRound = {};
    mainRounds.forEach((round) => {
      criteriaByRound[round.value] =
        category.createCriteriaCompetitionCategoryRequests.filter(
          (c) => c.roundType === round.value
        );
    });

    let criteriaValid = true;
    Object.entries(criteriaByRound).forEach(([roundType, criteriaList]) => {
      if (criteriaList.length < 3) {
        message.error(`${roundLabelMap[roundType]} cần ít nhất 3 tiêu chí`);
        criteriaValid = false;
      }

      // Kiểm tra tổng trọng số
      const totalWeight = criteriaList.reduce(
        (total, c) => total + (c.weight * 100 || 0),
        0
      );
      if (totalWeight !== 100) {
        message.error(
          `${roundLabelMap[roundType]} phải có tổng trọng số bằng 100% (hiện tại: ${totalWeight}%)`
        );
        criteriaValid = false;
      }
    });

    if (!criteriaValid) return false;

    // Awards validation
    if (category.createAwardCateShowRequests.length === 0) {
      message.error("Vui lòng thêm ít nhất một giải thưởng");
      return false;
    }

    // Kiểm tra có đủ 4 loại giải hay không
    if (!hasAllRequiredAwardTypes(category.createAwardCateShowRequests)) {
      message.error(
        "Bắt buộc phải có đủ 4 loại giải: Giải Nhất, Giải Nhì, Giải Ba, và Giải Khuyến Khích"
      );
      return false;
    }

    // Referee validation
    if (category.createRefereeAssignmentRequests.length === 0) {
      message.error("Vui lòng chọn ít nhất một trọng tài");
      return false;
    }

    // Check if all referees have assigned rounds
    const refereesWithoutRounds =
      category.createRefereeAssignmentRequests.filter(
        (r) => r.roundTypes.length === 0
      );

    if (refereesWithoutRounds.length > 0) {
      message.error("Vui lòng chọn vòng chấm điểm cho tất cả trọng tài");
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

    // Ensure round numberOfRegistrationToAdvance values are processed correctly
    categoryData.createRoundRequests = categoryData.createRoundRequests.map(
      (round) => {
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
        title="Tạo Danh Mục Mới"
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
            />
            {showErrors && !category.name && (
              <p className="text-red-500 text-xs mt-1">
                Tên hạng mục là bắt buộc.
              </p>
            )}
          </div>
          <div className="flex ">
            <div className="mb-4 flex-1 ">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn giống cá Koi
              </label>
              {isLoadingVariety ? (
                <Spin size="small" />
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
                placeholder="Nhập kích thước tối thiểu"
                value={category.sizeMin}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value < 0) return;
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
                placeholder="Nhập kích thước tối đa"
                value={category.sizeMax}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value < 0) return;
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
                min={1}
                placeholder="Nhập số lượng tham gia tối thiểu"
                value={category.minEntries}
                onChange={(value) => handleCategoryChange("minEntries", value)}
                className="w-full"
              />
              {showErrors &&
                (!category.minEntries || category.minEntries < 1) && (
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
                min={1}
                placeholder="Nhập số lượng tối đa"
                value={category.maxEntries}
                onChange={(value) => handleCategoryChange("maxEntries", value)}
                className="w-full"
              />
              {showErrors &&
                (!category.maxEntries || category.maxEntries < 1) && (
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
                {category.createRoundRequests.some(
                  (r) => r.roundType === round.value
                ) && (
                  <Collapse className="mt-2">
                    {category.createRoundRequests
                      .filter((r) => r.roundType === round.value)
                      .sort((a, b) => a.roundOrder - b.roundOrder)
                      .map((subRound, subIndex) => (
                        <Panel
                          header={subRound.name}
                          key={subIndex}
                          extra={
                            <span
                              className="text-red-500 cursor-pointer hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSubRound(subRound);
                              }}
                            >
                              <DeleteOutlined />
                            </span>
                          }
                        >
                          <div>
                            {!(
                              // Vòng sơ khảo luôn ẩn
                              (
                                round.value === "Preliminary" ||
                                // Vòng chung kết chỉ hiện khi có 2 vòng trở lên và là vòng 1
                                (round.value === "Final" &&
                                  (category.createRoundRequests.filter(
                                    (r) => r.roundType === "Final"
                                  ).length < 2 ||
                                    subRound.roundOrder !== 1))
                              )
                            ) && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Số cá qua vòng
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="Tối thiểu 1 cá"
                                  value={subRound.numberOfRegistrationToAdvance}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value, 10);
                                    // Đảm bảo giá trị là số nguyên và >= 1
                                    if (isNaN(value) || value < 1) {
                                      message.error(
                                        "Số cá qua vòng phải từ 1 trở lên"
                                      );
                                      return;
                                    }
                                    console.log(
                                      `Cập nhật số cá qua vòng cho ${subRound.name} thành ${value}`
                                    );

                                    setCategory((prev) => {
                                      const updatedCategory = { ...prev };
                                      if (
                                        !updatedCategory.createRoundRequests
                                      ) {
                                        updatedCategory.createRoundRequests =
                                          [];
                                      }

                                      // Tìm vị trí của vòng nhỏ trong mảng tổng
                                      const actualIndex =
                                        updatedCategory.createRoundRequests.findIndex(
                                          (r) =>
                                            r.name === subRound.name &&
                                            r.roundType === subRound.roundType
                                        );

                                      if (actualIndex !== -1) {
                                        updatedCategory.createRoundRequests[
                                          actualIndex
                                        ].numberOfRegistrationToAdvance = value;
                                      }

                                      return updatedCategory;
                                    });
                                  }}
                                />
                                {showErrors &&
                                  (!subRound.numberOfRegistrationToAdvance ||
                                    subRound.numberOfRegistrationToAdvance <
                                      1) && (
                                    <p className="text-red-500 text-xs mt-1">
                                      Số cá qua vòng phải từ 1 trở lên.
                                    </p>
                                  )}
                              </div>
                            )}
                          </div>
                        </Panel>
                      ))}
                  </Collapse>
                )}
              </div>
            ))}
            {showErrors && category.createRoundRequests.length === 0 && (
              <p className="text-red-500 text-xs mt-1">
                Cần chọn ít nhất một vòng thi.
              </p>
            )}
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
                      </div>
                    }
                  >
                    <div className="space-y-4">
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
                              (value, index) => values.indexOf(value) !== index
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
              disabled={
                category.createAwardCateShowRequests?.length >= 4 ||
                hasAllRequiredAwardTypes(
                  category.createAwardCateShowRequests || []
                )
              }
            >
              Thêm Giải Thưởng
            </Button>

            {/* Show error if no awards */}
            {showErrors && (
              <>
                {category.createAwardCateShowRequests.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">
                    Bắt buộc phải có đủ 4 loại giải{" "}
                  </p>
                )}

                {category.createAwardCateShowRequests.length > 0 &&
                  !hasAllRequiredAwardTypes(
                    category.createAwardCateShowRequests
                  ) && (
                    <p className="text-red-500 text-xs mt-1">
                      Bắt buộc phải có đủ 4 loại giải: Giải Nhất, Giải Nhì, Giải
                      Ba, và Giải Khuyến Khích.
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
                          <label className="block text-sm font-medium text-gray-700">
                            Tên Giải Thưởng
                          </label>
                          <Input
                            placeholder="Nhập tên giải thưởng"
                            value={award.name}
                            onChange={(e) =>
                              handleAwardChange(
                                awardIndex,
                                "name",
                                e.target.value
                              )
                            }
                          />
                          {showErrors && !award.name && (
                            <p className="text-red-500 text-xs mt-1">
                              Tên giải thưởng là bắt buộc.
                            </p>
                          )}
                        </div>

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
                              {/* Chỉ hiển thị các loại giải chưa được chọn hoặc đang được chọn bởi giải thưởng này */}
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
