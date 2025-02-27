import React, { useEffect, useState } from "react";
import { Form, Input, Select } from "antd";
const { Option } = Select;

function StepTwo({ updateFormData, initialData }) {
  // States
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [criteriaPercentages, setCriteriaPercentages] = useState({});
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [subRounds, setSubRounds] = useState([]);

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

  const mainRounds = [
    { value: "preliminary", label: "Vòng Sơ Khảo" },
    { value: "evaluation", label: "Vòng Đánh Giá Chính" },
    { value: "final", label: "Vòng Chung Kết" },
  ];

  // Handlers
  const handleCriteriaChange = (values) => {
    if (values.length <= 3) {
      setSelectedCriteria(values);
      const newPercentages = {};
      values.forEach((criteria) => {
        if (criteriaPercentages[criteria]) {
          newPercentages[criteria] = criteriaPercentages[criteria];
        }
      });
      setCriteriaPercentages(newPercentages);
    }
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
  const [categories, setCategories] = useState(
    initialData.createCategorieShowRequests || [
      { name: "", sizeMin: "", sizeMax: "", description: "" },
    ]
  );

  // Khi state categories thay đổi, cập nhật formData
  useEffect(() => {
    updateFormData({ createCategorieShowRequests: categories });
  }, [categories]);

  const handleCategoryNameChange = (e) => {
    setCategories([{ name: e.target.value }]); // Cập nhật name vào createCategorieShowRequests
  };
  const handleCategoryChange = (field, value) => {
    setCategories([{ ...categories[0], [field]: value }]); // Cập nhật field cụ thể
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-6">
        Bước 2: Các Thể Loại và Tiêu Chí Đánh Giá
      </h2>

      {/* Tên thể loại */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên thể loại
        </label>
        <Input
          placeholder="Nhập tên thể loại"
          value={categories.length > 0 ? categories[0].name : ""}
          onChange={handleCategoryNameChange}
        />
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
            onChange={(e) => handleCategoryChange("sizeMin", e.target.value)}
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
            onChange={(e) => handleCategoryChange("sizeMax", e.target.value)}
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

      {/* Variety Information */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Giống
        </label>
        <Input placeholder="Nhập giống" />
      </div>

      {/* Round Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vòng chính
        </label>
        <Select placeholder="Chọn vòng chính" className="w-full">
          {mainRounds.map((round) => (
            <Option key={round.value} value={round.value}>
              {round.label}
            </Option>
          ))}
        </Select>
      </div>

      {/* Sub Rounds */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vòng phụ
        </label>
        <Select
          mode="tags"
          style={{ width: "100%" }}
          placeholder="Nhập số vòng (vd: Vòng 1)"
          value={subRounds}
          onChange={setSubRounds}
          dropdownStyle={{ display: "none" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const value = e.target.value;
              if (value && !subRounds.includes(value)) {
                setSubRounds([...subRounds, value]);
              }
            }
          }}
        />
      </div>

      {/* Criteria Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lựa chọn tiêu chí (Chọn tối đa 3)
        </label>
        <Select
          mode="multiple"
          placeholder="Chọn tiêu chí"
          value={selectedCriteria}
          onChange={handleCriteriaChange}
          maxTagCount={3}
          className="w-full"
        >
          {criteriaOptions.map((criteria) => (
            <Option
              key={criteria.value}
              value={criteria.value}
              disabled={
                selectedCriteria.length >= 3 &&
                !selectedCriteria.includes(criteria.value)
              }
            >
              {criteria.label}
            </Option>
          ))}
        </Select>
      </div>

      {/* Criteria Percentages */}
      {selectedCriteria.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tỉ lệ phần trăm tiêu chí
          </label>
          <div className="space-y-2">
            {selectedCriteria.map((criteria) => (
              <div key={criteria} className="mb-2">
                <label className="block text-sm text-gray-600 mb-1">
                  {criteriaOptions.find((opt) => opt.value === criteria)?.label}
                  {` (Còn lại: ${getRemainingPercentage()}%)`}
                </label>
                <Input
                  suffix="%"
                  placeholder="Nhập tỉ lệ phần trăm"
                  value={criteriaPercentages[criteria]}
                  onChange={(e) =>
                    handlePercentageChange(criteria, e.target.value)
                  }
                  type="number"
                  className={isValidTotal() ? "" : "border-red-500"}
                />
              </div>
            ))}
            <div className="text-right text-sm">
              Tổng cộng: {totalPercentage}%
              {!isValidTotal() && (
                <span className="text-red-500 ml-2">(Phải bằng 100%)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Number of Koi */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số lượng Koi
        </label>
        <Input placeholder="Nhập số lượng koi" type="number" />
      </div>

      {/* Awards */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Giải thưởng
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Nhập giải thưởng" />
          <Input placeholder="Giải thưởng tiền tệ" />
        </div>
      </div>

      {/* Referee Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trọng tài
        </label>
        <Select mode="multiple" placeholder="Chọn trọng tài" className="w-full">
          <Option value="referee1">Mary Johnson</Option>
          <Option value="referee2">James Smith</Option>
        </Select>
      </div>
    </div>
  );
}

export default StepTwo;
