import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Typography,
  message,
  Drawer,
  Descriptions,
  List,
  Card,
  Tabs,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  TrophyOutlined,
  ApartmentOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import useCategory from "../../../hooks/useCategory";

const { Search } = Input;
const { TabPane } = Tabs;

function Category({ showId }) {
  const [searchText, setSearchText] = useState("");
  const [filterVariety, setFilterVariety] = useState("");
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { categories, isLoading, error, fetchCategories, getCategoryDetail } =
    useCategory();

  useEffect(() => {
    fetchCategories(showId, 1, 10);
  }, [showId]);



  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
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
      title: "Tên Danh Mục",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
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
    },

    {
      title: "SL Koi tối đa",
      dataIndex: "maxEntries",
      key: "maxEntries",
      sorter: (a, b) => (a.maxEntries || 0) - (b.maxEntries || 0),
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "pending"
              ? "orange"
              : status === "approved"
                ? "green"
                : status === "upcoming"
                  ? "blue"
                  : "default"
          }
        >
          {status === "pending"
            ? "Chờ duyệt"
            : status === "approved"
              ? "Đã duyệt"
              : status === "upcoming"
                ? "Sắp diễn ra"
                : status}
        </Tag>
      ),
      filters: [
        { text: "Chờ duyệt", value: "pending" },
        { text: "Đã duyệt", value: "approved" },
        { text: "Sắp diễn ra", value: "upcoming" },
      ],
      onFilter: (value, record) => record.status === value,
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
          />
        </div>
      ),
    },
  ];
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center space-x-2 mb-2 md:mb-0">
          <Search
            placeholder="Tìm kiếm danh mục..."
            onSearch={handleSearch}
            className="w-full md:w-64"
            allowClear
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
        className="bg-white rounded-lg"
        loading={isLoading}
        rowKey={(record) => record.id || record.key}
      />

      {/* Category Detail Drawer */}
      <Drawer
        title={selectedCategory?.name || "Chi tiết hạng mục"}
        placement="right"
        width={720}
        onClose={() => setIsDetailDrawerVisible(false)}
        open={isDetailDrawerVisible}
      >
        {selectedCategory && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Thông tin cơ bản" key="1">
              <Descriptions bordered column={1} className="mb-4">
                <Descriptions.Item label="Tên hạng mục">
                  {selectedCategory.name}
                </Descriptions.Item>
                <Descriptions.Item label="Kích thước">
                  {selectedCategory.sizeMin} - {selectedCategory.sizeMax} cm
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng tối đa">
                  {selectedCategory.maxEntries}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag
                    color={
                      selectedCategory.status === "pending"
                        ? "orange"
                        : selectedCategory.status === "approved"
                          ? "green"
                          : selectedCategory.status === "upcoming"
                            ? "blue"
                            : "default"
                    }
                  >
                    {selectedCategory.status === "pending"
                      ? "Chờ duyệt"
                      : selectedCategory.status === "approved"
                        ? "Đã duyệt"
                        : selectedCategory.status === "upcoming"
                          ? "Sắp diễn ra"
                          : selectedCategory.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả">
                  {selectedCategory.description}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="Giải thưởng" key="2" icon={<TrophyOutlined />}>
              <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={selectedCategory.awards || []}
                renderItem={(award) => (
                  <List.Item>
                    <Card title={award.name}>
                      <p>
                        <strong>Loại giải:</strong> {award.awardType}
                      </p>
                      <p>
                        <strong>Giá trị:</strong>{" "}
                        {award.prizeValue.toLocaleString()} VND
                      </p>
                      <p>
                        <strong>Mô tả:</strong> {award.description}
                      </p>
                    </Card>
                  </List.Item>
                )}
              />
            </TabPane>

            <TabPane tab="Giống" key="3" icon={<ApartmentOutlined />}>
              <List
                dataSource={selectedCategory.categoryVarieties || []}
                renderItem={(item) => (
                  <List.Item>
                    <Card title={item.variety?.name}>
                      <p>{item.variety?.description}</p>
                    </Card>
                  </List.Item>
                )}
              />
            </TabPane>

            <TabPane tab="Tiêu chí đánh giá" key="4">
              <Tabs defaultActiveKey="preliminary" tabPosition="left">
                <TabPane tab="Vòng sơ loại" key="preliminary">
                  <List
                    dataSource={
                      selectedCategory.criteriaCompetitionCategories
                        ?.filter((c) => c.roundType === "Preliminary")
                        .sort((a, b) => a.order - b.order) || []
                    }
                    renderItem={(item) => (
                      <List.Item>
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              {item.order}. {item.criteria?.name}
                            </div>
                            <Tag color="blue">
                              Trọng số: {(item.weight * 100).toFixed(0)}%
                            </Tag>
                          </div>
                          <p className="text-gray-600">
                            {item.criteria?.description}
                          </p>
                        </div>
                      </List.Item>
                    )}
                  />
                </TabPane>
                <TabPane tab="Vòng đánh giá" key="evaluation">
                  <List
                    dataSource={
                      selectedCategory.criteriaCompetitionCategories
                        ?.filter((c) => c.roundType === "Evaluation")
                        .sort((a, b) => a.order - b.order) || []
                    }
                    renderItem={(item) => (
                      <List.Item>
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              {item.order}. {item.criteria?.name}
                            </div>
                            <Tag color="blue">
                              Trọng số: {(item.weight * 100).toFixed(0)}%
                            </Tag>
                          </div>
                          <p className="text-gray-600">
                            {item.criteria?.description}
                          </p>
                        </div>
                      </List.Item>
                    )}
                  />
                </TabPane>
                <TabPane tab="Vòng chung kết" key="final">
                  <List
                    dataSource={
                      selectedCategory.criteriaCompetitionCategories
                        ?.filter((c) => c.roundType === "Final")
                        .sort((a, b) => a.order - b.order) || []
                    }
                    renderItem={(item) => (
                      <List.Item>
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              {item.order}. {item.criteria?.name}
                            </div>
                            <Tag color="blue">
                              Trọng số: {(item.weight * 100).toFixed(0)}%
                            </Tag>
                          </div>
                          <p className="text-gray-600">
                            {item.criteria?.description}
                          </p>
                        </div>
                      </List.Item>
                    )}
                  />
                </TabPane>
              </Tabs>
            </TabPane>

            <TabPane tab="Giám khảo" key="5" icon={<UserOutlined />}>
              {(() => {
                const refereeMap = {};

                (selectedCategory.refereeAssignments || []).forEach((item) => {
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
                });

                const groupedReferees = Object.values(refereeMap);

                const translateRoundType = (type) => {
                  switch (type) {
                    case "Preliminary":
                      return "Vòng Sơ loại";
                    case "Evaluation":
                      return "Vòng Đánh giá";
                    case "Final":
                      return "Vòng Chung kết";
                    default:
                      return type;
                  }
                };

                return (
                  <List
                    dataSource={groupedReferees}
                    renderItem={(item) => (
                      <List.Item>
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              {item.referee?.fullName}
                            </div>
                            <div>
                              {item.roundTypes.map((type) => (
                                <Tag
                                  key={type}
                                  color={
                                    type === "Preliminary"
                                      ? "orange"
                                      : type === "Evaluation"
                                        ? "blue"
                                        : type === "Final"
                                          ? "green"
                                          : "default"
                                  }
                                  className="ml-1"
                                >
                                  {translateRoundType(type)}
                                </Tag>
                              ))}
                            </div>
                          </div>
                          <p>
                            <strong>Email:</strong> {item.referee?.email}
                          </p>
                          <p>
                            <strong>Vai trò:</strong> {item.referee?.role}
                          </p>
                          <p>
                            <strong>Được phân công bởi:</strong>{" "}
                            {item.assignedBy?.fullName}
                          </p>
                          <p>
                            <strong>Thời gian phân công:</strong>{" "}
                            {new Date(item.assignedAt).toLocaleString()}
                          </p>
                        </div>
                      </List.Item>
                    )}
                  />
                );
              })()}
            </TabPane>

            <TabPane tab="Vòng thi" key="6" icon={<FieldTimeOutlined />}>
              <List
                dataSource={selectedCategory.rounds || []}
                renderItem={(round) => (
                  <List.Item>
                    <Card
                      title={round.name}
                      extra={
                        <Tag
                          color={
                            round.status === "pending"
                              ? "orange"
                              : round.status === "active"
                                ? "green"
                                : round.status === "completed"
                                  ? "blue"
                                  : "default"
                          }
                        >
                          {round.status}
                        </Tag>
                      }
                    >
                      <p>
                        <strong>Loại vòng:</strong> {round.roundType}
                      </p>
                      <p>
                        <strong>Thứ tự:</strong> {round.roundOrder}
                      </p>
                      <p>
                        <strong>Thời gian bắt đầu:</strong>{" "}
                        {round.startTime
                          ? new Date(round.startTime).toLocaleString()
                          : "Chưa xác định"}
                      </p>
                      <p>
                        <strong>Thời gian kết thúc:</strong>{" "}
                        {round.endTime
                          ? new Date(round.endTime).toLocaleString()
                          : "Chưa xác định"}
                      </p>
                      <p>
                        <strong>Điểm tối thiểu để vào vòng sau:</strong>{" "}
                        {round.minScoreToAdvance}
                      </p>
                    </Card>
                  </List.Item>
                )}
              />
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
}

export default Category;
