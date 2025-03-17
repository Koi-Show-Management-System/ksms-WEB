import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Table, Tag, Select, Row, Col, Spin, Empty, Image, Card } from "antd";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";
import useRegistrationRound from "../../../hooks/useRegistrationRound";

const { Option } = Select;

const roundTypes = ["Preliminary", "Evaluation", "Final"];
const roundTypeLabels = {
  Preliminary: "Vòng Sơ Khảo",
  Evaluation: "Vòng Đánh Giá Chính",
  Final: "Vòng Chung Kết",
};

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

function CompetitionRound({ showId }) {
  const { categories, fetchCategories } = useCategory();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const { round, fetchRound, isLoading: roundLoading } = useRound();
  const {
    registrationRound,
    fetchRegistrationRound,
    isLoading: registrationLoading,
    totalItems: registrationTotalItems,
    currentPage,
    pageSize,
    totalPages,
  } = useRegistrationRound();

  // Sử dụng state để theo dõi trạng thái loading của hình ảnh
  const [loadingImages, setLoadingImages] = useState({});

  // Fetch categories khi component mount
  useEffect(() => {
    fetchCategories(showId);
  }, [fetchCategories, showId]);

  // Xử lý dữ liệu hiển thị với useMemo để tránh tính toán lại không cần thiết
  const displayData = useMemo(() => {
    if (
      !registrationLoading &&
      selectedSubRound &&
      registrationRound?.length > 0
    ) {
      return registrationRound.map((item, index) => ({
        ...item,
        key: item.id || `registration-${index}`,
        index: index + 1 + (currentPage - 1) * pageSize, // Tính toán số thứ tự chính xác
      }));
    }
    return [];
  }, [
    registrationRound,
    registrationLoading,
    selectedSubRound,
    currentPage,
    pageSize,
  ]);

  // Sử dụng useCallback để tránh tạo lại hàm xử lý sự kiện
  const handleCategoryChange = useCallback((value) => {
    setSelectedCategory(value);
    setSelectedRoundType(null);
    setSelectedSubRound(null);
  }, []);

  const handleRoundTypeChange = useCallback(
    (value) => {
      setSelectedRoundType(value);
      setSelectedSubRound(null);

      if (selectedCategory) {
        fetchRound(selectedCategory, value);
      }
    },
    [selectedCategory, fetchRound]
  );

  const handleSubRoundChange = useCallback(
    (value) => {
      setSelectedSubRound(value);

      if (value) {
        fetchRegistrationRound(value);
      }
    },
    [fetchRegistrationRound]
  );

  const handleTableChange = useCallback(
    (pagination) => {
      if (selectedSubRound) {
        fetchRegistrationRound(
          selectedSubRound,
          pagination.current,
          pagination.pageSize
        );
      }
    },
    [selectedSubRound, fetchRegistrationRound]
  );

  // Xử lý sự kiện khi hình ảnh bắt đầu tải
  const handleImageLoad = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  // Xử lý sự kiện khi hình ảnh bắt đầu tải
  const handleImageLoadStart = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: true }));
  }, []);

  // Xử lý sự kiện khi hình ảnh gặp lỗi
  const handleImageError = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  // Định nghĩa cột với useMemo để tránh tạo lại không cần thiết
  const columns = useMemo(
    () => [
      {
        title: "Top",
        dataIndex: "index",
        width: 60,
        render: (index) => (
          <span
            style={{ color: "blue", fontWeight: "bold" }}
          >{`#${index}`}</span>
        ),
      },
      {
        title: "Mã Đăng Ký",
        dataIndex: ["registration", "registrationNumber"],
        width: 120,
        render: (registrationNumber, record) => {
          return (
            registrationNumber ||
            record.registration?.id?.substring(0, 8) ||
            "—"
          );
        },
      },
      {
        title: "Hình ảnh",
        dataIndex: ["registration", "koiMedia"],
        width: 100,
        render: (koiMedia, record) => {
          const id = record.key;
          const imageMedia =
            koiMedia && koiMedia.length > 0
              ? koiMedia.find((media) => media.mediaType === "Image")
              : null;

          const imageUrl = imageMedia?.mediaUrl || PLACEHOLDER_IMAGE;

          return (
            <div className="w-[70px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
              <Image
                src={imageUrl}
                alt="Hình cá"
                width={70}
                height={50}
                className="object-cover"
                preview={{
                  src: imageMedia?.mediaUrl,
                  mask: <div className="text-xs">Xem</div>,
                }}
                placeholder={
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Spin size="small" />
                  </div>
                }
                fallback={PLACEHOLDER_IMAGE}
              />
            </div>
          );
        },
      },
      {
        title: "Kích thước",
        dataIndex: ["registration", "koiSize"],
        width: 100,
        render: (size) => (size ? `${size} cm` : "—"),
      },
      {
        title: "Giống",
        dataIndex: ["registration", "koiProfile", "variety", "name"],
        width: 150,
        ellipsis: true,
        render: (name) => name || "—",
      },
      {
        title: "Kết quả",
        dataIndex: "roundResults",
        width: 100,
        render: (results) => {
          if (!results || results.length === 0)
            return <Tag color="gray">Chưa có</Tag>;
          const isPassed = results.some((result) => result.isPassed);
          return (
            <Tag color={isPassed ? "green" : "red"}>
              {isPassed ? "Đạt" : "Không đạt"}
            </Tag>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 120,
        render: (status) => {
          let color = "blue";
          let text = status;

          switch (status) {
            case "unpublic":
              color = "gray";
              text = "Chưa công khai";
              break;
            case "public":
              color = "green";
              text = "Đã công khai";
              break;
            case "pending":
              color = "orange";
              text = "Đang chờ";
              break;
            case "assigned":
              color = "blue";
              text = "Đang thực hiện";
              break;
            default:
              text = status || "—";
          }

          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: "Bể",
        dataIndex: "tankName",
        width: 120,
        render: (tank) => <span>{tank || "Chưa phân bổ"}</span>,
      },
    ],
    [loadingImages, handleImageLoad, handleImageLoadStart, handleImageError]
  );

  return (
    <Card>
      <Row gutter={16} className="mb-4">
        <Col xs={24} sm={8}>
          <div>
            <div className="block text-lg font-medium mb-2">Hạng Mục:</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn hạng mục"
              onChange={handleCategoryChange}
              allowClear
              value={selectedCategory}
              loading={!categories}
              disabled={!categories || categories.length === 0}
              className="w-full"
            >
              {categories?.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div>
            <div className="block text-lg font-medium mb-2">Vòng Chính:</div>
            <Select
              value={selectedRoundType}
              onChange={handleRoundTypeChange}
              style={{ width: "100%" }}
              className="w-full"
              placeholder="Chọn vòng"
              disabled={!selectedCategory}
            >
              {roundTypes.map((type) => (
                <Option key={type} value={type}>
                  {roundTypeLabels[type] || type}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div>
            <div className="block text-lg font-medium mb-2">Vòng Phụ:</div>
            <Select
              value={selectedSubRound}
              onChange={handleSubRoundChange}
              style={{ width: "100%" }}
              className="w-full"
              placeholder={roundLoading ? "Đang tải..." : "Chọn vòng phụ"}
              disabled={
                !selectedRoundType ||
                roundLoading ||
                !round ||
                round.length === 0
              }
              loading={roundLoading}
              notFoundContent={
                roundLoading ? <Spin size="small" /> : "Không có vòng phụ"
              }
            >
              {round?.map((item) => (
                <Option
                  key={item.id || item.roundId}
                  value={item.id || item.roundId}
                >
                  {item.name || item.roundName || `Vòng ${item.id}`}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={displayData}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: registrationTotalItems,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} trong ${total} mục`,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
}

export default CompetitionRound;
