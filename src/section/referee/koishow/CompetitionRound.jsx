import React, { useState, useEffect } from "react";
import { Table, Tag, Space, Select, Row, Col, Button, Image, Spin } from "antd";
import { EyeOutlined } from "@ant-design/icons";
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

  const columns = [
    {
      title: "Top",
      dataIndex: "index",
      width: 60,
      render: (index) => (
        <span style={{ color: "blue", fontWeight: "bold" }}>{`#${index}`}</span>
      ),
    },
    {
      title: "Mã Đăng Ký",
      dataIndex: "registrationNumber",
      render: (registrationNumber, record) =>
        registrationNumber || record.registrationId?.substring(0, 8) || "—",
    },
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      width: 100,
      render: (imageUrl, record) => {
        const id = record.key;
        return (
          <div className="w-[70px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
            <Image
              src={imageUrl || PLACEHOLDER_IMAGE}
              alt="Hình cá"
              width={70}
              height={50}
              className="object-cover"
              preview={{
                src: imageUrl,
                mask: <div className="text-xs">Xem</div>,
              }}
              placeholder={
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Spin size="small" />
                </div>
              }
              fallback={PLACEHOLDER_IMAGE}
              onLoad={() => handleImageLoad(id)}
              onError={() => handleImageError(id)}
            />
          </div>
        );
      },
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      render: (size) => (size ? `${size} cm` : "—"),
    },
    {
      title: "Giống",
      dataIndex: "variety",
      ellipsis: true,
      render: (variety) => variety || "—",
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      render: (result) => {
        if (result === "pass") return <Tag color="green">Đạt</Tag>;
        if (result === "fail") return <Tag color="red">Không đạt</Tag>;
        return <Tag color="orange">Chưa có</Tag>;
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
      dataIndex: "tank",
      render: (tank) => tank || "Chưa gán bể",
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          className="text-gray-500 hover:text-blue-500"
        />
      ),
    },
  ];

  // Transform the data for the table
  const tableData = Array.isArray(registrationRound)
    ? registrationRound.map((item, index) => {
        // Get first image if available
        const imageMedia = item.registration?.koiMedia?.find(
          (media) => media.mediaType === "Image"
        );

        // Determine result based on roundResults
        let result = "pending";
        if (item.roundResults && item.roundResults.length > 0) {
          result = item.roundResults.some((r) => r.isPassed) ? "pass" : "fail";
        }

        return {
          key: item.id || `item-${index}`,
          index: index + 1 + (currentPage - 1) * pageSize,
          registrationId: item.registration?.id,
          registrationNumber: item.registration?.registrationNumber,
          imageUrl: imageMedia?.mediaUrl || PLACEHOLDER_IMAGE,
          size: item.registration?.koiSize,
          variety: item.registration?.koiProfile?.variety?.name,
          result: result,
          status: item.status,
          tank: item.tankName,
          // Store the full record for reference
          fullRecord: item,
        };
      })
    : [];

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
        columns={columns}
        dataSource={tableData}
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
