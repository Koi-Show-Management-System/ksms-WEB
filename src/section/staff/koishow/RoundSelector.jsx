// RoundSelector.jsx
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Select, Space, Typography } from "antd";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";

const RoundSelector = forwardRef(
  ({ onRoundSelect, showId, categoryId, preSelectPreliminary = false }, ref) => {
    const {
      categories,
      fetchCategories,
      isLoading: categoryLoading,
    } = useCategory();
    const { round, fetchRound, isLoading: roundLoading } = useRound();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
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
        // Luôn fetch vòng sơ khảo
        fetchRound(categoryId, "Preliminary");
      } else if (showId) {
        // Chỉ fetch categories nếu không có categoryId được truyền vào
        fetchCategories(showId);
      }
    }, [showId, categoryId]);

    // Tự động chọn vòng đầu tiên khi có danh sách round
    useEffect(() => {
      if (round.length > 0 && !selectedRound) {
        const firstRound = round[0];
        setSelectedRound(firstRound.id);
        
        if (onRoundSelect) {
          onRoundSelect(firstRound.id, firstRound.name);
        }
      }
    }, [round, selectedRound, onRoundSelect]);

    const handleCategoryChange = (categoryId) => {
      setSelectedCategory(categoryId);
      setSelectedRound(null);
      
      // Luôn fetch vòng sơ khảo khi thay đổi category
      fetchRound(categoryId, "Preliminary");
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
          <>
            <Typography.Text strong>Vòng sơ khảo</Typography.Text>
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
          </>
        )}
      </Space>
    );
  }
);
export default RoundSelector;
