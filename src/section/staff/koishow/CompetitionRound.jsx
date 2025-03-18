import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Table,
  Tag,
  Select,
  Row,
  Col,
  Spin,
  Empty,
  Image,
  Card,
  notification,
} from "antd";
import useCategory from "../../../hooks/useCategory";
import useRound from "../../../hooks/useRound";
import useRegistrationRound from "../../../hooks/useRegistrationRound";
import useTank from "../../../hooks/useTank";

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
  // Tracking mount state to prevent updates after unmount
  const isMounted = useRef(true);
  
  // Category state
  const { categories, fetchCategories } = useCategory();
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Round state
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [selectedSubRound, setSelectedSubRound] = useState(null);
  const { round, fetchRound, isLoading: roundLoading } = useRound();
  
  // Registration and tank states
  const {
    registrationRound,
    fetchRegistrationRound: originalFetchRegistrationRound, 
    updateFishTankInRound: originalUpdateFishTankInRound,
    isLoading: registrationLoading,
    totalItems: registrationTotalItems,
    currentPage,
    pageSize,
    totalPages,
  } = useRegistrationRound();
  
  const { tanks, fetchTanks } = useTank();
  const [loadingImages, setLoadingImages] = useState({});
  const [assigningTank, setAssigningTank] = useState({});
  
  // Safe API wrappers to prevent undefined calls
  const fetchRegistrationRound = useCallback((roundId, page, size) => {
    if (!isMounted.current) return Promise.resolve(null);
    
    if (!roundId || roundId === 'undefined' || typeof roundId !== 'string') {
      console.warn('[fetchRegistrationRound] Invalid roundId:', roundId);
      return Promise.resolve(null);
    }
    
    // console.log('[fetchRegistrationRound] Calling API with valid ID:', roundId, page, size);
    return originalFetchRegistrationRound(roundId, page, size);
  }, [originalFetchRegistrationRound]);
  
  const updateFishTankInRound = useCallback((registrationRoundId, tankId) => {
    if (!isMounted.current) return Promise.resolve(null);
    
    if (!registrationRoundId || registrationRoundId === 'undefined') {
      console.warn('[updateFishTankInRound] Invalid registrationRoundId:', registrationRoundId);
      return Promise.resolve(null);
    }
    
    // console.log('[updateFishTankInRound] Updating tank:', registrationRoundId, tankId);
    return originalUpdateFishTankInRound(registrationRoundId, tankId);
  }, [originalUpdateFishTankInRound]);

  // Lifecycle management
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch categories when component mounts
  useEffect(() => {
    if (showId) {
      fetchCategories(showId);
    }
  }, [fetchCategories, showId]);

  // Handle category selection
  const handleCategoryChange = useCallback((value) => {
    
    // Reset dependent selections
    setSelectedRoundType(null);
    setSelectedSubRound(null);
    setSelectedCategory(value);
    
    if (value) {
      fetchTanks(value);
    }
  }, [fetchTanks]);

  // Handle round type selection
  const handleRoundTypeChange = useCallback((value) => {
    // console.log('[RoundType] Selected:', value);
    
    // Reset sub-round
    setSelectedSubRound(null);
    setSelectedRoundType(value);
    
    if (selectedCategory && value) {
      fetchRound(selectedCategory, value);
    }
  }, [selectedCategory, fetchRound]);

  // Handle sub-round selection
  const handleSubRoundChange = useCallback((value) => {
    
    // Validate the value
    if (value === 'undefined' || value === undefined) {
      console.warn('[SubRound] Received invalid value, setting to null');
      value = null;
    }
    
    setSelectedSubRound(value);
    
    // Only fetch if we have a valid value
    if (value && typeof value === 'string' && value !== 'undefined') {
      fetchRegistrationRound(value, 1, pageSize);
    }
  }, [fetchRegistrationRound, pageSize]);

  // Handle pagination
  const handleTableChange = useCallback((pagination) => {
    console.log('[Pagination] Changed to:', pagination.current);
    
    if (selectedSubRound && typeof selectedSubRound === 'string' && selectedSubRound !== 'undefined') {
      console.log('[Pagination] Fetching data for page:', pagination.current);
      fetchRegistrationRound(
        selectedSubRound,
        pagination.current || 1,
        pagination.pageSize || 10
      );
    } else {
      console.warn('[Pagination] Skipping fetch due to invalid selectedSubRound:', selectedSubRound);
    }
  }, [selectedSubRound, fetchRegistrationRound]);

  // Handle tank assignment
  const handleTankAssignment = useCallback(async (registrationRoundId, tankId) => {
    // console.log('[TankAssign] Starting assignment:', registrationRoundId, tankId);
    
    if (!registrationRoundId) {
      console.warn('[TankAssign] Missing registrationRoundId');
      return;
    }

    try {
      setAssigningTank((prev) => ({ ...prev, [registrationRoundId]: true }));
      
      const result = await updateFishTankInRound(registrationRoundId, tankId);
      
      if (result?.success) {
        notification.success({
          message: "Thành công",
          description: "Cập nhật bể thành công",
        });
        
        // Only refetch if we have a valid selectedSubRound
        if (selectedSubRound && 
            typeof selectedSubRound === 'string' && 
            selectedSubRound !== 'undefined') {
          // console.log('[TankAssign] Refetching after successful update with ID:', selectedSubRound);
          fetchRegistrationRound(selectedSubRound, currentPage, pageSize);
        } else {
          console.warn('[TankAssign] Skipping refetch due to invalid selectedSubRound:', selectedSubRound);
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: `Không thể cập nhật bể: ${result?.error?.message || "Lỗi không xác định"}`,
        });
      }
    } catch (error) {
      console.error("[TankAssign] Error:", error);
      notification.error({
        message: "Lỗi",
        description: `Không thể cập nhật bể: ${error?.message || "Lỗi không xác định"}`,
      });
    } finally {
      setAssigningTank((prev) => ({ ...prev, [registrationRoundId]: false }));
    }
  }, [
    selectedSubRound,
    currentPage,
    pageSize,
    fetchRegistrationRound,
    updateFishTankInRound,
  ]);

  // Image handling functions
  const handleImageLoad = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  const handleImageLoadStart = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleImageError = useCallback((id) => {
    setLoadingImages((prev) => ({ ...prev, [id]: false }));
  }, []);

  // Prepare display data with proper memoization
  const displayData = useMemo(() => {
    if (!registrationLoading && 
        selectedSubRound && 
        Array.isArray(registrationRound)) {
      return registrationRound.map((item, index) => ({
        ...item,
        key: item.id || `registration-${index}`,
        index: index + 1 + (currentPage - 1) * pageSize,
      }));
    }
    return [];
  }, [registrationRound, currentPage, pageSize, registrationLoading, selectedSubRound]);

  // Define table columns with proper memoization
  const columns = useMemo(() => [
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
          default:
            text = status || "—";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Bể",
      dataIndex: "tankName",
      width: 150,
      render: (tankName, record) => (
        <Select
          style={{ width: "100%" }}
          value={tankName || undefined}
          placeholder="Chọn bể"
          onChange={(value) => handleTankAssignment(record.id, value)}
          loading={assigningTank[record.id]}
          disabled={assigningTank[record.id]}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {tanks?.map((tank) => (
            <Option key={tank.id} value={tank.id}>
              {tank.name || `Bể ${tank.id}`}
            </Option>
          ))}
        </Select>
      ),
    },
  ], [tanks, assigningTank, handleTankAssignment]);



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
        loading={registrationLoading}
      />
    </Card>
  );
}

export default CompetitionRound;
