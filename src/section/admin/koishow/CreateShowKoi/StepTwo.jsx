import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  InputNumber,
  Divider,
  Tooltip,
  Spin,
  notification,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import useVariety from "../../../../hooks/useVariety";
import useAccountTeam from "../../../../hooks/useAccountTeam";
import useCriteria from "../../../../hooks/useCriteria";
import { Loading } from "../../../../components";

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
  const { criteria, fetchCriteria, isLoading: criteriaLoading } = useCriteria();
  const [varietyLoading, setVarietyLoading] = useState(false);
  const varietySelectRefs = useRef([]);
  const [criteriaRefreshLoading, setCriteriaRefreshLoading] = useState(false);
  const criteriaSelectRefs = useRef([]);
  const [refereeRefreshLoading, setRefereeRefreshLoading] = useState(false);
  const refereeSelectRefs = useRef([]);
  // Thêm state để quản lý lỗi cho giá trị giải thưởng
  const [awardErrors, setAwardErrors] = useState({});
  // Thêm state để quản lý lỗi cho tên hạng mục
  const [categoryNameErrors, setCategoryNameErrors] = useState({});
  // Thêm state để quản lý lỗi cho số cá qua vòng
  const [roundsErrors, setRoundsErrors] = useState({});

  const referee = (accountManage.referees || []).filter(
    (r) => r.status === "active"
  );
  // const adminId =
  //   accountManage.admin.length > 0 ? accountManage.admin[0].id : null;

  // Constants for validation limits
  const MAX_NAME_LENGTH = 100;
  const MAX_SIZE = 100;
  const MAX_REGISTRATION_FEE = 10000000; // 10 million VND
  const MAX_ENTRIES = 1000;
  const MAX_PRIZE_VALUE = 100000000000; // 100 billion VND

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

  // Clean up any existing criteria for Preliminary round
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategories((prevCategories) =>
        prevCategories.map((category) => {
          if (category.createCriteriaCompetitionCategoryRequests) {
            // Remove any criteria for Preliminary round
            const filteredCriteria =
              category.createCriteriaCompetitionCategoryRequests.filter(
                (criteria) => criteria.roundType !== "Preliminary"
              );

            return {
              ...category,
              createCriteriaCompetitionCategoryRequests: filteredCriteria,
            };
          }
          return category;
        })
      );
    }
  }, []);

  // Hàm làm mới danh sách giống cá Koi
  const handleRefreshVariety = async () => {
    try {
      setVarietyLoading(true);
      await fetchVariety();
      message.success("Cập nhật danh sách giống cá thành công!");
    } catch (error) {
      message.error("Không thể cập nhật danh sách giống cá!");
    } finally {
      setVarietyLoading(false);
    }
  };

  // Render nút refresh trong dropdown của giống cá Koi
  const renderDropdownWithRefreshVariety = (menu) => {
    return (
      <div>
        {menu}
        <Divider style={{ margin: "4px 0" }} />
        <div style={{ padding: "8px", textAlign: "center" }}>
          <Tooltip title="Làm mới danh sách giống cá">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn đóng dropdown khi click
                handleRefreshVariety();
              }}
              loading={varietyLoading}
              type="text"
              style={{ width: "100%" }}
            >
              Làm mới
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  };

  // Hàm để mở dropdown
  const openDropdown = (index) => {
    if (varietySelectRefs.current[index]) {
      varietySelectRefs.current[index].focus();
    }
  };

  const handleCategoryChange = (index, field, value) => {
    // Validate fields with max values
    if (field === "registrationFee") {
      if (value < 0) {
        message.error(`${field} không được nhỏ hơn 0`);
        return;
      }

      if (value > MAX_REGISTRATION_FEE) {
        message.error(
          `Phí đăng ký không được vượt quá ${MAX_REGISTRATION_FEE.toLocaleString("vi-VN")} VND (10 triệu)`
        );
        return;
      }
    }

    // Validate fields with max size
    if (field === "sizeMin" || field === "sizeMax") {
      if (value > MAX_SIZE) {
        message.error(`Kích thước không được vượt quá ${MAX_SIZE} cm`);
        return;
      }
    }

    // Validate fields with max entries
    if (field === "minEntries" || field === "maxEntries") {
      if (value > MAX_ENTRIES) {
        message.error(
          `Số lượng tham gia không được vượt quá ${MAX_ENTRIES.toLocaleString("vi-VN")}`
        );
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
    const currentAwards =
      categories[categoryIndex]?.createAwardCateShowRequests || [];
    const awardToRemove = currentAwards[awardIndex];

    // Không có giải thưởng để xóa hoặc không tìm thấy giải
    if (!awardToRemove) {
      return;
    }

    // Dựa vào loại giải cần xóa, xác định những giải nào cần xóa theo
    let updatedAwards = [...currentAwards];

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

    setCategories((prevCategories) =>
      prevCategories.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              createAwardCateShowRequests: updatedAwards,
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

    // Validate max prize value
    if (field === "prizeValue" && value > MAX_PRIZE_VALUE) {
      message.error(
        `Giá trị giải thưởng không được vượt quá ${MAX_PRIZE_VALUE.toLocaleString("vi-VN")} VND (100 tỷ)`
      );
      return;
    }

    // Validate giá trị giải thưởng theo thứ tự: Nhất > Nhì > Ba > Khuyến Khích
    if (field === "prizeValue" && value) {
      const currentAward =
        categories[categoryIndex].createAwardCateShowRequests[awardIndex];
      const allAwards = categories[categoryIndex].createAwardCateShowRequests;

      // Cập nhật state lỗi
      const newAwardErrors = { ...awardErrors };
      if (!newAwardErrors[categoryIndex]) {
        newAwardErrors[categoryIndex] = {};
      }

      // Xóa lỗi cũ trước khi kiểm tra lại
      newAwardErrors[categoryIndex][awardIndex] = "";

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
          newAwardErrors[categoryIndex][awardIndex] =
            "Giải Nhất phải có giá trị cao nhất";
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
          newAwardErrors[categoryIndex][awardIndex] =
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
            newAwardErrors[categoryIndex][awardIndex] =
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
          newAwardErrors[categoryIndex][awardIndex] =
            "Giải Ba phải có giá trị nhỏ hơn Giải Nhì";
        } else {
          const hasHonorableWithHigherValue = allAwards.some(
            (award) =>
              award.awardType === "honorable" &&
              award.prizeValue &&
              Number(award.prizeValue) >= Number(value)
          );

          if (hasHonorableWithHigherValue) {
            newAwardErrors[categoryIndex][awardIndex] =
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
          newAwardErrors[categoryIndex][awardIndex] =
            "Giải Khuyến Khích phải có giá trị thấp nhất";
        }
      }

      setAwardErrors(newAwardErrors);
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

        // Lấy danh sách trọng tài hiện tại
        const currentReferees = category.createRefereeAssignmentRequests || [];

        // Tìm các trọng tài cần giữ lại (đã có trong danh sách mới)
        const keepReferees = currentReferees.filter((referee) =>
          selectedReferees.includes(referee.refereeAccountId)
        );

        // Tìm các trọng tài mới cần thêm (có trong danh sách mới nhưng chưa có trong danh sách cũ)
        const newRefereeIds = selectedReferees.filter(
          (refereeId) =>
            !currentReferees.some((ref) => ref.refereeAccountId === refereeId)
        );

        // Tạo các đối tượng trọng tài mới
        const newReferees = newRefereeIds.map((refereeId) => ({
          refereeAccountId: refereeId,
          roundTypes: [], // Mỗi trọng tài mới có danh sách vòng rỗng
        }));

        return {
          ...category,
          createRefereeAssignmentRequests: [...keepReferees, ...newReferees],
        };
      })
    );
  };

  const handleRefereeRoundChange = (
    categoryIndex,
    refereeId,
    selectedRounds
  ) => {
    // Check if the selected rounds includes "Preliminary"
    if (selectedRounds.includes("Preliminary")) {
      // Check if any other referee is already assigned to Preliminary
      const otherRefereeHasPreliminary = categories[
        categoryIndex
      ]?.createRefereeAssignmentRequests.some(
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
    // Check for max length
    if (value.length > MAX_NAME_LENGTH) {
      const newCategoryNameErrors = { ...categoryNameErrors };
      newCategoryNameErrors[index] =
        `Tên hạng mục không được vượt quá ${MAX_NAME_LENGTH} ký tự`;
      setCategoryNameErrors(newCategoryNameErrors);
      return;
    }

    // Check for duplicate names
    const isDuplicate = categories.some(
      (cat, i) =>
        i !== index &&
        cat.name?.trim() === value?.trim() &&
        value?.trim() !== ""
    );

    const newCategoryNameErrors = { ...categoryNameErrors };
    if (isDuplicate) {
      newCategoryNameErrors[index] = "Tên hạng mục không được trùng lặp";
    } else {
      newCategoryNameErrors[index] = "";
    }
    setCategoryNameErrors(newCategoryNameErrors);

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

  // Hàm làm mới danh sách tiêu chí đánh giá
  const handleRefreshCriteria = async () => {
    try {
      setCriteriaRefreshLoading(true);
      await fetchCriteria(1, 100);
      message.success("Cập nhật danh sách tiêu chí thành công!");
    } catch (error) {
      message.error("Không thể cập nhật danh sách tiêu chí!");
    } finally {
      setCriteriaRefreshLoading(false);
    }
  };

  // Render nút refresh trong dropdown của tiêu chí
  const renderDropdownWithRefreshCriteria = (menu) => {
    return (
      <div>
        {menu}
        <Divider style={{ margin: "4px 0" }} />
        <div style={{ padding: "8px", textAlign: "center" }}>
          <Tooltip title="Làm mới danh sách tiêu chí">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn đóng dropdown khi click
                handleRefreshCriteria();
              }}
              loading={criteriaRefreshLoading}
              type="text"
              style={{ width: "100%" }}
            >
              Làm mới
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  };

  // Hàm để mở dropdown tiêu chí
  const openCriteriaDropdown = (index, roundValue) => {
    const refKey = `${index}_${roundValue}`;
    if (criteriaSelectRefs.current[refKey]) {
      criteriaSelectRefs.current[refKey].focus();
    }
  };

  // Hàm làm mới danh sách trọng tài
  const handleRefreshReferees = async () => {
    try {
      setRefereeRefreshLoading(true);
      await fetchAccountTeam(1, 100);
      message.success("Cập nhật danh sách trọng tài thành công!");
    } catch (error) {
      message.error("Không thể cập nhật danh sách trọng tài!");
    } finally {
      setRefereeRefreshLoading(false);
    }
  };

  // Render nút refresh trong dropdown của trọng tài
  const renderDropdownWithRefreshReferees = (menu) => {
    return (
      <div>
        {menu}
        <Divider style={{ margin: "4px 0" }} />
        <div style={{ padding: "8px", textAlign: "center" }}>
          <Tooltip title="Làm mới danh sách trọng tài">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn đóng dropdown khi click
                handleRefreshReferees();
              }}
              loading={refereeRefreshLoading}
              type="text"
              style={{ width: "100%" }}
            >
              Làm mới
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  };

  // Helper function to get a specific round
  const getRound = (category, roundType, roundOrder) => {
    if (!category.createRoundRequests) return null;
    return category.createRoundRequests.find(
      (r) => r.roundType === roundType && r.roundOrder === roundOrder
    );
  };

  // Helper function to update a round's property
  const updateRound = (categoryIndex, roundType, roundOrder, field, value) => {
    setCategories((prev) => {
      const updatedCategories = [...prev];
      const category = updatedCategories[categoryIndex];

      if (!category || !category.createRoundRequests) {
        // Initialize rounds if they don't exist
        if (!category.createRoundRequests) {
          category.createRoundRequests = [
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
        return updatedCategories;
      }

      const roundIndex = category.createRoundRequests.findIndex(
        (r) => r.roundType === roundType && r.roundOrder === roundOrder
      );

      if (roundIndex === -1) return updatedCategories;

      // Update the specific field in the round
      category.createRoundRequests[roundIndex] = {
        ...category.createRoundRequests[roundIndex],
        [field]: value,
      };

      return updatedCategories;
    });
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
                      maxLength={MAX_NAME_LENGTH}
                    />
                    {categoryNameErrors[index] && (
                      <p className="text-red-500 text-xs mt-1">
                        {categoryNameErrors[index]}
                      </p>
                    )}
                    {showErrors && !category.name && (
                      <p className="text-red-500 text-xs mt-1">
                        Tên hạng mục là bắt buộc.{" "}
                      </p>
                    )}
                    <div className="flex-1 mt-4 ">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Chọn giống cá Koi
                        </label>
                      </div>
                      {isLoading || varietyLoading ? (
                        <Loading />
                      ) : (
                        <Select
                          ref={(el) => (varietySelectRefs.current[index] = el)}
                          mode="multiple"
                          placeholder="Chọn giống cá koi"
                          className="w-full"
                          value={category.createCompetionCategoryVarieties}
                          onChange={(values) =>
                            handleVarietyChange(index, values)
                          }
                          dropdownRender={renderDropdownWithRefreshVariety}
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
                        max={MAX_SIZE}
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
                        max={MAX_SIZE}
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
                        max={MAX_REGISTRATION_FEE}
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
                        max={MAX_ENTRIES}
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
                        max={MAX_ENTRIES}
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
                    <div className="space-y-4">
                      {/* Vòng Sơ Khảo */}
                      <div className="mb-4">
                        <div className="p-2 border rounded-md">
                          <span className="font-semibold">Vòng Sơ Khảo</span>
                        </div>
                        <Collapse className="mt-2">
                          <Panel header="Vòng 1" key="preliminary_1"></Panel>
                        </Collapse>
                      </div>

                      {/* Vòng Đánh Giá Chính */}
                      <div className="mb-4">
                        <div className="p-2 border rounded-md">
                          <span className="font-semibold">
                            Vòng Đánh Giá Chính
                          </span>
                        </div>
                        <Collapse className="mt-2">
                          <Panel header="Vòng 1" key="evaluation_1">
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Số cá qua vòng
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="Tối thiểu 1 cá"
                                  value={
                                    getRound(category, "Evaluation", 1)
                                      ?.numberOfRegistrationToAdvance || ""
                                  }
                                  onChange={(e) => {
                                    const value =
                                      e.target.value === ""
                                        ? null
                                        : parseInt(e.target.value, 10);
                                    if (e.target.value === "" || value >= 1) {
                                      // Kiểm tra số cá qua vòng không vượt quá số lượng tham gia tối đa
                                      const maxEntries = category.maxEntries;

                                      // Cập nhật state lỗi
                                      const newRoundsErrors = {
                                        ...roundsErrors,
                                      };
                                      if (!newRoundsErrors[index]) {
                                        newRoundsErrors[index] = {};
                                      }

                                      if (
                                        value &&
                                        maxEntries &&
                                        value > maxEntries
                                      ) {
                                        newRoundsErrors[index].round1 =
                                          `Số cá qua vòng (${value}) không được vượt quá số lượng tham gia tối đa (${maxEntries})`;
                                      } else {
                                        // Xóa lỗi nếu hợp lệ
                                        if (newRoundsErrors[index]) {
                                          newRoundsErrors[index].round1 = "";
                                        }
                                      }
                                      setRoundsErrors(newRoundsErrors);

                                      updateRound(
                                        index,
                                        "Evaluation",
                                        1,
                                        "numberOfRegistrationToAdvance",
                                        value
                                      );
                                    }
                                  }}
                                />
                                {roundsErrors[index]?.round1 && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {roundsErrors[index].round1}
                                  </p>
                                )}
                                {showErrors &&
                                  (!getRound(category, "Evaluation", 1)
                                    ?.numberOfRegistrationToAdvance ||
                                    getRound(category, "Evaluation", 1)
                                      ?.numberOfRegistrationToAdvance < 1) && (
                                    <p className="text-red-500 text-xs mt-1">
                                      Số cá qua vòng phải từ 1 trở lên.
                                    </p>
                                  )}
                              </div>
                            </Space>
                          </Panel>
                          <Panel header="Vòng 2" key="evaluation_2">
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Số cá qua vòng
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="Tối thiểu 1 cá"
                                  value={
                                    getRound(category, "Evaluation", 2)
                                      ?.numberOfRegistrationToAdvance || ""
                                  }
                                  onChange={(e) => {
                                    const value =
                                      e.target.value === ""
                                        ? null
                                        : parseInt(e.target.value, 10);
                                    if (e.target.value === "" || value >= 1) {
                                      // Kiểm tra số cá vòng 2 phải nhỏ hơn vòng 1
                                      const round1Value = getRound(
                                        category,
                                        "Evaluation",
                                        1
                                      )?.numberOfRegistrationToAdvance;

                                      // Cập nhật state lỗi
                                      const newRoundsErrors = {
                                        ...roundsErrors,
                                      };
                                      if (!newRoundsErrors[index]) {
                                        newRoundsErrors[index] = {};
                                      }

                                      if (
                                        value &&
                                        round1Value &&
                                        value >= round1Value
                                      ) {
                                        newRoundsErrors[index].round2 =
                                          `Số cá qua vòng ở vòng 2 (${value}) phải nhỏ hơn số cá qua vòng ở vòng 1 (${round1Value})`;
                                      } else {
                                        // Xóa lỗi nếu hợp lệ
                                        if (newRoundsErrors[index]) {
                                          newRoundsErrors[index].round2 = "";
                                        }
                                      }
                                      setRoundsErrors(newRoundsErrors);

                                      updateRound(
                                        index,
                                        "Evaluation",
                                        2,
                                        "numberOfRegistrationToAdvance",
                                        value
                                      );
                                    }
                                  }}
                                />
                                {roundsErrors[index]?.round2 && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {roundsErrors[index].round2}
                                  </p>
                                )}
                                {showErrors &&
                                  (!getRound(category, "Evaluation", 2)
                                    ?.numberOfRegistrationToAdvance ||
                                    getRound(category, "Evaluation", 2)
                                      ?.numberOfRegistrationToAdvance < 1) && (
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
                        <div className="p-2 border rounded-md">
                          <span className="font-semibold">Vòng Chung Kết</span>
                        </div>
                        <Collapse className="mt-2">
                          <Panel header="Vòng 1" key="final_1"></Panel>
                        </Collapse>
                      </div>
                    </div>
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
                                {round.value !== "Preliminary" ? (
                                  <>
                                    <Tag color="blue">
                                      {criteriaInRound.length} tiêu chí
                                    </Tag>
                                    {criteriaInRound.length > 0 && (
                                      <Tag
                                        color={getTotalWeightColor(
                                          criteriaInRound
                                        )}
                                        className="ml-2"
                                      >
                                        Tổng:{" "}
                                        {calculateTotalWeight(criteriaInRound)}%
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
                                    Vòng Sơ Khảo chỉ áp dụng hình thức chấm
                                    đạt/không đạt (Pass/Fail). Trọng tài sẽ đánh
                                    giá các cá thể có đủ điều kiện tham gia vòng
                                    tiếp theo hay không mà không sử dụng tiêu
                                    chí đánh giá chi tiết.
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center space-x-2 mb-4">
                                    <div className="flex-1">
                                      <label className="block text-sm font-medium text-gray-700">
                                        Tiêu chí đánh giá - {round.label}
                                      </label>
                                      {criteriaLoading ||
                                      criteriaRefreshLoading ? (
                                        <Loading />
                                      ) : (
                                        <Select
                                          ref={(el) =>
                                            (criteriaSelectRefs.current[
                                              `${index}_${round.value}`
                                            ] = el)
                                          }
                                          mode="multiple"
                                          placeholder="Chọn tiêu chí"
                                          className="w-full"
                                          value={criteriaInRound.map((c) => {
                                            const criteriaDetail =
                                              criteria.find(
                                                (cr) => cr.id === c.criteriaId
                                              );
                                            return (
                                              criteriaDetail?.name ||
                                              c.criteriaId
                                            );
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
                                                (c) =>
                                                  c.roundType !== round.value
                                              ) || [];

                                            // Thêm các tiêu chí mới với weight mặc định là 0
                                            const newCriteria = values.map(
                                              (criteriaName, index) => {
                                                const criteriaDetail =
                                                  criteria.find(
                                                    (cr) =>
                                                      cr.name === criteriaName
                                                  );
                                                return {
                                                  criteriaId:
                                                    criteriaDetail?.id,
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
                                          dropdownRender={
                                            renderDropdownWithRefreshCriteria
                                          }
                                        >
                                          {criteria
                                            .filter(
                                              (item) =>
                                                !criteriaInRound.some(
                                                  (c) =>
                                                    c.criteriaId === item.id
                                                )
                                            )
                                            .map((item) => (
                                              <Option
                                                key={item.id}
                                                value={item.name}
                                              >
                                                {item.name}
                                              </Option>
                                            ))}
                                        </Select>
                                      )}
                                    </div>
                                  </div>

                                  {criteriaInRound.length > 0 && (
                                    <div className="space-y-2">
                                      {criteriaInRound.map(
                                        (criteriaItem, idx) => {
                                          const criteriaDetail = criteria.find(
                                            (c) =>
                                              c.id === criteriaItem.criteriaId
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
                                                    criteriaItem.weight * 100 ||
                                                    0
                                                  }
                                                  onChange={(e) => {
                                                    const newWeight =
                                                      parseFloat(
                                                        e.target.value
                                                      ) / 100;
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
                                                        const updatedCategories =
                                                          [...prevCategories];
                                                        const category =
                                                          updatedCategories[
                                                            index
                                                          ];

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

                                                        if (
                                                          criteriaIndex !== -1
                                                        ) {
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
                                                        const updatedCategories =
                                                          [...prevCategories];
                                                        const category =
                                                          updatedCategories[
                                                            index
                                                          ];

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
                                        }
                                      )}
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
                                  max={MAX_PRIZE_VALUE}
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
                                {awardErrors[index]?.[awardIndex] && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {awardErrors[index][awardIndex]}
                                  </p>
                                )}
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
                    {refereeRefreshLoading ? (
                      <Loading />
                    ) : (
                      <Select
                        ref={(el) => (refereeSelectRefs.current[index] = el)}
                        mode="multiple"
                        placeholder="Chọn trọng tài"
                        className="w-full"
                        value={category.createRefereeAssignmentRequests.map(
                          (r) => r.refereeAccountId
                        )}
                        onChange={(values) =>
                          handleRefereeChange(index, values)
                        }
                        dropdownRender={renderDropdownWithRefreshReferees}
                      >
                        {referee.map((r) => (
                          <Option key={r.id} value={r.id}>
                            {r.fullName}
                          </Option>
                        ))}
                      </Select>
                    )}

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
        Thêm hạng mục
      </Button>
    </>
  );
}

export default StepTwo;
