import React, { useEffect, useState } from "react";
import { Button, Card, Collapse, Form, Input, Select, Space, Spin } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import useVariety from "../../../../hooks/useVariety";
import useAccountTeam from "../../../../hooks/useAccountTeam";
import useCriteria from "../../../../hooks/useCriteria";

const { Option } = Select;
const { Panel } = Collapse;

dayjs.extend(utc);
dayjs.extend(timezone);

function StepTwo({ updateFormData, initialData }) {
  const { variety, fetchVariety, isLoading } = useVariety();
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const { criteria, fetchCriteria } = useCriteria();

  const referee = accountManage.referees || [];
  // const adminId =
  //   accountManage.admin.length > 0 ? accountManage.admin[0].id : null;

  useEffect(() => {
    fetchCriteria(1, 100);
  }, []);
  const mainRounds = [
    { value: "Vòng Sơ Khảo", label: "Vòng Sơ Khảo" },
    { value: "Vòng Đánh Giá Chính", label: "Vòng Đánh Giá Chính" },
    { value: "Vòng Chung Kết", label: "Vòng Chung Kết" },
  ];

  const [categories, setCategories] = useState(
    initialData?.createCategorieShowRequests?.length > 0
      ? initialData.createCategorieShowRequests
      : [
          {
            name: "",
            sizeMin: "",
            sizeMax: "",
            description: "",
            startTime: null,
            endTime: null,
            maxEntries: 0,
            status: "PENDING",
            createAwardCateShowRequests: [],
            createCompetionCategoryVarieties: [],
            createRoundRequests: [],
            createRefereeAssignmentRequests: [],
            createCriteriaCompetitionCategoryRequests: [],
          },
        ]
  );

  useEffect(() => {
    updateFormData({ createCategorieShowRequests: categories });
  }, [categories]);

  useEffect(() => {
    fetchVariety();
    fetchAccountTeam(1, 100);
  }, []);

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;
    setCategories(updatedCategories);
  };

  const handleAddAward = (categoryIndex) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              createAwardCateShowRequests: [
                ...(category.createAwardCateShowRequests || []),
                { name: "", awardType: "", prizeValue: "", description: "" },
              ],
            }
          : category
      )
    );
  };

  const handleAwardChange = (categoryIndex, awardIndex, field, value) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              createAwardCateShowRequests:
                category.createAwardCateShowRequests.map((award, j) =>
                  j === awardIndex ? { ...award, [field]: value } : award
                ),
            }
          : category
      )
    );
  };

  const handleRemoveAward = (categoryIndex, awardIndex) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              createAwardCateShowRequests:
                category.createAwardCateShowRequests.filter(
                  (_, j) => j !== awardIndex
                ),
            }
          : category
      )
    );
  };

  const handleVarietyChange = (categoryIndex, varietyId) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) =>
        i === categoryIndex
          ? { ...category, createCompetionCategoryVarieties: [varietyId] }
          : category
      )
    );
  };

  const handleRefereeChange = (categoryIndex, selectedReferees) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) => {
        if (i !== categoryIndex) return category; // Chỉ cập nhật đúng hạng mục đang chọn

        return {
          ...category,
          createRefereeAssignmentRequests: selectedReferees.map(
            (refereeId) => ({
              refereeAccountId: refereeId,
              roundType: [], // Mỗi trọng tài có danh sách vòng riêng
            })
          ),
        };
      })
    );
  };

  const handleRefereeRoundChange = (
    categoryIndex,
    refereeId,
    selectedRounds
  ) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) => {
        if (i !== categoryIndex) return category; // Chỉ cập nhật đúng hạng mục

        return {
          ...category,
          createRefereeAssignmentRequests:
            category.createRefereeAssignmentRequests.map((assignment) =>
              assignment.refereeAccountId === refereeId
                ? { ...assignment, roundType: selectedRounds }
                : assignment
            ),
        };
      })
    );
  };

  const handleWeightChange = (categoryIndex, criteriaId, roundType, value) => {
    const weightValue = Number(value) / 100; // Chuyển từ 30 thành 0.3

    setCategories((prevCategories) =>
      prevCategories.map((category, i) => {
        if (i !== categoryIndex) return category; // Chỉ cập nhật đúng hạng mục đang chọn

        return {
          ...category,
          createCriteriaCompetitionCategoryRequests:
            category.createCriteriaCompetitionCategoryRequests.map(
              (criteria) =>
                criteria.criteriaId === criteriaId &&
                criteria.roundType === roundType
                  ? { ...criteria, weight: weightValue }
                  : criteria
            ),
        };
      })
    );
  };

  const handleCriteriaSelection = (categoryIndex, values) => {
    setCategories((prev) => {
      const updatedCategories = [...prev];
      const category = updatedCategories[categoryIndex];

      if (!category) return updatedCategories;

      category.tempSelectedCriteria = values.map((id) => ({
        criteriaId: id,
        weight: 0,
        order: 0,
      }));

      return updatedCategories;
    });
  };

  const handleAddCategory = () => {
    const newCategory = {
      name: "",
      sizeMin: "",
      sizeMax: "",
      description: "",
      startTime: dayjs().format(),
      endTime: dayjs().add(1, "day").format(),
      status: "PENDING",
      createAwardCateShowRequests: [],
      createCompetionCategoryVarieties: [],
      createRoundRequests: [],
      createRefereeAssignmentRequests: [],
      createCriteriaCompetitionCategoryRequests: [],
    };

    setCategories([...categories, newCategory]);
  };

  const handleRemoveCategory = (index) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  const handleMainRoundChange = (categoryIndex, value) => {
    setCategories((prev) => {
      const updatedCategories = [...prev];
      const category = updatedCategories[categoryIndex];

      if (
        !category.tempSelectedCriteria ||
        category.tempSelectedCriteria.length === 0
      ) {
        return updatedCategories;
      }

      const newCriteriaList = category.tempSelectedCriteria.map(
        (criteria, index) => ({
          ...criteria,
          roundType: value,
          order:
            category.createCriteriaCompetitionCategoryRequests.length +
            index +
            1,
        })
      );

      category.createCriteriaCompetitionCategoryRequests = [
        ...category.createCriteriaCompetitionCategoryRequests,
        ...newCriteriaList,
      ];

      delete category.tempSelectedCriteria;

      return updatedCategories;
    });
  };

  const getFinalJson = () => {
    return categories.map(({ tempSelectedCriteria, ...category }) => category);
  };

  const handleAddSubRound = (categoryIndex, mainRound) => {
    setCategories((prev) => {
      const updatedCategories = [...prev];

      // Lấy danh sách vòng thi của hạng mục hiện tại
      const existingSubRounds = updatedCategories[
        categoryIndex
      ].createRoundRequests.filter((round) => round.roundType === mainRound);

      const newRound = {
        name: `Vòng Nhỏ ${existingSubRounds.length + 1} - ${mainRound}`,
        roundOrder: existingSubRounds.length + 1, // Đánh số theo thứ tự trong vòng chính
        roundType: mainRound,
        startTime: dayjs().format(),
        endTime: dayjs().add(1, "day").format(),
        minScoreToAdvance: 100,
        status: "Ongoing",
      };

      // Thêm vào danh sách vòng thi của hạng mục hiện tại
      updatedCategories[categoryIndex].createRoundRequests.push(newRound);

      return updatedCategories;
    });
  };

  const handleRemoveSubRound = (categoryIndex, roundToRemove) => {
    setCategories((prev) => {
      const updatedCategories = [...prev];

      // Chỉ xóa vòng nhỏ trong hạng mục đang chọn
      updatedCategories[categoryIndex].createRoundRequests = updatedCategories[
        categoryIndex
      ].createRoundRequests.filter(
        (round) => round.name !== roundToRemove.name
      );

      return updatedCategories;
    });
  };

  const handleCategoryNameChange = (index, value) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) =>
        i === index ? { ...category, name: value } : category
      )
    );
  };

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6">
        Bước 2: Các Hạng Mục và Tiêu Chí Đánh Giá
      </h2>
      <Collapse accordion>
        {categories.map((category, index) => (
          <Collapse.Panel
            header={category.name || `Hạng mục ${index + 1}`}
            key={index}
          >
            <Card
              key={index}
              title={`Hạng mục ${index + 1}`}
              extra={
                categories.length > 1 && (
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleRemoveCategory(index)}
                  >
                    Xóa
                  </Button>
                )
              }
            >
              <div className="space-y-5">
                {/* Tên thể loại */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hạng mục
                  </label>
                  <Input
                    placeholder="Nhập tên hạng mục"
                    value={category.name || ""}
                    onChange={(e) =>
                      handleCategoryNameChange(index, e.target.value)
                    }
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian bắt đầu
                    </label>
                    <DatePicker
                      className="w-full"
                      showTime={{ format: "HH:mm:ss" }}
                      value={
                        category.startTime
                          ? dayjs(category.startTime).tz("Asia/Ho_Chi_Minh")
                          : null
                      }
                      onChange={(date) =>
                        handleCategoryChange(index, "startTime", date)
                      }
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="Chọn thời gian bắt đầu"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian kết thúc
                    </label>
                    <DatePicker
                      className="w-full"
                      showTime={{ format: "HH:mm:ss" }}
                      value={
                        category.endTime
                          ? dayjs(category.endTime).tz("Asia/Ho_Chi_Minh")
                          : null
                      }
                      onChange={(date) =>
                        handleCategoryChange(index, "endTime", date)
                      }
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="Chọn thời gian kết thúc"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kích thước tối thiểu (cm)
                    </label>
                    <Input
                      type="number"
                      placeholder="Nhập kích thước tối thiểu"
                      value={category.sizeMin || ""}
                      onChange={(e) =>
                        handleCategoryChange(index, "sizeMin", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kích thước tối đa (cm)
                    </label>
                    <Input
                      type="number"
                      placeholder="Nhập kích thước tối đa"
                      value={category.sizeMax || ""}
                      onChange={(e) =>
                        handleCategoryChange(index, "sizeMax", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <Input
                      placeholder="Nhập mô tả thể loại"
                      value={category.description || ""}
                      onChange={(e) =>
                        handleCategoryChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                    />{" "}
                  </div>
                </div>

                {/* Select giống cá Koi */}
                <div className="flex mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn giống cá Koi
                    </label>
                    {isLoading ? (
                      <Spin size="small" />
                    ) : (
                      <Select
                        placeholder="Chọn giống"
                        className="w-full"
                        value={
                          category.createCompetionCategoryVarieties.length > 0
                            ? category.createCompetionCategoryVarieties[0]
                            : ""
                        }
                        onChange={(value) => handleVarietyChange(index, value)}
                      >
                        {variety.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mx-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng tham gia tối đa
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Nhập số lượng tối đa"
                        value={category.maxEntries || ""}
                        onChange={(e) =>
                          handleCategoryChange(
                            index,
                            "maxEntries",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh sách vòng thi và vòng nhỏ
                  </label>
                  {mainRounds.map((round) => (
                    <div key={round.value} className="mb-4">
                      <div className="flex justify-between items-center p-2 border rounded-md">
                        <span className="font-semibold">{round.label}</span>
                        <span
                          className="cursor-pointer text-blue-500 hover:text-blue-700 flex items-center"
                          onClick={() => handleAddSubRound(index, round.value)}
                        >
                          <PlusOutlined className="mr-1" />
                        </span>
                      </div>
                      {/* Chỉ hiển thị vòng nhỏ của hạng mục đang chọn */}
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
                                      handleRemoveSubRound(index, subRound);
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
                                    <label className="block text-sm font-medium text-gray-700">
                                      Tên Vòng
                                    </label>
                                    <Input
                                      value={subRound.name}
                                      onChange={(e) => {
                                        setCategories((prev) => {
                                          const updatedCategories = [...prev];
                                          updatedCategories[
                                            index
                                          ].createRoundRequests[subIndex].name =
                                            e.target.value;
                                          return updatedCategories;
                                        });
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Thứ tự vòng
                                    </label>
                                    <Input
                                      value={subRound.roundOrder}
                                      disabled
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Điểm tối thiểu để vượt qua
                                    </label>
                                    <Input
                                      type="number"
                                      value={subRound.minScoreToAdvance}
                                      onChange={(e) => {
                                        setCategories((prev) => {
                                          const updatedCategories = [...prev];
                                          updatedCategories[
                                            index
                                          ].createRoundRequests[
                                            subIndex
                                          ].minScoreToAdvance = e.target.value;
                                          return updatedCategories;
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
                                        setCategories((prev) => {
                                          const updatedCategories = [...prev];
                                          updatedCategories[
                                            index
                                          ].createRoundRequests[
                                            subIndex
                                          ].status = value;
                                          return updatedCategories;
                                        });
                                      }}
                                    >
                                      <Option value="Ongoing">
                                        Đang diễn ra
                                      </Option>
                                      <Option value="Completed">
                                        Hoàn thành
                                      </Option>
                                      <Option value="Pending">Chờ duyệt</Option>
                                    </Select>
                                  </div>
                                </Space>
                              </Panel>
                            ))}
                        </Collapse>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chọn vòng trước khi chọn tiêu chí */}
                <div>
                  {/* Chọn tiêu chí */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn tiêu chí
                  </label>
                  <Select
                    mode="multiple"
                    placeholder="Chọn tiêu chí"
                    className="w-full mb-2"
                    value={
                      category.tempSelectedCriteria?.map((c) => c.criteriaId) ||
                      []
                    }
                    onChange={(values) =>
                      handleCriteriaSelection(index, values)
                    }
                  >
                    {criteria.map((item) => (
                      <Option key={item.id} value={item.id}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>

                  {/* Chỉ hiển thị chọn vòng khi đã chọn ít nhất một tiêu chí */}
                  {category.tempSelectedCriteria?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chọn vòng chính để gán tiêu chí đã chọn
                      </label>
                      <Select
                        className="w-full mb-2"
                        placeholder="Chọn vòng chính"
                        onChange={(value) =>
                          handleMainRoundChange(index, value)
                        }
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
                <Collapse>
                  {mainRounds.map((round) => {
                    const criteriaInRound =
                      category.createCriteriaCompetitionCategoryRequests.filter(
                        (c) => c.roundType === round.value
                      );

                    return criteriaInRound.length > 0 ? (
                      <Collapse.Panel
                        key={round.value}
                        header={`Tiêu chí - ${round.label}`}
                      >
                        {criteriaInRound.map((criteriaItem) => (
                          <div
                            key={criteriaItem.criteriaId}
                            className="flex items-center space-x-4 mb-2"
                          >
                            {/* Hiển thị tên tiêu chí */}
                            <span className="text-sm font-medium flex-1">
                              {criteria.find(
                                (c) => c.id === criteriaItem.criteriaId
                              )?.name || "Tiêu chí không xác định"}
                            </span>

                            {/* Ô nhập trọng số */}
                            <Input
                              type="number"
                              suffix="%"
                              placeholder="Nhập trọng số"
                              value={criteriaItem.weight * 100} // Hiển thị đúng trọng số của vòng đó
                              onChange={(e) =>
                                handleWeightChange(
                                  index,
                                  criteriaItem.criteriaId,
                                  criteriaItem.roundType,
                                  e.target.value
                                )
                              }
                              className="w-1/4"
                            />
                          </div>
                        ))}
                      </Collapse.Panel>
                    ) : null;
                  })}
                </Collapse>

                {/* Giải thưởng */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giải thưởng{" "}
                </label>
                {/* Nút thêm giải thưởng */}
                <Button
                  onClick={() => handleAddAward(index)}
                  icon={<PlusOutlined />}
                >
                  Thêm Giải Thưởng
                </Button>

                {/* Danh sách giải thưởng */}
                <Collapse className="mt-3">
                  {category.createAwardCateShowRequests.map(
                    (award, awardIndex) => (
                      <Collapse.Panel
                        header={`Giải thưởng ${awardIndex + 1}`}
                        key={awardIndex}
                        extra={
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAward(index, awardIndex);
                            }}
                          />
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
                                  index,
                                  awardIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Loại Giải Thưởng
                            </label>
                            <Input
                              placeholder="Nhập loại giải thưởng"
                              value={award.awardType}
                              onChange={(e) =>
                                handleAwardChange(
                                  index,
                                  awardIndex,
                                  "awardType",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Giá Trị Giải Thưởng
                            </label>
                            <Input
                              type="number"
                              placeholder="Nhập giá trị (VND)"
                              value={award.prizeValue}
                              onChange={(e) =>
                                handleAwardChange(
                                  index,
                                  awardIndex,
                                  "prizeValue",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Mô Tả Giải Thưởng
                            </label>
                            <Input.TextArea
                              rows={2}
                              placeholder="Nhập mô tả giải thưởng"
                              value={award.description}
                              onChange={(e) =>
                                handleAwardChange(
                                  index,
                                  awardIndex,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </Space>
                      </Collapse.Panel>
                    )
                  )}
                </Collapse>

                {/* Chọn trọng tài */}
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
                    onChange={(values) => handleRefereeChange(index, values)}
                  >
                    {referee.map((r) => (
                      <Option key={r.id} value={r.id}>
                        {r.fullName}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Danh sách trọng tài đã chọn */}
                <Collapse className="mb-4">
                  {category.createRefereeAssignmentRequests.map(
                    (assignment, idx) => (
                      <Collapse.Panel
                        key={assignment.refereeAccountId}
                        header={`Trọng tài: ${referee.find((r) => r.id === assignment.refereeAccountId)?.fullName || "Không xác định"}`}
                        extra={
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() =>
                              handleRefereeChange(
                                index,
                                category.createRefereeAssignmentRequests
                                  .filter((_, i) => i !== idx)
                                  .map((r) => r.refereeAccountId)
                              )
                            }
                          />
                        }
                      >
                        <label className="block text-sm font-medium text-gray-700">
                          Chọn vòng chấm điểm cho trọng tài này
                        </label>
                        <Select
                          mode="multiple"
                          className="w-full"
                          value={assignment.roundType}
                          onChange={(value) =>
                            handleRefereeRoundChange(
                              index,
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
                      </Collapse.Panel>
                    )
                  )}
                </Collapse>
              </div>
            </Card>
          </Collapse.Panel>
        ))}
      </Collapse>

      <Button
        onClick={handleAddCategory}
        icon={<PlusOutlined />}
        className="mt-4"
      >
        Thêm Hạng Mục
      </Button>
    </>
  );
}

export default StepTwo;
