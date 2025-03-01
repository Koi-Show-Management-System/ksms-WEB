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
  // States
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [selectedCriteriaList, setSelectedCriteriaList] = useState([]);
  const [criteriaDetails, setCriteriaDetails] = useState({});
  const [criteriaPercentages, setCriteriaPercentages] = useState({});
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [subRounds, setSubRounds] = useState([]);
  const { variety, fetchVariety, isLoading } = useVariety();
  const [selectedRoundType, setSelectedRoundType] = useState("");
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const { criteria, fetchCriteria } = useCriteria();
  const [selectedMainRound, setSelectedMainRound] = useState("");

  const referee = accountManage.referees || [];
  // const adminId =
  //   accountManage.admin.length > 0 ? accountManage.admin[0].id : null;
  // Constants
  const criteriaOptions = [
    { value: "color", label: "Màu sắc" },
    { value: "bodyShape", label: "Hình dáng cơ thể" },
    { value: "pattern", label: "Họa tiết" },
    { value: "size", label: "Kích thước" },
    { value: "quality", label: "Chất lượng" },
    { value: "health", label: "Sức khỏe" },
    { value: "swimming", label: "Bơi lội" },
    { value: "markings", label: "Đặc điểm phân biệt" },
    { value: "balance", label: "Cân bằng" },
    { value: "elegance", label: "Sự thanh lịch" },
  ];

  useEffect(() => {
    fetchCriteria(1, 100);
  }, []);
  const mainRounds = [
    { value: "Vòng Sơ Khảo", label: "Vòng Sơ Khảo" },
    { value: "Vòng Đánh Giá Chính", label: "Vòng Đánh Giá Chính" },
    { value: "Vòng Chung Kết", label: "Vòng Chung Kết" },
  ];

  const handleRoundChange = (index, field, value) => {
    const updatedRounds = [...categories[0].createRoundRequests];
    updatedRounds[index][field] = value;
    setCategories([{ ...categories[0], createRoundRequests: updatedRounds }]);
  };

  const handlePercentageChange = (criteria, value) => {
    const numValue = Number(value);
    const otherCriteriaTotal = Object.entries(criteriaPercentages).reduce(
      (sum, [key, val]) => (key !== criteria ? sum + Number(val) : sum),
      0
    );

    if (otherCriteriaTotal + numValue <= 100) {
      setCriteriaPercentages((prev) => ({
        ...prev,
        [criteria]: numValue,
      }));
      setTotalPercentage(otherCriteriaTotal + numValue);
    }
  };

  const getRemainingPercentage = () => {
    return (
      100 -
      Object.values(criteriaPercentages).reduce(
        (sum, val) => sum + Number(val),
        0
      )
    );
  };

  const isValidTotal = () => totalPercentage === 100;
  const defaultRounds = [
    {
      name: "Vòng Sơ Khảo",
      roundOrder: 1,
      roundType: "Vòng Sơ Khảo",
      startTime: "2025-03-01T08:05:06.190Z",
      endTime: "2025-03-01T08:05:06.190Z",
      minScoreToAdvance: 100,
      status: "Ongoing",
    },
    {
      name: "Vòng Đánh Giá Chính",
      roundOrder: 2,
      roundType: "Vòng Đánh Giá Chính",
      startTime: "2025-03-01T08:05:06.190Z",
      endTime: "2025-03-01T08:05:06.190Z",
      minScoreToAdvance: 100,
      status: "Ongoing",
    },
    {
      name: "Vòng Chung Kết",
      roundOrder: 3,
      roundType: "Vòng Chung Kết",
      startTime: "2025-03-01T08:05:06.190Z",
      endTime: "2025-03-01T08:05:06.190Z",
      minScoreToAdvance: 100,
      status: "Ongoing",
    },
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
            startTime: "2025-03-01T08:05:06.190Z",
            endTime: "2025-03-01T08:05:06.190Z",
            maxEntries: 0,
            status: "PENDING",
            createAwardCateShowRequests: [],
            createCompetionCategoryVarieties: [],
            createRoundRequests: [], // Xóa defaultRounds
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

  const handleCategoryNameChange = (index, e) => {
    const updatedCategories = [...categories];
    updatedCategories[index].name = e.target.value;
    setCategories(updatedCategories);
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;
    setCategories(updatedCategories);
  };

  const handleAddAward = () => {
    setCategories([
      {
        ...categories[0],
        createAwardCateShowRequests: [
          ...(categories[0]?.createAwardCateShowRequests || []),
          { name: "", awardType: "", prizeValue: "", description: "" },
        ],
      },
    ]);
  };

  const handleAwardChange = (index, field, value) => {
    const updatedAwards = [...categories[0].createAwardCateShowRequests];
    updatedAwards[index][field] = value;
    setCategories([
      { ...categories[0], createAwardCateShowRequests: updatedAwards },
    ]);
  };

  const handleRemoveAward = (index) => {
    const updatedAwards = categories[0].createAwardCateShowRequests.filter(
      (_, i) => i !== index
    );
    setCategories([
      { ...categories[0], createAwardCateShowRequests: updatedAwards },
    ]);
  };

  const handleVarietyChange = (varietyId) => {
    const selectedVariety = variety.find((item) => item.id === varietyId);

    if (selectedVariety) {
      setCategories([
        {
          ...categories[0],
          createCompetionCategoryVarieties: [selectedVariety.id],
        },
      ]);
    }
  };

  const handleRefereeChange = (selectedReferees) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories];

      const newAssignments = selectedReferees.map((refereeId) => {
        const existingAssignment =
          updatedCategories[0].createRefereeAssignmentRequests.find(
            (assignment) => assignment.refereeAccountId === refereeId
          );

        return existingAssignment
          ? existingAssignment
          : {
              refereeAccountId: refereeId,
              // assignedAt: new Date().toISOString(),
              roundType: [],
              // assignedBy: adminId,
            };
      });

      updatedCategories[0].createRefereeAssignmentRequests = newAssignments;
      return updatedCategories;
    });
  };

  const handleRefereeRoundChange = (refereeId, selectedRounds) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories];
      const assignments =
        updatedCategories[0].createRefereeAssignmentRequests.map(
          (assignment) =>
            assignment.refereeAccountId === refereeId
              ? { ...assignment, roundType: selectedRounds }
              : assignment
        );

      updatedCategories[0].createRefereeAssignmentRequests = assignments;
      return updatedCategories;
    });
  };

  const handleWeightChange = (categoryIndex, criteriaId, value) => {
    const weightValue = Number(value) / 100; // Chuyển 30 thành 0.3

    setCategories((prev) => {
      const updatedCategories = [...prev];

      updatedCategories[
        categoryIndex
      ].createCriteriaCompetitionCategoryRequests = updatedCategories[
        categoryIndex
      ].createCriteriaCompetitionCategoryRequests.map((criteria) =>
        criteria.criteriaId === criteriaId
          ? { ...criteria, weight: weightValue }
          : criteria
      );

      return updatedCategories;
    });
  };

  const handleCriteriaSelection = (categoryIndex, values) => {
    setCategories((prev) => {
      const updatedCategories = [...prev];

      updatedCategories[categoryIndex] = {
        ...updatedCategories[categoryIndex],
        createCriteriaCompetitionCategoryRequests: values.map((id, index) => ({
          criteriaId: id,
          roundType: updatedCategories[categoryIndex].selectedMainRound || "",
          weight: 0,
          order: index + 1,
        })),
      };

      return updatedCategories;
    });
  };

  const handleRoundTypeChangeCriteria = (criteriaId, value) => {
    setCriteriaDetails((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], roundType: value },
    }));

    setCategories((prev) => {
      const updatedCategories = prev.map((category) => ({
        ...category,
        createCriteriaCompetitionCategoryRequests:
          category.createCriteriaCompetitionCategoryRequests.map((criteria) =>
            criteria.criteriaId === criteriaId
              ? { ...criteria, roundType: value } // Cập nhật roundType
              : criteria
          ),
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

      updatedCategories[categoryIndex] = {
        ...updatedCategories[categoryIndex],
        selectedMainRound: value,
        createCriteriaCompetitionCategoryRequests: [], // Reset tiêu chí khi đổi vòng chính
      };

      return updatedCategories;
    });
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
                    onChange={(e) => handleCategoryNameChange(index, e)}
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian bắt đầu
                    </label>
                    <DatePicker
                      className="w-full"
                      showTime
                      value={
                        categories[0]?.startTime
                          ? dayjs(categories[0]?.startTime).tz(
                              "Asia/Ho_Chi_Minh"
                            )
                          : null
                      }
                      onChange={(date) =>
                        handleCategoryChange(
                          "startTime",
                          date ? date.tz("Asia/Ho_Chi_Minh").format() : ""
                        )
                      }
                      format="YYYY-MM-DD HH:mm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian kết thúc
                    </label>
                    <DatePicker
                      className="w-full"
                      showTime
                      value={
                        categories[0]?.endTime
                          ? dayjs(categories[0]?.endTime).tz("Asia/Ho_Chi_Minh")
                          : null
                      }
                      onChange={(date) =>
                        handleCategoryChange(
                          "endTime",
                          date ? date.tz("Asia/Ho_Chi_Minh").format() : ""
                        )
                      }
                      format="YYYY-MM-DD HH:mm"
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
                      value={categories[0]?.sizeMin || ""}
                      onChange={(e) =>
                        handleCategoryChange("sizeMin", e.target.value)
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
                      value={categories[0]?.sizeMax || ""}
                      onChange={(e) =>
                        handleCategoryChange("sizeMax", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <Input
                      placeholder="Nhập mô tả thể loại"
                      value={categories[0]?.description || ""}
                      onChange={(e) =>
                        handleCategoryChange("description", e.target.value)
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
                          categories[0]?.createCompetionCategoryVarieties
                            ?.length > 0
                            ? categories[0].createCompetionCategoryVarieties[0]
                                .varietyId
                            : ""
                        }
                        onChange={handleVarietyChange}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn vòng chính để thêm tiêu chí
                  </label>
                  <Select
                    className="w-full mb-2"
                    placeholder="Chọn vòng chính"
                    value={category.selectedMainRound || ""}
                    onChange={(value) => handleMainRoundChange(index, value)} // Sửa lại để truyền index
                  >
                    {mainRounds.map((round) => (
                      <Option key={round.value} value={round.value}>
                        {round.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Chọn tiêu chí */}
                {category.selectedMainRound && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn tiêu chí
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="Chọn tiêu chí"
                      className="w-full mb-2"
                      value={category.createCriteriaCompetitionCategoryRequests.map(
                        (c) => c.criteriaId
                      )}
                      onChange={(values) =>
                        handleCriteriaSelection(index, values)
                      }
                      maxTagCount={3}
                    >
                      {criteria.map((item) => (
                        <Option key={item.id} value={item.id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}

                {/* Chỉ hiển thị nếu đã chọn tiêu chí */}
                {/* Chỉ hiển thị nếu đã chọn tiêu chí */}
                {category.createCriteriaCompetitionCategoryRequests.length >
                  0 && (
                  <div className="mt-4">
                    {category.createCriteriaCompetitionCategoryRequests.map(
                      (criteriaItem) => (
                        <div
                          key={criteriaItem.criteriaId}
                          className="flex items-center space-x-4 mb-2"
                        >
                          {/* Tên tiêu chí */}
                          <span className="text-sm font-medium flex-1">
                            {criteria.find(
                              (c) => c.id === criteriaItem.criteriaId
                            )?.name || "Tiêu chí không xác định"}
                          </span>

                          {/* Ô nhập % */}
                          <Input
                            type="number"
                            suffix="%"
                            placeholder="Nhập trọng số"
                            value={criteriaItem.weight * 100} // Chuyển 0.3 thành 30
                            onChange={(e) =>
                              handleWeightChange(
                                index,
                                criteriaItem.criteriaId,
                                e.target.value
                              )
                            }
                            className="w-1/4"
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Number of Koi */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng Koi
                  </label>
                  <Input placeholder="Nhập số lượng koi" type="number" />
                </div>

                {/* Giải thưởng */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giải thưởng{" "}
                </label>
                <Button onClick={handleAddAward} icon={<PlusOutlined />}>
                  Thêm Giải Thưởng
                </Button>

                <Collapse className="mt-3">
                  {Array.isArray(categories[0]?.createAwardCateShowRequests) &&
                    categories[0].createAwardCateShowRequests.map(
                      (award, index) => (
                        <Panel
                          header={`Giải thưởng ${index + 1}`}
                          key={index}
                          extra={
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              danger
                              onClick={(e) => {
                                e.stopPropagation(); // Ngăn mở panel khi xóa
                                handleRemoveAward(index);
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
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </Space>
                        </Panel>
                      )
                    )}
                </Collapse>

                {/* Chọn trọng tài */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn trọng tài{" "}
                  </label>
                  <Select
                    mode="multiple"
                    placeholder="Chọn trọng tài"
                    className="w-full"
                    onChange={handleRefereeChange}
                  >
                    {referee.map((referee) => (
                      <Option key={referee.id} value={referee.id}>
                        {referee.fullName}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Hiển thị danh sách trọng tài đã chọn */}
                <Collapse className="mt-4">
                  {categories[0]?.createRefereeAssignmentRequests?.map(
                    (assignment, index) => (
                      <Panel
                        header={`Trọng tài ${index + 1}`}
                        key={index}
                        extra={
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => {
                              const updatedAssignments =
                                categories[0].createRefereeAssignmentRequests.filter(
                                  (_, i) => i !== index
                                );
                              setCategories([
                                {
                                  ...categories[0],
                                  createRefereeAssignmentRequests:
                                    updatedAssignments,
                                },
                              ]);
                            }}
                          >
                            Xóa
                          </Button>
                        }
                      >
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Trọng tài
                            </label>
                            <Input
                              value={
                                referee.find(
                                  (r) => r.id === assignment.refereeAccountId
                                )?.fullName || "Không xác định"
                              }
                              disabled
                            />
                          </div>

                          {/* <div>
                <label className="block text-sm font-medium text-gray-700">
                  Thời gian phân công
                </label>
                <Input
                  value={new Date(assignment.assignedAt).toLocaleString()}
                  disabled
                />
              </div> */}

                          <div>
                            <label>Chọn vòng chính</label>
                            <Select
                              mode="multiple"
                              placeholder="Chọn vòng chính"
                              className="w-full"
                              value={assignment.roundType || []}
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
                          </div>

                          {/* <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phân công bởi
                </label>
                <Input
                  value={
                    adminId
                      ? referee.find((r) => r.id === adminId)?.fullName ||
                        "Admin"
                      : "Không có Admin"
                  }
                  disabled
                />
              </div> */}
                        </Space>
                      </Panel>
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
