import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Space, Select, Row, Col, Button, Image, Spin } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";
import useRegistrationRound from "../../../hooks/useRegistrationRound";

const { Option } = Select;

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = "https://placehold.co/70x50/eee/ccc?text=No+Image";

function CompetitionRound({ showId }) {
  const [categoryId, setCategoryId] = useState(null);
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [subRounds, setSubRounds] = useState([]);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});
  const roundTypeLabels = {
    Preliminary: "Vòng Sơ Khảo",
    Evaluation: "Vòng Đánh Giá Chính",
    Final: "Vòng Chung Kết",
  };

  const {
    categories,
    fetchCategories,
    isLoading: categoryLoading,
  } = useCategory();
  const {
    round,
    refereeRoundTypes,
    fetchRound,
    fetchRoundByReferee,
    isLoading: roundLoading,
  } = useRound();

  const {
    fetchRegistrationRound,
    registrationRound,
    isLoading: registrationLoading,
    currentPage,
    pageSize,
    totalItems,
  } = useRegistrationRound();

  // Fetch categories when component mounts or showId changes
  useEffect(() => {
    if (showId) {
      fetchCategories(showId);
    }
  }, [showId, fetchCategories]);

  // When category changes, fetch round types for referee
  useEffect(() => {
    if (categoryId) {
      fetchRoundByReferee(categoryId);
      setSelectedRoundType(null); // Reset selected round type
      setSubRounds([]); // Reset sub rounds
      setSelectedSubRound(null); // Reset selected sub round
    }
  }, [categoryId, fetchRoundByReferee]);

  // When round type is selected, fetch sub-rounds
  useEffect(() => {
    if (categoryId && selectedRoundType) {
      // Fetch sub-rounds for the selected round type
      fetchRound(categoryId, selectedRoundType);
      setSelectedSubRound(null); // Reset selected sub round when round type changes
    }
  }, [categoryId, selectedRoundType, fetchRound]);

  // Process sub-rounds from the fetched data
  useEffect(() => {
    if (round && round.length > 0) {
      // Extract unique sub-rounds from the response
      const uniqueSubRounds = round.map((item) => ({
        id: item.id,
        name: item.name,
        roundOrder: item.roundOrder,
      }));
      setSubRounds(uniqueSubRounds);
    } else {
      setSubRounds([]);
    }
  }, [round]);

  // Fetch registration data when a sub-round is selected
  useEffect(() => {
    if (selectedSubRound) {
      fetchRegistrationRound(selectedSubRound, 1, 10);
    }
  }, [selectedSubRound, fetchRegistrationRound]);

  // Image handling functions
  const handleImageLoad = (id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  };

  const handleImageLoadStart = (id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    setSelectedRoundType(null);
    setSelectedSubRound(null);
    setSubRounds([]);
  };

  const handleRoundTypeChange = (value) => {
    setSelectedRoundType(value);
    setSelectedSubRound(null);
    setSubRounds([]);
  };

  const handleSubRoundChange = (value) => {
    setSelectedSubRound(value);
  };

  const handleTableChange = (pagination) => {
    if (selectedSubRound) {
      fetchRegistrationRound(
        selectedSubRound,
        pagination.current,
        pagination.pageSize
      );
    }
  };

  const handleReloadTable = () => {
    if (selectedSubRound) {
      fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
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
        render: (size) => (size ? `${size} cm` : "—"),
      },
      {
        title: "Giống",
        dataIndex: ["registration", "koiProfile", "variety", "name"],
        ellipsis: true,
        render: (name) => name || "—",
      },
      {
        title: "Kết quả",
        dataIndex: "roundResults",
        render: (results) => {
          if (!results || results.length === 0)
            return <Tag color="gray">Chưa có</Tag>;

          // Get the status from the roundResult field
          const status = results[0]?.status;

          if (status === "Pass") {
            return <Tag color="green">Đạt</Tag>;
          } else if (status === "Fail") {
            return <Tag color="red">Không đạt</Tag>;
          } else {
            return <Tag color="orange">{status || "Đang chờ"}</Tag>;
          }
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
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
    ];

    return baseColumns;
  }, [categories]);

  const displayData = useMemo(() => {
    if (
      !registrationLoading &&
      selectedSubRound &&
      Array.isArray(registrationRound)
    ) {
      return registrationRound.map((item, index) => ({
        ...item,
        key: item.id || `registration-${index}`,
        index: index + 1 + (currentPage - 1) * pageSize,
      }));
    }
    return [];
  }, [
    registrationRound,
    currentPage,
    pageSize,
    registrationLoading,
    selectedSubRound,
  ]);
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <div className="mb-4">
            <span className="block text-lg font-medium">Hạng Mục:</span>
            <Select
              value={categoryId}
              onChange={handleCategoryChange}
              allowClear
              style={{ width: "100%" }}
              className="border rounded-md"
              loading={categoryLoading}
              placeholder="Chọn danh mục"
            >
              {categories &&
                categories.map((category) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
            </Select>
          </div>
        </Col>

        {categoryId && (
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <span className="block text-lg font-medium">Vòng Chính:</span>
              <Select
                value={selectedRoundType}
                onChange={handleRoundTypeChange}
                style={{ width: "100%" }}
                className="border rounded-md"
                loading={roundLoading}
                placeholder="Chọn vòng thi"
              >
                {refereeRoundTypes &&
                  refereeRoundTypes.map((roundType) => (
                    <Option key={roundType} value={roundType}>
                      {roundTypeLabels[roundType] || roundType}
                    </Option>
                  ))}
              </Select>
            </div>
          </Col>
        )}

        {selectedRoundType && (
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <span className="block text-lg font-medium">Vòng Phụ:</span>
              <Select
                value={selectedSubRound}
                onChange={handleSubRoundChange}
                style={{ width: "100%" }}
                className="border rounded-md"
                placeholder="Chọn vòng nhỏ"
              >
                {subRounds.map((subRound) => (
                  <Option key={subRound.id} value={subRound.id}>
                    {subRound.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        )}
      </Row>

      <Table
        // title={() => (
        //   <div className="flex justify-between items-center">
        //     <ReloadOutlined
        //       onClick={handleReloadTable}
        //       loading={registrationLoading}
        //     />
        //   </div>
        // )}
        columns={columns}
        dataSource={displayData}
        loading={registrationLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
        }}
        onChange={handleTableChange}
        className="mt-4"
      />
    </div>
  );
}

export default CompetitionRound;
