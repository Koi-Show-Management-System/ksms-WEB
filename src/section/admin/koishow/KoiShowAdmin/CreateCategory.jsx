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
    status: "pending",
    startTime: null,
    endTime: null,
    koiShowId: showId,
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
      maxEntries: 10,
      status: "pending",
      startTime: null,
      endTime: null,
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

  const handleAddAward = () => {
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
      name: `Vòng Nhỏ ${existingSubRounds.length + 1} - ${roundLabelMap[mainRound]}`,
      roundOrder: existingSubRounds.length + 1,
      roundType: mainRound,
      startTime: dayjs().format(),
      endTime: dayjs().add(1, "day").format(),
      numberOfRegistrationToAdvance: 100,
      status: "pending",
    };

    setCategory((prev) => ({
      ...prev,
      createRoundRequests: [...prev.createRoundRequests, newRound],
    }));
  };

  const handleRemoveSubRound = (roundToRemove) => {
    setCategory((prev) => ({
      ...prev,
      createRoundRequests: prev.createRoundRequests.filter(
        (round) => round.name !== roundToRemove.name
      ),
    }));
  };

  const validateCategory = () => {
    setShowErrors(true);

    // Basic validation
    if (
      !category.name ||
      !category.sizeMin ||
      !category.sizeMax ||
      !category.description
    ) {
      message.error("Vui lòng điền đầy đủ thông tin cơ bản");
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
    });

    if (!criteriaValid) return false;

    // Awards validation
    if (category.createAwardCateShowRequests.length === 0) {
      message.error("Vui lòng thêm ít nhất một giải thưởng");
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
    categoryData.showId = showId;

    // Ensure numeric fields are properly formatted
    categoryData.sizeMin = parseFloat(categoryData.sizeMin);
    categoryData.sizeMax = parseFloat(categoryData.sizeMax);
    categoryData.maxEntries = parseInt(categoryData.maxEntries);

    // Ensure award values are numbers
    categoryData.createAwardCateShowRequests =
      categoryData.createAwardCateShowRequests.map((award) => ({
        ...award,
        prizeValue: parseFloat(award.prizeValue) || 0,
      }));

    // Ensure round numberOfRegistrationToAdvance values are numbers
    categoryData.createRoundRequests = categoryData.createRoundRequests.map(
      (round) => ({
        ...round,
        numberOfRegistrationToAdvance:
          parseInt(round.numberOfRegistrationToAdvance) || 100,
      })
    );

    console.log("Category data to submit:", categoryData);
    await createCategory(categoryData);
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

          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kích thước tối thiểu (cm)
              </label>
              <Input
                type="number"
                placeholder="Nhập kích thước tối thiểu"
                value={category.sizeMin}
                onChange={(e) =>
                  handleCategoryChange("sizeMin", e.target.value)
                }
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
                placeholder="Nhập kích thước tối đa"
                value={category.sizeMax}
                onChange={(e) =>
                  handleCategoryChange("sizeMax", e.target.value)
                }
              />
              {showErrors && !category.sizeMax && (
                <p className="text-red-500 text-xs mt-1">
                  Kích thước tối đa là bắt buộc.
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
              {showErrors && !category.maxEntries && (
                <p className="text-red-500 text-xs mt-1">
                  Số lượng tham gia tối đa là bắt buộc.
                </p>
              )}
            </div>
          </div>

          {/* Competition Rounds */}
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
                {category.createRoundRequests.some(
                  (r) => r.roundType === round.value
                ) && (
                  <Collapse className="mt-2">
                    {category.createRoundRequests
                      .filter((r) => r.roundType === round.value)
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
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Tên Vòng
                              </label>
                              <Input
                                value={subRound.name}
                                onChange={(e) => {
                                  setCategory((prev) => {
                                    const updatedRounds = [
                                      ...prev.createRoundRequests,
                                    ];
                                    const roundIndex = updatedRounds.findIndex(
                                      (r) => r.name === subRound.name
                                    );
                                    if (roundIndex !== -1) {
                                      updatedRounds[roundIndex].name =
                                        e.target.value;
                                    }
                                    return {
                                      ...prev,
                                      createRoundRequests: updatedRounds,
                                    };
                                  });
                                }}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Thứ tự vòng
                              </label>
                              <Input value={subRound.roundOrder} disabled />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Điểm tối thiểu để vượt qua
                              </label>
                              <Input
                                type="number"
                                value={subRound.numberOfRegistrationToAdvance}
                                onChange={(e) => {
                                  setCategory((prev) => {
                                    const updatedRounds = [
                                      ...prev.createRoundRequests,
                                    ];
                                    const roundIndex = updatedRounds.findIndex(
                                      (r) => r.name === subRound.name
                                    );
                                    if (roundIndex !== -1) {
                                      updatedRounds[
                                        roundIndex
                                      ].numberOfRegistrationToAdvance =
                                        e.target.value;
                                    }
                                    return {
                                      ...prev,
                                      createRoundRequests: updatedRounds,
                                    };
                                  });
                                }}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Trạng thái
                              </label>
                              <Select
                                value={subRound.status}
                                onChange={(value) => {
                                  setCategory((prev) => {
                                    const updatedRounds = [
                                      ...prev.createRoundRequests,
                                    ];
                                    const roundIndex = updatedRounds.findIndex(
                                      (r) => r.name === subRound.name
                                    );
                                    if (roundIndex !== -1) {
                                      updatedRounds[roundIndex].status = value;
                                    }
                                    return {
                                      ...prev,
                                      createRoundRequests: updatedRounds,
                                    };
                                  });
                                }}
                                className="w-full"
                              >
                                <Option value="ongoing">Đang diễn ra</Option>
                                <Option value="completed">Hoàn thành</Option>
                                <Option value="pending">Chờ duyệt</Option>
                              </Select>
                            </div>
                          </Space>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn tiêu chí
            </label>
            <Select
              mode="multiple"
              placeholder="Chọn tiêu chí"
              className="w-full mb-2"
              value={
                category.tempSelectedCriteria?.map((c) => c.criteriaId) || []
              }
              onChange={handleCriteriaSelection}
            >
              {criteria.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}
                </Option>
              ))}
            </Select>

            {/* Only show round selection when criteria are selected */}
            {category.tempSelectedCriteria?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn vòng chính để gán tiêu chí đã chọn
                </label>
                <Select
                  className="w-full mb-2"
                  placeholder="Chọn vòng chính"
                  onChange={handleMainRoundChange}
                >
                  {mainRounds.map((round) => (
                    <Option key={round.value} value={round.value}>
                      {round.label}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Criteria by Round */}
          <Collapse className="mb-4">
            {mainRounds.map((round) => {
              const criteriaInRound =
                category.createCriteriaCompetitionCategoryRequests.filter(
                  (c) => c.roundType === round.value
                );

              return (
                <Collapse.Panel
                  key={round.value}
                  header={`Tiêu chí - ${round.label}`}
                >
                  {criteriaInRound.length > 0 ? (
                    criteriaInRound.map((criteriaItem) => (
                      <div
                        key={criteriaItem.criteriaId}
                        className="flex items-center space-x-4 mb-2"
                      >
                        {/* Display criteria name */}
                        <span className="text-sm font-medium flex-1">
                          {criteria.find(
                            (c) => c.id === criteriaItem.criteriaId
                          )?.name || "Tiêu chí không xác định"}
                        </span>

                        {/* Weight input */}
                        <Input
                          type="number"
                          suffix="%"
                          placeholder="Nhập trọng số"
                          value={criteriaItem.weight * 100}
                          onChange={(e) =>
                            handleWeightChange(
                              criteriaItem.criteriaId,
                              criteriaItem.roundType,
                              e.target.value
                            )
                          }
                          className="w-1/4"
                        />

                        {/* Remove criteria button */}
                        <span
                          className="text-red-500 cursor-pointer hover:text-red-700"
                          onClick={() =>
                            handleRemoveCriteria(criteriaItem.criteriaId)
                          }
                        >
                          <DeleteOutlined />
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Chưa có tiêu chí nào.
                    </p>
                  )}

                  {/* Show error if round has less than 3 criteria */}
                  {showErrors && criteriaInRound.length < 3 && (
                    <p className="text-red-500 text-xs mt-2">
                      Cần chọn ít nhất 3 tiêu chí cho {round.label}.
                    </p>
                  )}
                </Collapse.Panel>
              );
            })}
          </Collapse>

          {/* Awards */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giải thưởng
            </label>
            <Button
              onClick={handleAddAward}
              icon={<PlusOutlined />}
              className="mb-2"
            >
              Thêm Giải Thưởng
            </Button>

            {/* Show error if no awards */}
            {showErrors &&
              category.createAwardCateShowRequests.length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  Cần thêm ít nhất một giải thưởng.
                </p>
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
                            <Input
                              placeholder="Nhập loại giải thưởng"
                              value={award.awardType}
                              onChange={(e) =>
                                handleAwardChange(
                                  awardIndex,
                                  "awardType",
                                  e.target.value
                                )
                              }
                            />
                            {showErrors && !award.awardType && (
                              <p className="text-red-500 text-xs mt-1">
                                Loại giải thưởng là bắt buộc.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Giá Trị Giải Thưởng
                          </label>
                          <InputNumber
                            placeholder="Nhập giá trị (VND)"
                            value={award.prizeValue}
                            onChange={(value) =>
                              handleAwardChange(awardIndex, "prizeValue", value)
                            }
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <Select
              placeholder="Chọn trạng thái"
              className="w-full"
              value={category.status}
              onChange={(value) => handleCategoryChange("status", value)}
            >
              <Option value="pending">Chờ duyệt</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="upcoming">Sắp diễn ra</Option>
            </Select>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default CreateCategory;
