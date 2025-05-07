import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Select,
  Typography,
  Form,
  Modal,
  message,
  Drawer,
  Descriptions,
  Divider,
  List,
  Card,
  Tabs,
  Collapse,
  Popconfirm,
  Row,
  Col,
  Space,
  Empty,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
  TrophyOutlined,
  ApartmentOutlined,
  FieldTimeOutlined,
  StopOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import useCategory from "../../hooks/useCategory";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

function Category({ showId, statusShow }) {
  const [searchText, setSearchText] = useState("");
  const [filterVariety, setFilterVariety] = useState("");
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const isEditDisabled = statusShow === "published";
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [categoryToCancel, setCategoryToCancel] = useState(null);

  const showEditModal = (categoryId) => {
    setEditingCategoryId(categoryId);
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditingCategoryId(null);
    setIsEditModalVisible(false);
  };

  const {
    categories,
    isLoading,
    error,
    fetchCategories,
    getCategoryDetail,
    deleteCategory,
    cancelCategory,
  } = useCategory();

  useEffect(() => {
    fetchCategories(showId, 1, 10);
  }, [showId]);

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const handleCategoryCreated = () => {
    // Refresh the categories list after a new category is created
    fetchCategories(showId, 1, 10);
  };

  const showCategoryDetail = async (categoryId) => {
    try {
      const detail = await getCategoryDetail(categoryId);
      if (detail) {
        setSelectedCategory(detail);
        setIsDetailDrawerVisible(true);
      }
    } catch (error) {
      message.error("Failed to load category details");
      console.error("Error fetching category details:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      fetchCategories(showId, 1, 10);
    } catch (error) {
      message.error("Không thể xóa hạng mục. Vui lòng thử lại sau.");
    }
  };

  const handleCancelCategory = async (categoryId, reason) => {
    if (!reason || reason.trim() === "") {
      message.error("Vui lòng nhập lý do hủy hạng mục!");
      return;
    }

    try {
      await cancelCategory(categoryId, reason);
      fetchCategories(showId, 1, 10);
      setCancelReason("");
      setCancelModalVisible(false);
    } catch (error) {
      message.error("Không thể hủy hạng mục. Vui lòng thử lại sau.");
    }
  };

  const showCancelModal = (categoryId) => {
    setCategoryToCancel(categoryId);
    setCancelModalVisible(true);
  };

  // Filter the categories from the API
  const filteredData = categories.filter((item) => {
    const matchesSearch =
      (item.name?.toLowerCase() || "").includes(searchText) ||
      (item.sizeMin?.toString() || "").includes(searchText) ||
      (item.sizeMax?.toString() || "").includes(searchText) ||
      (
        item.categoryVarieties?.[0]?.variety?.name?.toLowerCase() || ""
      ).includes(searchText);
    const matchesVariety = filterVariety
      ? item.categoryVarieties?.[0]?.variety?.name === filterVariety
      : true;
    return matchesSearch && matchesVariety;
  });

  const columns = [
    {
      title: "Tên Hạng Mục",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (name, record) => (
        <div>
          <Typography.Text>{name}</Typography.Text>
          {record.status === "cancelled" && (
            <Tag color="red" className="ml-2">
              Đã hủy
            </Tag>
          )}
        </div>
      ),
      ellipsis: true,
    },
    {
      title: "Kích Thước",
      key: "sizeCategory",
      sorter: (a, b) => {
        return a.sizeMin - b.sizeMin;
      },
      render: (_, record) => (
        <span>
          <Typography.Text>
            {record.sizeMin}-{record.sizeMax} cm
          </Typography.Text>
        </span>
      ),
      responsive: ["md"],
    },
    {
      title: "SL tối thiểu",
      dataIndex: "minEntries",
      key: "minEntries",
      sorter: (a, b) => (a.minEntries || 0) - (b.minEntries || 0),
      responsive: ["lg"],
    },
    {
      title: "SL tối đa",
      dataIndex: "maxEntries",
      key: "maxEntries",
      sorter: (a, b) => (a.maxEntries || 0) - (b.maxEntries || 0),
      responsive: ["lg"],
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="text-gray-500 hover:text-blue-500"
            onClick={() => showCategoryDetail(record.id)}
            size="middle"
          />
        </div>
      ),
    },
  ];
  return (
    <div className="p-2 md:p-4 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Search
              placeholder="Tìm kiếm danh mục..."
              onSearch={handleSearch}
              className="w-full"
              size="large"
              allowClear
            />
          </Col>
        </Row>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total}`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            size: "small",
          }}
          className="bg-white rounded-lg"
          loading={isLoading}
          rowKey={(record) => record.id || record.key}
          scroll={{ x: "max-content" }}
          size="middle"
        />
      </div>

      {/* Category Detail Drawer */}
      <Drawer
        title={selectedCategory?.name || "Chi tiết hạng mục"}
        placement="right"
        width={window.innerWidth < 768 ? "100%" : 720}
        onClose={() => setIsDetailDrawerVisible(false)}
        open={isDetailDrawerVisible}
      >
        {selectedCategory && (
          <Tabs
            defaultActiveKey="1"
            size={window.innerWidth < 768 ? "small" : "default"}
            items={[
              {
                key: "1",
                label: "Thông tin cơ bản",
                children: (
                  <Card className="shadow-sm mb-4">
                    <Descriptions
                      column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
                      className="custom-descriptions"
                      size="middle"
                      layout="horizontal"
                      styles={{
                        label: {
                          fontWeight: 500,
                          color: "#666",
                          width: "180px",
                          padding: "8px 12px",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "4px 0 0 4px",
                        },
                        content: {
                          padding: "8px 12px",
                          backgroundColor: "#fff",
                          borderRadius: "0 4px 4px 0",
                        },
                      }}
                      items={[
                        {
                          key: "name",
                          label: "Tên hạng mục",
                          span: 1,
                          children: (
                            <Typography.Text strong className="text-base">
                              {selectedCategory.name}
                            </Typography.Text>
                          ),
                        },
                        {
                          key: "size",
                          label: "Kích thước",
                          span: 1,
                          children: (
                            <Tag
                              color="blue"
                              className="text-sm px-3 py-1 rounded-lg"
                            >
                              {selectedCategory.sizeMin} -{" "}
                              {selectedCategory.sizeMax} cm
                            </Tag>
                          ),
                        },
                        {
                          key: "hasTank",
                          label: "Bể trưng bày",
                          span: 1,
                          children: selectedCategory.hasTank ? (
                            <Tag color="green" className="px-3 py-1 rounded-lg">
                              Có
                            </Tag>
                          ) : (
                            <Tag color="red" className="px-3 py-1 rounded-lg">
                              Không
                            </Tag>
                          ),
                        },
                        {
                          key: "minEntries",
                          label: "Số lượng tối thiểu",
                          span: 1,
                          children: (
                            <Typography.Text strong>
                              {selectedCategory.minEntries}
                            </Typography.Text>
                          ),
                        },
                        {
                          key: "maxEntries",
                          label: "Số lượng tối đa",
                          span: 1,
                          children: (
                            <Typography.Text strong>
                              {selectedCategory.maxEntries}
                            </Typography.Text>
                          ),
                        },

                        ...(selectedCategory.status === "cancelled"
                          ? [
                              {
                                key: "status",
                                label: "Trạng thái",
                                span: 1,
                                children: (
                                  <Tag
                                    color="red"
                                    className="px-3 py-1 rounded-lg"
                                  >
                                    Đã hủy
                                  </Tag>
                                ),
                              },
                            ]
                          : []),
                        {
                          key: "description",
                          label: "Mô tả",
                          span: 1,
                          children: (
                            <div>
                              {selectedCategory.description || (
                                <Typography.Text type="secondary" italic>
                                  Không có mô tả
                                </Typography.Text>
                              )}
                            </div>
                          ),
                        },
                        {
                          key: "varieties",
                          label: "Giống cá",
                          span: 1,
                          children:
                            selectedCategory.categoryVarieties?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedCategory.categoryVarieties?.map(
                                  (item) => (
                                    <Tag
                                      key={item.id}
                                      color="blue"
                                      className="text-sm py-1 px-3 rounded-full border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                                    >
                                      {item.variety?.name}
                                    </Tag>
                                  )
                                )}
                              </div>
                            ) : (
                              <Typography.Text type="secondary" italic>
                                Không có giống cá nào
                              </Typography.Text>
                            ),
                        },
                      ]}
                    />
                  </Card>
                ),
              },
              {
                key: "2",
                label: (
                  <span>
                    <TrophyOutlined /> Giải thưởng
                  </span>
                ),
                children: (
                  <div className="awards-container">
                    <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-lg">
                      <Typography.Title
                        level={5}
                        className="m-0 flex items-center"
                      >
                        <TrophyOutlined className="mr-2 text-yellow-500" /> Danh
                        sách giải thưởng
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        Các giải thưởng cao quý nhất của hạng mục này
                      </Typography.Text>
                    </div>

                    {selectedCategory.awards?.length > 0 ? (
                      <Collapse
                        className="custom-award-collapse"
                        items={selectedCategory.awards
                          ?.sort((a, b) => {
                            const order = {
                              first: 1,
                              second: 2,
                              third: 3,
                              honorable: 4,
                            };
                            return order[a.awardType] - order[b.awardType];
                          })
                          .map((award) => {
                            const awardTypeMap = {
                              first: {
                                name: "Giải Nhất",
                                icon: <TrophyOutlined />,
                                color: "#FFD700",
                                bgColor: "#FFFBEB",
                                borderColor: "border-yellow-400",
                              },
                              second: {
                                name: "Giải Nhì",
                                icon: <TrophyOutlined />,
                                color: "#C0C0C0",
                                bgColor: "#F9FAFB",
                                borderColor: "border-gray-400",
                              },
                              third: {
                                name: "Giải Ba",
                                icon: <TrophyOutlined />,
                                color: "#CD7F32",
                                bgColor: "#FEF3C7",
                                borderColor: "border-amber-400",
                              },
                              honorable: {
                                name: "Giải Khuyến Khích",
                                icon: <TrophyOutlined />,
                                color: "#4A90E2",
                                bgColor: "#EFF6FF",
                                borderColor: "border-blue-400",
                              },
                            };

                            const awardInfo = awardTypeMap[award.awardType] || {
                              name: "Giải Thưởng",
                              icon: <TrophyOutlined />,
                              color: "#808080",
                              bgColor: "#F5F5F5",
                              borderColor: "border-gray-300",
                            };

                            return {
                              key: award.id,
                              className: `border-l-4 ${awardInfo.borderColor} mb-2`,
                              style: { backgroundColor: awardInfo.bgColor },
                              label: (
                                <div className="flex items-center w-full">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                                    style={{
                                      backgroundColor: `${awardInfo.color}20`,
                                    }}
                                  >
                                    <TrophyOutlined
                                      style={{ color: awardInfo.color }}
                                    />
                                  </div>
                                  <div className="flex-grow">
                                    <Typography.Text
                                      strong
                                      style={{ color: awardInfo.color }}
                                    >
                                      {awardInfo.name}
                                    </Typography.Text>
                                  </div>
                                  <div>
                                    <Tag color="green" className="font-medium">
                                      {award.prizeValue.toLocaleString()} VND
                                    </Tag>
                                  </div>
                                </div>
                              ),
                              children: (
                                <div className="p-3 bg-white rounded-md">
                                  <div className="grid grid-cols-3 text-sm mb-2">
                                    <div className="text-gray-500">
                                      Tên giải:
                                    </div>
                                    <div className="col-span-2 font-medium">
                                      {award.name || awardInfo.name}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 text-sm mb-2">
                                    <div className="text-gray-500">
                                      Giá trị:
                                    </div>
                                    <div className="col-span-2 font-medium text-green-600">
                                      {award.prizeValue.toLocaleString()} VND
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 text-sm">
                                    <div className="text-gray-500">Mô tả:</div>
                                    <div className="col-span-2">
                                      {award.description ? (
                                        <div className="text-gray-700">
                                          {award.description}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic text-xs">
                                          Không có mô tả
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            };
                          })}
                      />
                    ) : (
                      <Empty
                        description="Không có giải thưởng nào cho hạng mục này"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "4",
                label: "Tiêu chí đánh giá",
                children: (
                  <>
                    <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                      <Typography.Text className="flex items-center">
                        <TrophyOutlined className="mr-2 text-blue-500" />
                        Tiêu chí đánh giá được phân theo từng vòng thi
                      </Typography.Text>
                    </div>

                    <Card className="shadow-sm ">
                      <Tabs
                        defaultActiveKey="preliminary"
                        tabPosition={window.innerWidth < 576 ? "top" : "left"}
                        size={window.innerWidth < 768 ? "small" : "default"}
                        className="criteria-tabs"
                        items={[
                          {
                            key: "preliminary",
                            label: (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-orange-400 mr-2"></div>
                                <span>Vòng sơ khảo</span>
                              </div>
                            ),
                            children: (
                              <>
                                <div className="p-3 mb-4 bg-orange-50 border border-orange-100 rounded-md">
                                  <p className="text-orange-800 text-sm">
                                    <strong>Vòng Sơ Khảo</strong> chỉ áp dụng
                                    hình thức chấm đạt/không đạt (Pass/Fail).
                                    Trọng tài sẽ đánh giá các cá thể có đủ điều
                                    kiện tham gia vòng tiếp theo hay không.
                                  </p>
                                </div>

                                {selectedCategory.criteriaCompetitionCategories?.filter(
                                  (c) => c.roundType === "Preliminary"
                                ).length > 0 ? (
                                  <div className="space-y-2">
                                    {selectedCategory.criteriaCompetitionCategories
                                      ?.filter(
                                        (c) => c.roundType === "Preliminary"
                                      )
                                      .sort((a, b) => a.order - b.order)
                                      .map((item) => (
                                        <div
                                          key={item.id}
                                          className="p-3 border border-gray-100 rounded-md hover:shadow-sm transition-shadow"
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <div className="font-medium flex items-center">
                                              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs mr-2">
                                                {item.order}
                                              </span>
                                              {item.criteria?.name}
                                            </div>
                                            <Tag
                                              color="orange"
                                              className="text-xs"
                                            >
                                              Trọng số:{" "}
                                              {(item.weight * 100).toFixed(0)}%
                                            </Tag>
                                          </div>
                                          <p className="text-gray-600 text-sm ml-7">
                                            {item.criteria?.description || (
                                              <span className="text-gray-400 italic">
                                                Không có mô tả
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <Empty
                                    description="Không yêu cầu tiêu chí đánh giá cho vòng này"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  />
                                )}
                              </>
                            ),
                          },
                          {
                            key: "evaluation",
                            label: (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                                <span>Vòng đánh giá chính</span>
                              </div>
                            ),
                            children: (
                              <>
                                {selectedCategory.criteriaCompetitionCategories?.filter(
                                  (c) => c.roundType === "Evaluation"
                                ).length > 0 ? (
                                  <div className="space-y-2">
                                    {selectedCategory.criteriaCompetitionCategories
                                      ?.filter(
                                        (c) => c.roundType === "Evaluation"
                                      )
                                      .sort((a, b) => a.order - b.order)
                                      .map((item) => (
                                        <div
                                          key={item.id}
                                          className="p-3 border border-gray-100 rounded-md hover:shadow-sm transition-shadow"
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <div className="font-medium flex items-center">
                                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2">
                                                {item.order}
                                              </span>
                                              {item.criteria?.name}
                                            </div>
                                            <Tag
                                              color="blue"
                                              className="text-xs"
                                            >
                                              Trọng số:{" "}
                                              {(item.weight * 100).toFixed(0)}%
                                            </Tag>
                                          </div>
                                          <p className="text-gray-600 text-sm ml-7">
                                            {item.criteria?.description || (
                                              <span className="text-gray-400 italic">
                                                Không có mô tả
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <Empty
                                    description="Không có tiêu chí đánh giá cho vòng này"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  />
                                )}
                              </>
                            ),
                          },
                          {
                            key: "final",
                            label: (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                                <span>Vòng chung kết</span>
                              </div>
                            ),
                            children: (
                              <>
                                {selectedCategory.criteriaCompetitionCategories?.filter(
                                  (c) => c.roundType === "Final"
                                ).length > 0 ? (
                                  <div className="space-y-2">
                                    {selectedCategory.criteriaCompetitionCategories
                                      ?.filter((c) => c.roundType === "Final")
                                      .sort((a, b) => a.order - b.order)
                                      .map((item) => (
                                        <div
                                          key={item.id}
                                          className="p-3 border border-gray-100 rounded-md hover:shadow-sm transition-shadow"
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <div className="font-medium flex items-center">
                                              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2">
                                                {item.order}
                                              </span>
                                              {item.criteria?.name}
                                            </div>
                                            <Tag
                                              color="green"
                                              className="text-xs"
                                            >
                                              Trọng số:{" "}
                                              {(item.weight * 100).toFixed(0)}%
                                            </Tag>
                                          </div>
                                          <p className="text-gray-600 text-sm ml-7">
                                            {item.criteria?.description || (
                                              <span className="text-gray-400 italic">
                                                Không có mô tả
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <Empty
                                    description="Không có tiêu chí đánh giá cho vòng này"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  />
                                )}
                              </>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  </>
                ),
              },
              {
                key: "5",
                label: (
                  <span>
                    <UserOutlined /> Giám khảo
                  </span>
                ),
                children: (() => {
                  const refereeMap = {};

                  (selectedCategory.refereeAssignments || []).forEach(
                    (item) => {
                      const email = item.refereeAccount?.email;
                      if (!refereeMap[email]) {
                        refereeMap[email] = {
                          referee: item.refereeAccount,
                          assignedBy: item.assignedByNavigation,
                          roundTypes: [item.roundType],
                          assignedAt: item.assignedAt,
                        };
                      } else {
                        if (
                          !refereeMap[email].roundTypes.includes(item.roundType)
                        ) {
                          refereeMap[email].roundTypes.push(item.roundType);
                        }
                      }
                    }
                  );

                  const groupedReferees = Object.values(refereeMap);

                  const translateRoundType = (type) => {
                    switch (type) {
                      case "Preliminary":
                        return "Vòng Sơ khảo";
                      case "Evaluation":
                        return "Vòng Đánh giá chính";
                      case "Final":
                        return "Vòng Chung kết";
                      default:
                        return type;
                    }
                  };

                  const tagColorMap = {
                    Preliminary: "orange",
                    Evaluation: "blue",
                    Final: "green",
                  };

                  return (
                    <div className="space-y-4">
                      <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                        <Typography.Text className="flex items-center">
                          <UserOutlined className="mr-2 text-blue-500" />
                          Tổng số:{" "}
                          <span className="font-medium ml-1">
                            {groupedReferees.length} giám khảo
                          </span>
                        </Typography.Text>
                      </div>

                      {groupedReferees.length > 0 ? (
                        <Collapse
                          className="custom-referee-collapse"
                          items={groupedReferees.map((item) => ({
                            key: item.referee?.email,
                            className: "mb-2 border-l-4 border-blue-300",
                            label: (
                              <div className="flex items-center">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                  <UserOutlined style={{ color: "#1890ff" }} />
                                </div>
                                <div className="flex-grow">
                                  <span className="font-medium">
                                    {item.referee?.fullName}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.roundTypes.map((type) => (
                                    <Tag
                                      key={type}
                                      color={tagColorMap[type] || "default"}
                                      className="text-xs"
                                    >
                                      {translateRoundType(type)}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            ),
                            children: (
                              <div className="p-3 bg-white">
                                <div className="grid grid-cols-3 text-sm mb-2">
                                  <div className="text-gray-500">Email:</div>
                                  <div className="col-span-2">
                                    {item.referee?.email}
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 text-sm">
                                  <div className="text-gray-500">
                                    Được phân công bởi:
                                  </div>
                                  <div className="col-span-2 font-medium">
                                    {item.assignedBy?.fullName}
                                  </div>
                                </div>
                              </div>
                            ),
                          }))}
                        />
                      ) : (
                        <Empty
                          description="Không có giám khảo nào được phân công"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </div>
                  );
                })(),
              },
              {
                key: "6",
                label: (
                  <span>
                    <FieldTimeOutlined /> Vòng thi
                  </span>
                ),
                children: (() => {
                  // Group rounds by roundType
                  const roundsByType = {};

                  // Process and group rounds
                  (selectedCategory.rounds || []).forEach((round) => {
                    const type = round.roundType;
                    if (!roundsByType[type]) {
                      roundsByType[type] = [];
                    }
                    roundsByType[type].push(round);
                  });

                  // Translate roundType to Vietnamese
                  const translateRoundType = (type) => {
                    switch (type) {
                      case "Preliminary":
                        return "Vòng Sơ Khảo";
                      case "Evaluation":
                        return "Vòng Đánh Giá Chính";
                      case "Final":
                        return "Vòng Chung Kết";
                      default:
                        return type;
                    }
                  };

                  // Style configs for different round types
                  const roundTypeStyles = {
                    Preliminary: {
                      color: "#FA8C16",
                      bgColor: "#FFF7E6",
                      borderColor: "border-orange-400",
                      icon: <FieldTimeOutlined style={{ color: "#FA8C16" }} />,
                    },
                    Evaluation: {
                      color: "#1890FF",
                      bgColor: "#E6F7FF",
                      borderColor: "border-blue-400",
                      icon: <FieldTimeOutlined style={{ color: "#1890FF" }} />,
                    },
                    Final: {
                      color: "#52C41A",
                      bgColor: "#F6FFED",
                      borderColor: "border-green-400",
                      icon: <FieldTimeOutlined style={{ color: "#52C41A" }} />,
                    },
                  };

                  // Convert to array for rendering
                  const groupedRounds = Object.entries(roundsByType)
                    .map(([type, rounds]) => ({
                      type,
                      translatedType: translateRoundType(type),
                      rounds: rounds.sort(
                        (a, b) => a.roundOrder - b.roundOrder
                      ),
                      style: roundTypeStyles[type],
                    }))
                    .sort((a, b) => {
                      const order = { Preliminary: 1, Evaluation: 2, Final: 3 };
                      return order[a.type] - order[b.type];
                    });

                  return (
                    <div className="rounds-container">
                      <div className="mb-3 p-2 bg-gray-50 border-l-4 border-gray-300 rounded-lg">
                        <Typography.Text type="secondary" className="text-sm">
                          Hạng mục này có 3 loại vòng chính
                        </Typography.Text>
                      </div>

                      {groupedRounds.length > 0 ? (
                        <Collapse
                          className="custom-rounds-collapse"
                          items={groupedRounds.map((group) => {
                            // Nếu là vòng Sơ Khảo hoặc Chung Kết và chỉ có 1 vòng thì không cho mở dropdown
                            const isSingleRound =
                              (group.type === "Preliminary" ||
                                group.type === "Final") &&
                              group.rounds.length === 1;

                            return {
                              key: group.type,
                              className: `mb-2 border-l-4 ${group.style.borderColor}`,
                              style: { backgroundColor: group.style.bgColor },
                              collapsible: isSingleRound
                                ? "disabled"
                                : undefined,
                              label: (
                                <div className="flex items-center">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                                    style={{
                                      backgroundColor: `${group.style.color}20`,
                                    }}
                                  >
                                    {group.style.icon}
                                  </div>
                                  <Typography.Text
                                    strong
                                    style={{ color: group.style.color }}
                                  >
                                    {group.translatedType}
                                  </Typography.Text>
                                  <Tag
                                    className="ml-auto"
                                    color={
                                      group.type === "Preliminary"
                                        ? "orange"
                                        : group.type === "Evaluation"
                                          ? "blue"
                                          : "green"
                                    }
                                    size="small"
                                  >
                                    {group.rounds.length} vòng
                                  </Tag>
                                </div>
                              ),
                              // Chỉ hiển thị nội dung chi tiết nếu không phải là vòng Sơ Khảo/Chung Kết có 1 vòng
                              children: !isSingleRound ? (
                                <div className="bg-white px-2">
                                  {group.rounds.map((round, index) => (
                                    <div
                                      key={round.id}
                                      className={`py-2 ${index !== group.rounds.length - 1 ? "border-b border-gray-100" : ""}`}
                                    >
                                      <div className="flex items-center">
                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 text-xs">
                                          {round.roundOrder}
                                        </div>
                                        <Typography.Text className="text-md">
                                          <span className="font-medium">
                                            Vòng {round.roundOrder}
                                          </span>
                                          {round.numberOfRegistrationToAdvance !==
                                            null && (
                                            <span className="ml-3 text-blue-600 font-medium">
                                              (số cá qua vòng là{" "}
                                              {
                                                round.numberOfRegistrationToAdvance
                                              }
                                              )
                                            </span>
                                          )}
                                        </Typography.Text>
                                      </div>

                                      {round.description && (
                                        <div className="mt-1 ml-7 text-gray-500 text-xs">
                                          {round.description}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : null,
                            };
                          })}
                        />
                      ) : (
                        <Empty
                          description="Không có thông tin vòng thi cho hạng mục này"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </div>
                  );
                })(),
              },
            ]}
          />
        )}
      </Drawer>

      {isEditModalVisible && (
        <EditCategory
          categoryId={editingCategoryId}
          onClose={closeEditModal}
          showId={showId}
          onCategoryUpdated={() => fetchCategories(showId, 1, 10)}
        />
      )}

      {/* Modal Nhập lý do hủy */}
      <Modal
        title="Hủy hạng mục"
        open={cancelModalVisible}
        onOk={() => handleCancelCategory(categoryToCancel, cancelReason)}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason("");
        }}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        okButtonProps={{ disabled: !cancelReason.trim() }}
        width={window.innerWidth < 768 ? "95%" : 520}
        centered
      >
        <Form layout="vertical">
          <Form.Item
            label="Lý do hủy"
            name="cancelReason"
            rules={[{ required: true, message: "Vui lòng nhập lý do hủy!" }]}
          >
            <TextArea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy hạng mục..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Category;
