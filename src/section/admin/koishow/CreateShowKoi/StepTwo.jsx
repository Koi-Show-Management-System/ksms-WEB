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

function StepTwo({ updateFormData, initialData, showErrors }) {
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
    { value: "Preliminary", label: "Vòng Sơ Khảo" },
    { value: "Evaluation", label: "Vòng Đánh Giá Chính" },
    { value: "Final", label: "Vòng Chung Kết" },
  ];
  const roundLabelMap = {
    Preliminary: "Vòng Sơ Khảo",
    Evaluation: "Vòng Đánh Giá Chính",
    Final: "Vòng Chung Kết",
  };
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
            hasTank: false,
            registrationFee: "",
            status: "pending",
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

  const handleVarietyChange = (categoryIndex, selectedVarieties) => {
    setCategories((prevCategories) =>
      prevCategories.map((category, i) =>
        i === categoryIndex
          ? { ...category, createCompetionCategoryVarieties: selectedVarieties }
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
              roundTypes: [], // Mỗi trọng tài có danh sách vòng riêng
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
                ? { ...assignment, roundTypes: selectedRounds }
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
      startTime: null,
      endTime: null,
      status: "pending",
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
        name: `Vòng Nhỏ ${existingSubRounds.length + 1} - ${roundLabelMap[mainRound]}`,
        roundOrder: existingSubRounds.length + 1, // Đánh số theo thứ tự trong vòng chính
        roundType: mainRound,
        startTime: dayjs().format(),
        endTime: dayjs().add(1, "day").format(),
        minScoreToAdvance: 100,
        status: "pending",
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
  const handleRemoveCriteria = (categoryIndex, criteriaId) => {
    setCategories((prev) => {
      const updatedCategories = [...prev];

      updatedCategories[
        categoryIndex
      ].createCriteriaCompetitionCategoryRequests = updatedCategories[
        categoryIndex
      ].createCriteriaCompetitionCategoryRequests.filter(
        (criteria) => criteria.criteriaId !== criteriaId
      );

      return updatedCategories;
    });
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
                  {showErrors && !category.name && (
                    <p className="text-red-500 text-xs mt-1">
                      Địa điểm tổ chức là bắt buộc.{" "}
                    </p>
                  )}
                </div>

                {/* <div className="flex space-x-4">
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
                    {showErrors && !category.startTime && (
                      <p className="text-red-500 text-xs mt-1">
                        Thời gian bắt đầu là bắt buộc.{" "}
                      </p>
                    )}
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
                    {showErrors && !category.startTime && (
                      <p className="text-red-500 text-xs mt-1">
                        Thời gian kết thúc là bắt buộc.{" "}
                      </p>
                    )}
                  </div>
                </div> */}

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
                    {showErrors && !category.sizeMin && (
                      <p className="text-red-500 text-xs mt-1">
                        Kích thước tối thiểu là bắt buộc.{" "}
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
                      value={category.sizeMax || ""}
                      onChange={(e) =>
                        handleCategoryChange(index, "sizeMax", e.target.value)
                      }
                    />
                    {showErrors && !category.sizeMax && (
                      <p className="text-red-500 text-xs mt-1">
                        Kích thước tối đa là bắt buộc.{" "}
                      </p>
                    )}
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
                    {showErrors && !category.description && (
                      <p className="text-red-500 text-xs mt-1">
                        Mô tả là bắt buộc.{" "}
                      </p>
                    )}
                  </div>
                  <div className="">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Có bể trưng bày
                    </label>
                    <Select
                      placeholder="Chọn có/không"
                      className="w-full"
                      value={category.hasTank}
                      onChange={(value) =>
                        handleCategoryChange(index, "hasTank", value)
                      }
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
                        mode="multiple"
                        placeholder="Chọn giống cá koi"
                        className="w-full"
                        value={category.createCompetionCategoryVarieties}
                        onChange={(values) =>
                          handleVarietyChange(index, values)
                        }
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
                        category.createCompetionCategoryVarieties.length ===
                          0) && (
                        <p className="text-red-500 text-xs mt-1">
                          Chọn ít nhất một giống.
                        </p>
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
                      {showErrors && !category.description && (
                        <p className="text-red-500 text-xs mt-1">
                          Số lượng tham gia tối đa là bắt buộc.{" "}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phí đăng ký (VND)
                    </label>

                    <Input
                      type="number"
                      min={1}
                      placeholder="Nhập phí đăng ký"
                      value={category.registrationFee || ""}
                      onChange={(e) =>
                        handleCategoryChange(
                          index,
                          "registrationFee",
                          e.target.value
                        )
                      }
                    />
                    {showErrors && !category.registrationFee && (
                      <p className="text-red-500 text-xs mt-1">
                        Phí đăng ký là bắt buộc.{" "}
                      </p>
                    )}
                  </div>
                </div>

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
                                      <Option value="ongoing">
                                        Đang diễn ra
                                      </Option>
                                      <Option value="completed">
                                        Hoàn thành
                                      </Option>
                                      <Option value="pending">Chờ duyệt</Option>
                                    </Select>
                                  </div>
                                </Space>
                              </Panel>
                            ))}
                        </Collapse>
                      )}
                      {/* Hiển thị lỗi nếu vòng chính không có vòng nhỏ nào */}
                      {showErrors &&
                        !category.createRoundRequests.some(
                          (r) => r.roundType === round.value
                        ) && (
                          <p className="text-red-500 text-xs mt-1">
                            Vòng {round.label} cần có ít nhất một vòng nhỏ.
                          </p>
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

                              {/* Nút xóa tiêu chí */}
                              <span
                                className="text-red-500 cursor-pointer hover:text-red-700"
                                onClick={() =>
                                  handleRemoveCriteria(
                                    index,
                                    criteriaItem.criteriaId
                                  )
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

                        {/* Hiển thị lỗi nếu vòng có ít hơn 3 tiêu chí */}
                        {showErrors && criteriaInRound.length < 3 && (
                          <p className="text-red-500 text-xs mt-2">
                            Cần chọn ít nhất 3 tiêu chí cho {round.label}.
                          </p>
                        )}
                      </Collapse.Panel>
                    );
                  })}
                </Collapse>

                {/* Giải thưởng */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giải thưởng{" "}
                </label>
                <Button
                  onClick={() => handleAddAward(index)}
                  icon={<PlusOutlined />}
                >
                  Thêm Giải Thưởng
                </Button>

                {/* Hiển thị lỗi nếu không có giải thưởng nào */}
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
                                handleRemoveAward(index, awardIndex);
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
                                    index,
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
                              {showErrors && !award.awardType && (
                                <p className="text-red-500 text-xs mt-1">
                                  Loại giải thưởng là bắt buộc.
                                </p>
                              )}
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
                              {showErrors &&
                                (!award.prizeValue ||
                                  award.prizeValue <= 0) && (
                                  <p className="text-red-500 text-xs mt-1">
                                    Giá trị giải thưởng phải lớn hơn 0.
                                  </p>
                                )}
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

                  {/* Hiển thị lỗi nếu không có trọng tài nào */}
                  {showErrors &&
                    category.createRefereeAssignmentRequests.length === 0 && (
                      <p className="text-red-500 text-xs mt-1">
                        Cần chọn ít nhất một trọng tài.
                      </p>
                    )}
                </div>

                {/* Danh sách trọng tài đã chọn */}
                {category.createRefereeAssignmentRequests.length > 0 && (
                  <Collapse className="mb-4">
                    {category.createRefereeAssignmentRequests.map(
                      (assignment, idx) => (
                        <Collapse.Panel
                          key={assignment.refereeAccountId}
                          header={`Trọng tài: ${
                            referee.find(
                              (r) => r.id === assignment.refereeAccountId
                            )?.fullName || "Không xác định"
                          }`}
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
                            value={assignment.roundTypes}
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

                          {/* Hiển thị lỗi nếu trọng tài chưa có vòng chấm điểm */}
                          {showErrors && assignment.roundTypes.length === 0 && (
                            <p className="text-red-500 text-xs mt-1">
                              Cần chọn ít nhất một vòng chấm điểm cho trọng tài
                              này.
                            </p>
                          )}
                        </Collapse.Panel>
                      )
                    )}
                  </Collapse>
                )}
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
