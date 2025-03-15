// RoundSelector.jsx
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Select, Space } from "antd";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";

const RoundSelector = forwardRef(
  ({ onRoundSelect, showId, categoryId }, ref) => {
    const {
      categories,
      fetchCategories,
      isLoading: categoryLoading,
    } = useCategory();
    const { round, fetchRound, isLoading: roundLoading } = useRound();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedRoundType, setSelectedRoundType] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        setSelectedRoundType(null);
        setSelectedRound(null);
        if (!categoryId) {
          setSelectedCategory(null);
        }
        // Thông báo cho component cha rằng không có vòng nào được chọn
        if (onRoundSelect) {
          onRoundSelect(null, "");
        }
      },
    }));

    // Sử dụng categoryId từ props nếu có
    useEffect(() => {
      if (categoryId) {
        setSelectedCategory(categoryId);
      } else if (showId) {
        // Chỉ fetch categories nếu không có categoryId được truyền vào
        fetchCategories(showId);
      }
    }, [showId, categoryId]);

    const handleCategoryChange = (categoryId) => {
      setSelectedCategory(categoryId);
      setSelectedRoundType(null);
      setSelectedRound(null);
    };

    const handleRoundTypeChange = (roundType) => {
      setSelectedRoundType(roundType);
      setSelectedRound(null);

      // Chỉ fetch round khi đã có cả category và roundType
      if (selectedCategory && roundType) {
        fetchRound(selectedCategory, roundType);
      }
    };

    const handleSpecificRoundSelect = (roundId) => {
      setSelectedRound(roundId);

      // Tìm tên của vòng được chọn
      const selectedRoundObj = round.find((r) => r.id === roundId);
      const roundName = selectedRoundObj ? selectedRoundObj.name : "";

      if (onRoundSelect) {
        onRoundSelect(roundId, roundName);
      }
    };

    const roundTypeMapping = {
      Preliminary: "Vòng sơ khảo",
      Evaluation: "Vòng đánh giá chính",
      Final: "Vòng chung kết",
    };

    const roundTypes = Object.keys(roundTypeMapping);

    return (
      <Space direction="horizontal" size="middle" className="mb-4">
        {!categoryId && (
          <Select
            placeholder="Chọn hạng mục"
            style={{ width: 200 }}
            onChange={handleCategoryChange}
            value={selectedCategory}
            loading={categoryLoading}
          >
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        )}

        {selectedCategory && (
          <Select
            placeholder="Chọn loại vòng"
            style={{ width: 200 }}
            onChange={handleRoundTypeChange}
            value={selectedRoundType}
          >
            {roundTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {roundTypeMapping[type]}
              </Select.Option>
            ))}
          </Select>
        )}

        {selectedCategory && selectedRoundType && round.length > 0 && (
          <Select
            placeholder="Chọn vòng cụ thể"
            style={{ width: 200 }}
            onChange={handleSpecificRoundSelect}
            value={selectedRound}
            loading={roundLoading}
          >
            {round.map((r) => (
              <Select.Option key={r.id} value={r.id}>
                {r.name}
              </Select.Option>
            ))}
          </Select>
        )}
      </Space>
    );
  }
);
export default RoundSelector;
