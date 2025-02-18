import React, { useState } from "react";
import { Form, Input, Select } from "antd";
const { Option } = Select;

function StepTwo() {
  // States
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [criteriaPercentages, setCriteriaPercentages] = useState({});
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [subRounds, setSubRounds] = useState([]);

  // Constants
  const criteriaOptions = [
    { value: "color", label: "Color" },
    { value: "bodyShape", label: "Body Shape" },
    { value: "pattern", label: "Pattern" },
    { value: "size", label: "Size" },
    { value: "quality", label: "Quality" },
    { value: "health", label: "Health" },
    { value: "swimming", label: "Swimming" },
    { value: "markings", label: "Markings" },
    { value: "balance", label: "Balance" },
    { value: "elegance", label: "Elegance" },
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-6">
        Step 2: Competition Categories & Judging Criteria
      </h2>

      {/* Category Information */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name
        </label>
        <Input placeholder="Enter category name" />
      </div>

      {/* Size Information */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Size
        </label>
        <Input placeholder="Enter size" />
      </div>

      {/* Variety Information */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Variety
        </label>
        <Input placeholder="Enter Variety" />
      </div>

      {/* Round Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Main Round
        </label>
        <Select placeholder="Select main round" className="w-full">
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
          Round
        </label>
        <Select
          mode="tags"
          style={{ width: "100%" }}
          placeholder="Enter round number (e.g. Round 1)"
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
          Criteria Selection (Select up to 3)
        </label>
        <Select
          mode="multiple"
          placeholder="Select criteria"
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
            Criteria Percentages
          </label>
          <div className="space-y-2">
            {selectedCriteria.map((criteria) => (
              <div key={criteria} className="mb-2">
                <label className="block text-sm text-gray-600 mb-1">
                  {criteriaOptions.find((opt) => opt.value === criteria)?.label}
                  {` (Remaining: ${getRemainingPercentage()}%)`}
                </label>
                <Input
                  suffix="%"
                  placeholder="Enter percentage"
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
              Total: {totalPercentage}%
              {!isValidTotal() && (
                <span className="text-red-500 ml-2">(Must equal 100%)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Number of Koi */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Koi
        </label>
        <Input placeholder="Enter number of koi" type="number" />
      </div>

      {/* Awards */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Awards
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Enter awards" />
          <Input placeholder="Prize" />
        </div>
      </div>

      {/* Referee Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Referee
        </label>
        <Select
          mode="multiple"
          placeholder="Select referees"
          className="w-full"
        >
          <Option value="referee1">Mary Johnson</Option>
          <Option value="referee2">James Smith</Option>
        </Select>
      </div>
    </div>
  );
}

export default StepTwo;
