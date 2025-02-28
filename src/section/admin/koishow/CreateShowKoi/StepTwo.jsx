import React, { useEffect, useState } from "react";
import { Button, Card, Collapse, Form, Input, Select, Space, Spin } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import useVariety from "../../../../hooks/useVariety";
import useAccountTeam from "../../../../hooks/useAccountTeam";

const { Option } = Select;
const { Panel } = Collapse;

function StepTwo({ updateFormData, initialData }) {
  // States
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [criteriaPercentages, setCriteriaPercentages] = useState({});
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [subRounds, setSubRounds] = useState([]);
  const { variety, fetchVariety, isLoading } = useVariety();
  const [selectedRoundType, setSelectedRoundType] = useState("");
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const referee = accountManage.referees || [];
  const adminId =
    accountManage.admin.length > 0 ? accountManage.admin[0].id : null;
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
    { value: "Vòng Sơ Khảo", label: "Vòng Sơ Khảo" },
    { value: "Vòng Đánh Giá Chính", label: "Vòng Đánh Giá Chính" },
    { value: "Vòng Chung Kết", label: "Vòng Chung Kết" },
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

  const handleRoundTypeChange = (value) => {
    setSelectedRoundType(value); // Chỉ lưu vào state, không lưu vào JSON
  };

  const handleAddRound = () => {
    if (!categories[0]?.rounds) {
      setCategories([{ ...categories[0], rounds: [] }]); // Khởi tạo rounds nếu chưa có
    }

    const roundsLength = categories[0]?.rounds?.length ?? 0; // Đảm bảo không lỗi

    const newRound = {
      name: `Round ${roundsLength + 1}`,
      roundOrder: roundsLength + 1,
      roundType: selectedRoundType, // Gán từ state `selectedRoundType`
      startTime: "2025-02-25T17:12:33.567Z",
      endTime: "2025-03-25T17:12:33.567Z",
      minScoreToAdvance: 80,
      status: "Ongoing",
    };

    setCategories([
      {
        ...categories[0],
        rounds: [...(categories[0]?.rounds ?? []), newRound],
      },
    ]);
  };

  const handleRoundChange = (index, field, value) => {
    const updatedRounds = [...categories[0].rounds];
    updatedRounds[index][field] = value;
    setCategories([{ ...categories[0], rounds: updatedRounds }]);
  };

  const handleRemoveRound = (index) => {
    const updatedRounds = categories[0].rounds.filter((_, i) => i !== index);
    setCategories([{ ...categories[0], rounds: updatedRounds }]);
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
    initialData?.createCategorieShowRequests?.length > 0
      ? initialData.createCategorieShowRequests
      : [
          {
            name: "",
            sizeMin: "",
            sizeMax: "",
            description: "",
            awards: [],
            categoryVarietys: [],
            rounds: [],
            refereeAssignments: [],
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

  const handleCategoryNameChange = (e) => {
    setCategories([{ name: e.target.value }]);
  };
  const handleCategoryChange = (field, value) => {
    setCategories([{ ...categories[0], [field]: value }]);
  };
  const handleAddAward = () => {
    setCategories([
      {
        ...categories[0],
        awards: [
          ...(categories[0]?.awards || []),
          { name: "", awardType: "", prizeValue: "", description: "" },
        ],
      },
    ]);
  };

  const handleAwardChange = (index, field, value) => {
    const updatedAwards = [...categories[0].awards];
    updatedAwards[index][field] = value;
    setCategories([{ ...categories[0], awards: updatedAwards }]);
  };

  const handleRemoveAward = (index) => {
    const updatedAwards = categories[0].awards.filter((_, i) => i !== index);
    setCategories([{ ...categories[0], awards: updatedAwards }]);
  };

  const handleVarietyChange = (varietyId) => {
    const selectedVariety = variety.find((item) => item.id === varietyId);

    if (selectedVariety) {
      setCategories([
        {
          ...categories[0],
          categoryVarietys: [
            {
              varietyId: selectedVariety.id,
              variety: {
                name: selectedVariety.name,
                description: selectedVariety.description || "",
              },
            },
          ],
        },
      ]);
    }
  };

  const handleRefereeChange = (selectedReferees) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories];

      const newAssignments = selectedReferees.map((refereeId) => {
        const existingAssignment = updatedCategories[0].refereeAssignments.find(
          (assignment) => assignment.refereeAccountId === refereeId
        );

        return existingAssignment
          ? existingAssignment
          : {
              refereeAccountId: refereeId,
              assignedAt: new Date().toISOString(),
              roundType: [], // Bây giờ trọng tài có thể chọn nhiều vòng
              assignedBy: adminId,
            };
      });

      updatedCategories[0].refereeAssignments = newAssignments;
      return updatedCategories;
    });
  };

  const handleRefereeRoundChange = (refereeId, selectedRounds) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories];
      const assignments = updatedCategories[0].refereeAssignments.map(
        (assignment) =>
          assignment.refereeAccountId === refereeId
            ? { ...assignment, roundType: selectedRounds }
            : assignment
      );

      updatedCategories[0].refereeAssignments = assignments;
      return updatedCategories;
    });
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

      {/* Select giống cá Koi */}
      <div className="mb-4">
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
              categories[0]?.categoryVarietys?.length > 0
                ? categories[0].categoryVarietys[0].varietyId
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

      <div className="mb-4">
        <h3 className="text-sn font-semibold">Chọn vòng chính</h3>
        <Select
          placeholder="Chọn vòng chính"
          className="w-full"
          value={selectedRoundType} // Hiển thị giá trị đã chọn
          onChange={handleRoundTypeChange}
        >
          {mainRounds.map((round) => (
            <Option key={round.value} value={round.value}>
              {round.label}
            </Option>
          ))}
        </Select>
      </div>

      {/* Danh sách vòng nhỏ */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Danh sách vòng nhỏ</h3>
        <Button onClick={handleAddRound} icon={<PlusOutlined />}>
          Thêm Vòng Nhỏ
        </Button>

        <Collapse className="mt-4">
          {(categories[0]?.rounds ?? []).map((round, index) => (
            <Panel
              header={`${round.name} - ${round.roundType}`}
              key={index}
              extra={
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveRound(index);
                  }}
                >
                  Xóa
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tên vòng
                  </label>
                  <Input
                    placeholder="Nhập tên vòng"
                    value={round.name}
                    onChange={(e) =>
                      handleRoundChange(index, "name", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Thứ tự vòng
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập thứ tự vòng"
                    value={round.roundOrder}
                    onChange={(e) =>
                      handleRoundChange(index, "roundOrder", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Điểm tối thiểu để qua vòng
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập điểm tối thiểu"
                    value={round.minScoreToAdvance}
                    onChange={(e) =>
                      handleRoundChange(
                        index,
                        "minScoreToAdvance",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <Select
                    value={round.status}
                    onChange={(value) =>
                      handleRoundChange(index, "status", value)
                    }
                    className="w-full"
                  >
                    <Option value="Ongoing">Đang diễn ra</Option>
                    <Option value="Completed">Hoàn thành</Option>
                    <Option value="Pending">Chờ bắt đầu</Option>
                  </Select>
                </div>
              </Space>
            </Panel>
          ))}
        </Collapse>
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

      {/* Giải thưởng */}
      <h3 className="text-lg font-semibold mt-6">Giải thưởng</h3>
      <Button onClick={handleAddAward} icon={<PlusOutlined />}>
        Thêm Giải Thưởng
      </Button>

      <Collapse className="mt-4">
        {Array.isArray(categories[0]?.awards) &&
          categories[0].awards.map((award, index) => (
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
                      handleAwardChange(index, "name", e.target.value)
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
                      handleAwardChange(index, "awardType", e.target.value)
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
                      handleAwardChange(index, "prizeValue", e.target.value)
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
                      handleAwardChange(index, "description", e.target.value)
                    }
                  />
                </div>
              </Space>
            </Panel>
          ))}
      </Collapse>

      {/* Chọn trọng tài */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Chọn trọng tài</h3>
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
        {categories[0]?.refereeAssignments?.map((assignment, index) => (
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
                    categories[0].refereeAssignments.filter(
                      (_, i) => i !== index
                    );
                  setCategories([
                    {
                      ...categories[0],
                      refereeAssignments: updatedAssignments,
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
                    referee.find((r) => r.id === assignment.refereeAccountId)
                      ?.fullName || "Không xác định"
                  }
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Thời gian phân công
                </label>
                <Input
                  value={new Date(assignment.assignedAt).toLocaleString()}
                  disabled
                />
              </div>

              <div>
                <label>Chọn vòng chính</label>
                <Select
                  mode="multiple"
                  placeholder="Chọn vòng chính"
                  className="w-full"
                  value={assignment.roundType || []}
                  onChange={(value) =>
                    handleRefereeRoundChange(assignment.refereeAccountId, value)
                  }
                >
                  {mainRounds.map((round) => (
                    <Option key={round.value} value={round.value}>
                      {round.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
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
              </div>
            </Space>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
}

export default StepTwo;
