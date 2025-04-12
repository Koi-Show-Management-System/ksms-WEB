import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  Select,
  Space,
  Spin,
  message,
  Tag,
  InputNumber,
} from "antd";
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
      : []
  );
  // Thêm state để quản lý lỗi cho kích thước và số lượng tham gia
  const [sizeErrors, setSizeErrors] = useState({});
  const [entriesErrors, setEntriesErrors] = useState({});

  useEffect(() => {
    updateFormData({ createCategorieShowRequests: categories });
  }, [categories]);

  useEffect(() => {
    fetchVariety();
    fetchAccountTeam(1, 100);
  }, []);

  const handleCategoryChange = (index, field, value) => {
    if (field === "registrationFee") {
      if (value < 0) {
        message.error(`${field} không được nhỏ hơn 0`);
        return;
      }
    }

    // Xử lý các trường liên quan đến kích thước
    if (field === "sizeMin" || field === "sizeMax") {
      // Lấy giá trị hiện tại
      const updatedCategories = [...categories];
      const category = updatedCategories[index] || {};
      const currentSizeMin = field === "sizeMin" ? value : category.sizeMin;
      const currentSizeMax = field === "sizeMax" ? value : category.sizeMax;

      // Cập nhật state lỗi
      const newSizeErrors = { ...sizeErrors };

      if (!newSizeErrors[index]) {
        newSizeErrors[index] = {};
      }

      // Kiểm tra kích thước tối thiểu
      if (
        currentSizeMin &&
        currentSizeMax &&
        Number(currentSizeMin) >= Number(currentSizeMax)
      ) {
        newSizeErrors[index].sizeMin =
          "Kích thước tối thiểu phải nhỏ hơn kích thước tối đa";
        newSizeErrors[index].sizeMax =
          "Kích thước tối đa phải lớn hơn kích thước tối thiểu";
      } else {
        // Xóa lỗi nếu hợp lệ
        newSizeErrors[index].sizeMin = "";
        newSizeErrors[index].sizeMax = "";
      }

      setSizeErrors(newSizeErrors);
    }

    // Xử lý các trường liên quan đến số lượng tham gia
    if (field === "minEntries" || field === "maxEntries") {
      // Lấy giá trị hiện tại
      const updatedCategories = [...categories];
      const category = updatedCategories[index] || {};
      const currentMinEntries =
        field === "minEntries" ? value : category.minEntries;
      const currentMaxEntries =
        field === "maxEntries" ? value : category.maxEntries;

      // Cập nhật state lỗi
      const newEntriesErrors = { ...entriesErrors };

      if (!newEntriesErrors[index]) {
        newEntriesErrors[index] = {};
      }

      // Kiểm tra số lượng tham gia
      if (
        currentMinEntries &&
        currentMaxEntries &&
        Number(currentMinEntries) > Number(currentMaxEntries)
      ) {
        newEntriesErrors[index].minEntries =
          "Số lượng tối thiểu phải nhỏ hơn hoặc bằng số lượng tối đa";
        newEntriesErrors[index].maxEntries =
          "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu";
      } else {
        // Xóa lỗi nếu hợp lệ
        newEntriesErrors[index].minEntries = "";
        newEntriesErrors[index].maxEntries = "";
      }

      setEntriesErrors(newEntriesErrors);
    }

    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories];
      if (!updatedCategories[index]) {
        updatedCategories[index] = {};
      }
      updatedCategories[index] = {
        ...updatedCategories[index],
        [field]: value,
      };
      return updatedCategories;
    });
  };

  const handleAddAward = (categoryIndex) => {
    // Kiểm tra nếu đã có đủ 4 loại giải thưởng
    const category = categories[categoryIndex];
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

    setCategories((prevCategories) => {
      return prevCategories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              createAwardCateShowRequests: [
                ...(category.createAwardCateShowRequests || []),
                {
                  name: awardName,
                  awardType: nextAwardType,
                  prizeValue: "",
                  description: "",
                },
              ],
            }
          : category
      );
    });
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
    if (field === "prizeValue" && value < 0) {
      message.error("Giá trị giải thưởng không được nhỏ hơn 0");
      return;
    }

    // Kiểm tra thứ tự khi chọn loại giải
    if (field === "awardType") {
      const awards = [...categories[categoryIndex].createAwardCateShowRequests];
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
      setCategories((prevCategories) =>
        prevCategories.map((category, i) =>
          i === categoryIndex
            ? {
                ...category,
                createAwardCateShowRequests:
                  category.createAwardCateShowRequests.map((award, j) =>
                    j === awardIndex
                      ? { ...award, awardType: value, name: awardName }
                      : award
                  ),
              }
            : category
        )
      );
      return;
    }

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
    if (value < 0 || value > 100) {
      message.error("Trọng số phải nằm trong khoảng 0-100");
      return;
    }

    const weightValue = Number(value) / 100;

    setCategories((prevCategories) =>
      prevCategories.map((category, i) => {
        if (i !== categoryIndex) return category;

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
      maxEntries: 0,
      minEntries: 0,
      createAwardCateShowRequests: [],
      createCompetionCategoryVarieties: [],
      createRoundRequests: [],
      createRefereeAssignmentRequests: [],
      createCriteriaCompetitionCategoryRequests: [],
    };

    setCategories((prevCategories) => [...(prevCategories || []), newCategory]);
  };

  const handleRemoveCategory = (index) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...(prevCategories || [])];
      updatedCategories.splice(index, 1);
      return updatedCategories;
    });
  };

  const handleMainRoundChange = (categoryIndex, value) => {
    setCategories((prev) => {
      const updatedCategories = [...(prev || [])];
      const category = updatedCategories[categoryIndex];

      if (!category) return updatedCategories;

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
            (category.createCriteriaCompetitionCategoryRequests || []).length +
            index +
            1,
        })
      );

      category.createCriteriaCompetitionCategoryRequests = [
        ...(category.createCriteriaCompetitionCategoryRequests || []),
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
      const updatedCategories = [...(prev || [])];
      const category = updatedCategories[categoryIndex];

      if (!category) return updatedCategories;

      if (!category.createRoundRequests) {
        category.createRoundRequests = [];
      }

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

      category.createRoundRequests.push(newRound);

      return updatedCategories;
    });
  };

  const handleRemoveSubRound = (categoryIndex, roundToRemove) => {
    setCategories((prev) => {
      const updatedCategories = [...(prev || [])];
      const category = updatedCategories[categoryIndex];

      if (!category || !category.createRoundRequests) return updatedCategories;

      category.createRoundRequests = category.createRoundRequests.filter(
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

  // Thêm các hàm helper
  const calculateTotalWeight = (criteriaList) => {
    return Math.round(
      criteriaList.reduce((total, c) => total + (c.weight * 100 || 0), 0)
    );
  };

  const getTotalWeightColor = (criteriaList) => {
    const total = calculateTotalWeight(criteriaList);
    return total === 100 ? "green" : "red";
  };

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6">
        Bước 2: Các Hạng Mục và Tiêu Chí Đánh Giá
      </h2>
      <p className="mb-4 text-gray-600">
        Bạn có thể tạo các hạng mục cho cuộc thi hoặc bỏ qua bước này và thêm
        hạng mục sau.
      </p>

      {categories.length > 0 ? (
        <Collapse accordion>
          {categories.map((category, index) => (
            <Collapse.Panel
              header={category.name || `Hạng mục ${index + 1}`}
              key={index}
              extra={
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCategory(index);
                  }}
                />
              }
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
                    <div className="flex-1 mt-4 ">
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
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (e.target.value === "" || value >= 0) {
                            handleCategoryChange(
                              index,
                              "sizeMin",
                              e.target.value
                            );
                          }
                        }}
                        min={0}
                      />
                      {sizeErrors[index]?.sizeMin && (
                        <p className="text-red-500 text-xs mt-1">
                          {sizeErrors[index].sizeMin}
                        </p>
                      )}
                      {showErrors &&
                        !category.sizeMin &&
                        !sizeErrors[index]?.sizeMin && (
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
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (e.target.value === "" || value >= 0) {
                            handleCategoryChange(
                              index,
                              "sizeMax",
                              e.target.value
                            );
                          }
                        }}
                        min={0}
                      />
                      {sizeErrors[index]?.sizeMax && (
                        <p className="text-red-500 text-xs mt-1">
                          {sizeErrors[index].sizeMax}
                        </p>
                      )}
                      {showErrors &&
                        !category.sizeMax &&
                        !sizeErrors[index]?.sizeMax && (
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
                        placeholder="Có/Không"
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
                  <div className="flex mb-4 space-x-3">
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phí đăng ký (VND)
                      </label>

                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        placeholder="Nhập phí đăng ký"
                        value={category.registrationFee || ""}
                        onChange={(value) =>
                          handleCategoryChange(index, "registrationFee", value)
                        }
                        addonAfter="VND"
                      />
                      {showErrors && !category.registrationFee && (
                        <p className="text-red-500 text-xs mt-1">
                          Phí đăng ký là bắt buộc.{" "}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng tham gia tối thiểu
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Nhập số lượng tối thiểu"
                        value={category.minEntries || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (e.target.value === "" || value >= 1) {
                            handleCategoryChange(
                              index,
                              "minEntries",
                              e.target.value
                            );
                          }
                        }}
                      />
                      {entriesErrors[index]?.minEntries && (
                        <p className="text-red-500 text-xs mt-1">
                          {entriesErrors[index].minEntries}
                        </p>
                      )}
                      {showErrors &&
                        (!category.minEntries || category.minEntries < 1) &&
                        !entriesErrors[index]?.minEntries && (
                          <p className="text-red-500 text-xs mt-1">
                            Số lượng tham gia tối thiểu phải lớn hơn 0.
                          </p>
                        )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng tham gia tối đa
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Nhập số lượng tối đa"
                        value={category.maxEntries || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (e.target.value === "" || value >= 1) {
                            handleCategoryChange(
                              index,
                              "maxEntries",
                              e.target.value
                            );
                          }
                        }}
                      />
                      {entriesErrors[index]?.maxEntries && (
                        <p className="text-red-500 text-xs mt-1">
                          {entriesErrors[index].maxEntries}
                        </p>
                      )}
                      {showErrors &&
                        (!category.maxEntries || category.maxEntries < 1) &&
                        !entriesErrors[index]?.maxEntries && (
                          <p className="text-red-500 text-xs mt-1">
                            Số lượng tham gia tối đa phải lớn hơn 0.
                          </p>
                        )}
                    </div>
                  </div>
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
                            onClick={() =>
                              handleAddSubRound(index, round.value)
                            }
                          >
                            <PlusOutlined className="mr-1" />
                          </span>
                        </div>
                        {/* Chỉ hiển thị vòng nhỏ của hạng mục đang chọn */}
                        {category.createRoundRequests &&
                          category.createRoundRequests.some(
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
                                            value={
                                              subRound.numberOfRegistrationToAdvance
                                            }
                                            onChange={(e) => {
                                              // Cho phép giá trị rỗng tạm thời để người dùng có thể xóa và nhập lại
                                              if (e.target.value === "") {
                                                setCategories((prev) => {
                                                  const updatedCategories = [
                                                    ...prev,
                                                  ];
                                                  if (
                                                    !updatedCategories[index]
                                                      .createRoundRequests
                                                  ) {
                                                    updatedCategories[
                                                      index
                                                    ].createRoundRequests = [];
                                                  }

                                                  const actualIndex =
                                                    updatedCategories[
                                                      index
                                                    ].createRoundRequests.findIndex(
                                                      (r) =>
                                                        r.name ===
                                                          subRound.name &&
                                                        r.roundType ===
                                                          subRound.roundType
                                                    );

                                                  if (actualIndex !== -1) {
                                                    updatedCategories[
                                                      index
                                                    ].createRoundRequests[
                                                      actualIndex
                                                    ].numberOfRegistrationToAdvance =
                                                      null;
                                                  }

                                                  return updatedCategories;
                                                });
                                                return;
                                              }

                                              const value = parseInt(
                                                e.target.value,
                                                10
                                              );
                                              // Chỉ kiểm tra giá trị khi không phải là rỗng

                                              setCategories((prev) => {
                                                const updatedCategories = [
                                                  ...prev,
                                                ];
                                                if (
                                                  !updatedCategories[index]
                                                    .createRoundRequests
                                                ) {
                                                  updatedCategories[
                                                    index
                                                  ].createRoundRequests = [];
                                                }

                                                const subRounds =
                                                  updatedCategories[
                                                    index
                                                  ].createRoundRequests.filter(
                                                    (r) =>
                                                      r.roundType ===
                                                      subRound.roundType
                                                  );

                                                // Tìm vị trí của vòng nhỏ trong mảng
                                                const subRoundIndex =
                                                  subRounds.findIndex(
                                                    (r) =>
                                                      r.name === subRound.name
                                                  );

                                                // Tìm vị trí của vòng nhỏ trong mảng tổng
                                                const actualIndex =
                                                  updatedCategories[
                                                    index
                                                  ].createRoundRequests.findIndex(
                                                    (r) =>
                                                      r.name ===
                                                        subRound.name &&
                                                      r.roundType ===
                                                        subRound.roundType
                                                  );

                                                if (actualIndex !== -1) {
                                                  updatedCategories[
                                                    index
                                                  ].createRoundRequests[
                                                    actualIndex
                                                  ].numberOfRegistrationToAdvance =
                                                    value;
                                                }

                                                return updatedCategories;
                                              });
                                            }}
                                          />
                                          {showErrors &&
                                            (!subRound.numberOfRegistrationToAdvance ||
                                              subRound.numberOfRegistrationToAdvance <
                                                1) && (
                                              <p className="text-red-500 text-xs mt-1">
                                                Số cá qua vòng phải từ 1 trở
                                                lên.
                                              </p>
                                            )}
                                        </div>
                                      )}
                                    </Space>
                                  </Panel>
                                ))}
                            </Collapse>
                          )}
                        {/* Hiển thị lỗi nếu vòng chính không có vòng nhỏ nào */}
                        {showErrors &&
                          (!category.createRoundRequests ||
                            !category.createRoundRequests.some(
                              (r) => r.roundType === round.value
                            )) && (
                            <p className="text-red-500 text-xs mt-1">
                              Vòng {round.label} cần có ít nhất một vòng nhỏ.
                            </p>
                          )}
                      </div>
                    ))}
                  </div>

                  {/* Chọn tiêu chí */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu chí đánh giá
                    </label>
                    <Collapse
                      defaultActiveKey={["preliminary", "evaluation", "final"]}
                    >
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
                                    Tổng:{" "}
                                    {calculateTotalWeight(criteriaInRound)}%
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

                                    handleCategoryChange(
                                      index,
                                      "createCriteriaCompetitionCategoryRequests",
                                      [...otherCriteria, ...newCriteria]
                                    );
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
                                            value={
                                              criteriaItem.weight * 100 || 0
                                            }
                                            onChange={(e) => {
                                              const newWeight =
                                                parseFloat(e.target.value) /
                                                100;
                                              if (
                                                newWeight < 0 ||
                                                newWeight > 1
                                              ) {
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

                                              setCategories(
                                                (prevCategories) => {
                                                  const updatedCategories = [
                                                    ...prevCategories,
                                                  ];
                                                  const category =
                                                    updatedCategories[index];

                                                  if (!category)
                                                    return updatedCategories;

                                                  if (
                                                    !category.createCriteriaCompetitionCategoryRequests
                                                  ) {
                                                    category.createCriteriaCompetitionCategoryRequests =
                                                      [];
                                                  }

                                                  const criteriaIndex =
                                                    category.createCriteriaCompetitionCategoryRequests.findIndex(
                                                      (c) =>
                                                        c.criteriaId ===
                                                          criteriaItem.criteriaId &&
                                                        c.roundType ===
                                                          round.value
                                                    );

                                                  if (criteriaIndex !== -1) {
                                                    category.createCriteriaCompetitionCategoryRequests[
                                                      criteriaIndex
                                                    ] = {
                                                      ...category
                                                        .createCriteriaCompetitionCategoryRequests[
                                                        criteriaIndex
                                                      ],
                                                      weight: newWeight,
                                                    };
                                                  }

                                                  return updatedCategories;
                                                }
                                              );
                                            }}
                                            className="w-24"
                                            placeholder="Nhập %"
                                          />
                                          <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => {
                                              setCategories(
                                                (prevCategories) => {
                                                  const updatedCategories = [
                                                    ...prevCategories,
                                                  ];
                                                  const category =
                                                    updatedCategories[index];

                                                  if (
                                                    !category ||
                                                    !category.createCriteriaCompetitionCategoryRequests
                                                  ) {
                                                    return updatedCategories;
                                                  }

                                                  category.createCriteriaCompetitionCategoryRequests =
                                                    category.createCriteriaCompetitionCategoryRequests.filter(
                                                      (c) =>
                                                        !(
                                                          c.criteriaId ===
                                                            criteriaItem.criteriaId &&
                                                          c.roundType ===
                                                            round.value
                                                        )
                                                    );

                                                  return updatedCategories;
                                                }
                                              );
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

                  {/* Giải thưởng */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giải thưởng{" "}
                  </label>
                  <Button
                    onClick={() => handleAddAward(index)}
                    icon={<PlusOutlined />}
                    disabled={false}
                  >
                    Thêm Giải Thưởng
                  </Button>

                  {/* Hiển thị lỗi nếu không có giải thưởng */}
                  {showErrors && (
                    <>
                      {category.createAwardCateShowRequests.length === 0 && (
                        <p className="text-red-500 text-xs mt-1">
                          Bắt buộc phải có ít nhất 1 giải thưởng
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
                                  handleRemoveAward(index, awardIndex);
                                }}
                              >
                                Xóa
                              </Button>
                            }
                          >
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                            >
                              {/* Ẩn phần tên giải thưởng */}
                              {/* <div>
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
                              </div> */}

                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Loại Giải Thưởng
                                </label>
                                <Select
                                  placeholder="Chọn loại giải thưởng"
                                  value={award.awardType}
                                  onChange={(value) =>
                                    handleAwardChange(
                                      index,
                                      awardIndex,
                                      "awardType",
                                      value
                                    )
                                  }
                                  style={{ width: "100%" }}
                                >
                                  {/* Chỉ hiển thị các loại giải chưa được chọn hoặc đang được chọn bởi giải thưởng này */}
                                  {!category.createAwardCateShowRequests.some(
                                    (a) =>
                                      a.awardType === "first" && a !== award
                                  ) && <Option value="first">Giải Nhất</Option>}

                                  {!category.createAwardCateShowRequests.some(
                                    (a) =>
                                      a.awardType === "second" && a !== award
                                  ) && <Option value="second">Giải Nhì</Option>}

                                  {!category.createAwardCateShowRequests.some(
                                    (a) =>
                                      a.awardType === "third" && a !== award
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
                                    Loại giải thưởng là bắt buộc. Mỗi hạng mục
                                    phải có đủ 4 loại giải.
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Giá Trị Giải Thưởng
                                </label>
                                <InputNumber
                                  min={0}
                                  style={{ width: "100%" }}
                                  formatter={(value) =>
                                    `${value}`.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ","
                                    )
                                  }
                                  parser={(value) =>
                                    value.replace(/\$\s?|(,*)/g, "")
                                  }
                                  placeholder="Nhập giá trị (VND)"
                                  value={award.prizeValue}
                                  onChange={(value) =>
                                    handleAwardChange(
                                      index,
                                      awardIndex,
                                      "prizeValue",
                                      value
                                    )
                                  }
                                  addonAfter="VND"
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
                            {showErrors &&
                              assignment.roundTypes.length === 0 && (
                                <p className="text-red-500 text-xs mt-1">
                                  Cần chọn ít nhất một vòng chấm điểm cho trọng
                                  tài này.
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
      ) : (
        <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg mb-4">
          <p className="text-gray-500 mb-4">Chưa có hạng mục nào được tạo</p>
        </div>
      )}

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
