// RoundSelector.jsx
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Select, Space, Typography, Tag } from "antd";
import useCategory from "../../../../hooks/useCategory";
import useRound from "../../../../hooks/useRound";

const RoundSelector = forwardRef(
  (
    { onRoundSelect, showId, categoryId, preSelectPreliminary = false },
    ref
  ) => {
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
        // Không reset selectedCategory nếu categoryId được truyền từ props
        if (!categoryId) {
          setSelectedCategory(null);
        }
        // Thông báo cho component cha rằng không có vòng nào được chọn
        if (onRoundSelect) {
          onRoundSelect(null, "", null);
        }
      },
      // Thêm method để cập nhật category
      updateCategory: (newCategoryId) => {
        if (newCategoryId) {
          setSelectedCategory(newCategoryId);
          setSelectedRound(null);
          // Fetch rounds for the new category
          fetchRound(newCategoryId, "Preliminary", 1, 100);
          // Thông báo cho component cha rằng không có vòng nào được chọn
          if (onRoundSelect) {
            onRoundSelect(null, "", null);
          }
        }
      },
    }));

    // Sử dụng categoryId từ props nếu có
    useEffect(() => {
      if (categoryId) {
        setSelectedCategory(categoryId);
        // Luôn fetch tất cả vòng sơ khảo (pageSize=100 để lấy tất cả)
        fetchRound(categoryId, "Preliminary", 1, 100);
      } else if (showId) {
        // Chỉ fetch categories nếu không có categoryId được truyền vào
        fetchCategories(showId);
      }
    }, [showId, categoryId, fetchRound, fetchCategories]);

    // Tự động chọn vòng đầu tiên khi có danh sách round
    useEffect(() => {
      if (round.length > 0 && !selectedRound) {
        // Lọc chỉ lấy các vòng có roundOrder = 1
        const firstRounds = round.filter((r) => r.roundOrder === 1);

        if (firstRounds.length > 0) {
          const firstRound = firstRounds[0];
          setSelectedRound(firstRound.id);

          if (onRoundSelect) {
            onRoundSelect(firstRound.id, firstRound.name, selectedCategory);
          }
        }
      }
    }, [round, selectedRound, onRoundSelect, selectedCategory]);

    const handleCategoryChange = (categoryId) => {
      setSelectedCategory(categoryId);
      setSelectedRound(null);

      // Luôn fetch tất cả vòng sơ khảo khi thay đổi category (pageSize=100 để lấy tất cả)
      fetchRound(categoryId, "Preliminary", 1, 100);
    };

    const handleSpecificRoundSelect = (roundId) => {
      setSelectedRound(roundId);

      // Tìm tên của vòng được chọn
      const selectedRoundObj = round.find((r) => r.id === roundId);
      const roundName = selectedRoundObj ? selectedRoundObj.name : "";

      if (onRoundSelect) {
        onRoundSelect(roundId, roundName, selectedCategory);
      }
    };

    // Lấy tên hạng mục hiện tại từ danh sách categories
    const selectedCategoryName =
      categories.find((c) => c.id === selectedCategory)?.name || "";

    // Lọc các vòng có roundOrder = 1
    const filteredRounds = round.filter((r) => r.roundOrder === 1);

    return (
      <Space
        direction="vertical"
        size="small"
        className="mb-4"
        style={{ width: "100%" }}
      >
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
            <Space direction="horizontal" size="middle">
              <Typography.Text strong>Hạng mục:</Typography.Text>
              <Tag color="blue" style={{ fontSize: "14px" }}>
                {selectedCategoryName}
              </Tag>
              <Typography.Text strong>Vòng sơ khảo:</Typography.Text>
              <Select
                placeholder="Chọn vòng cụ thể"
                style={{ width: 200 }}
                onChange={handleSpecificRoundSelect}
                value={selectedRound}
                loading={roundLoading}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {filteredRounds.map((r) => (
                  <Select.Option key={r.id} value={r.id}>
                    {r.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </>
        )}
      </Space>
    );
  }
);
export default RoundSelector;
