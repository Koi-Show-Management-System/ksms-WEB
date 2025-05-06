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

    useImperativeHandle(ref, () => ({
      reset: () => {
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
          // Fetch rounds for the new category to get first round info
          fetchRound(newCategoryId, "Preliminary", 1, 100);
          // Thông báo cho component cha
          if (onRoundSelect) {
            onRoundSelect(null, "", newCategoryId);
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

    // Tự động thông báo cho component cha khi có danh sách round
    useEffect(() => {
      if (round.length > 0 && selectedCategory) {
        // Lọc chỉ lấy các vòng có roundOrder = 1
        const firstRounds = round.filter((r) => r.roundOrder === 1);

        if (firstRounds.length > 0) {
          const firstRound = firstRounds[0];
          if (onRoundSelect) {
            // Chỉ truyền thông tin mà không cần chọn vòng cụ thể
            onRoundSelect(firstRound.id, firstRound.name, selectedCategory);
          }
        }
      }
    }, [round, onRoundSelect, selectedCategory]);

    const handleCategoryChange = (categoryId) => {
      setSelectedCategory(categoryId);

      // Luôn fetch tất cả vòng sơ khảo khi thay đổi category (pageSize=100 để lấy tất cả)
      fetchRound(categoryId, "Preliminary", 1, 100);
    };

    // Lấy tên hạng mục hiện tại từ danh sách categories
    const selectedCategoryName =
      categories.find((c) => c.id === selectedCategory)?.name || "";

    // Lọc các vòng có roundOrder = 1 để hiển thị thông tin
    const firstRound = round.find((r) => r.roundOrder === 1);

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
              {firstRound && (
                <>
                  <Typography.Text strong>Vòng đầu tiên:</Typography.Text>
                  <Tag color="green" style={{ fontSize: "14px" }}>
                    {firstRound.name}
                  </Tag>
                </>
              )}
            </Space>
          </>
        )}
      </Space>
    );
  }
);
export default RoundSelector;
