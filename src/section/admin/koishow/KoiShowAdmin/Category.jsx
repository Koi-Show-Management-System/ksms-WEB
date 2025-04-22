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
import useCategory from "../../../../hooks/useCategory";
import CreateCategory from "./CreateCategory";
import EditCategory from "./EditCategory";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

function Category({ showId, statusShow }) {
  const [searchText, setSearchText] = useState("");
  const [filterVariety, setFilterVariety] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form] = Form.useForm();
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
      responsive: ["xs", "sm", "md", "lg", "xl"],
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
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    // {
    //   title: "Giống",
    //   key: "variety",
    //   render: (_, record) => {
    //     // Check if varieties exists and has items
    //     if (
    //       !record.varieties ||
    //       !Array.isArray(record.varieties) ||
    //       record.varieties.length === 0
    //     ) {
    //       return <span>N/A</span>;
    //     }

    //     // Join all variety names
    //     return <span>{record.varieties.join(", ")}</span>;
    //   },
    //   filters: [
    //     { text: "Kohaku", value: "Kohaku" },
    //     { text: "Showa", value: "Showa" },
    //     { text: "Sanke", value: "Sanke" },
    //     { text: "Showa Sanshoku", value: "Showa Sanshoku" },
    //   ],
    //   onFilter: (value, record) => {
    //     if (
    //       !record.varieties ||
    //       !Array.isArray(record.varieties) ||
    //       record.varieties.length === 0
    //     ) {
    //       return false;
    //     }

    //     return record.varieties.some((variety) => variety === value);
    //   },
    // },
    {
      title: "SL Koi tối thiểu",
      dataIndex: "minEntries",
      key: "minEntries",
      sorter: (a, b) => (a.minEntries || 0) - (b.minEntries || 0),
      responsive: ["sm", "md", "lg", "xl"],
    },
    {
      title: "SL Koi tối đa",
      dataIndex: "maxEntries",
      key: "maxEntries",
      sorter: (a, b) => (a.maxEntries || 0) - (b.maxEntries || 0),
      responsive: ["sm", "md", "lg", "xl"],
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
          {!isEditDisabled && record.status !== "cancelled" && (
            <Button
              type="text"
              icon={<EditOutlined />}
              className="text-gray-500 hover:text-blue-500"
              onClick={() => showEditModal(record.id)}
            />
          )}
          {(statusShow === "pending" || statusShow === "internalpublished") &&
            record.status !== "cancelled" && (
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa hạng mục này?"
                onConfirm={() => handleDeleteCategory(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  className="text-gray-500 hover:text-red-500"
                />
              </Popconfirm>
            )}
          {!(
            statusShow === "pending" ||
            statusShow === "internalpublished" ||
            record.status === "cancelled"
          ) && (
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              className="text-gray-500 hover:text-red-500"
              onClick={() => showCancelModal(record.id)}
              title="Hủy hạng mục"
            />
          )}
        </div>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <Search
            placeholder="Tìm kiếm danh mục..."
            onSearch={handleSearch}
            className="w-full sm:w-64 md:w-80"
            allowClear
          />
        </div>

        {/* Create Category Modal */}
        {!isEditDisabled && (
          <CreateCategory
            showId={showId}
            onCategoryCreated={handleCategoryCreated}
          />
        )}
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
            size: "default",
          }}
          className="bg-white rounded-lg"
          loading={isLoading}
          rowKey={(record) => record.id || record.key}
          scroll={{ x: true }}
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
          >
            <TabPane tab="Thông tin cơ bản" key="1">
              <Descriptions bordered column={1} className="mb-4" size="middle">
                <Descriptions.Item label="Tên hạng mục">
                  {selectedCategory.name}
                </Descriptions.Item>
                <Descriptions.Item label="Kích thước">
                  {selectedCategory.sizeMin} - {selectedCategory.sizeMax} cm
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng tối đa">
                  {selectedCategory.maxEntries}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng tối thiểu ">
                  {selectedCategory.minEntries}
                </Descriptions.Item>
                {selectedCategory.status === "cancelled" && (
                  <Descriptions.Item label="Trạng thái">
                    <Tag color="red">Đã hủy</Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Bể trưng bày">
                  {selectedCategory.hasTank ? "Có" : "Không"}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả">
                  {selectedCategory.description}
                </Descriptions.Item>
                <Descriptions.Item label="Giống">
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.categoryVarieties?.map((item) => (
                      <Tag
                        key={item.id}
                        color="blue"
                        className="text-sm py-1 px-3 rounded-full border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                      >
                        {item.variety?.name}
                      </Tag>
                    ))}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="Giải thưởng" key="2" icon={<TrophyOutlined />}>
              <Collapse>
                {selectedCategory.awards
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
                        icon: <TrophyOutlined style={{ color: "#FFD700" }} />,
                      },
                      second: {
                        name: "Giải Nhì",
                        icon: <TrophyOutlined style={{ color: "#B4B4B4" }} />,
                      },
                      third: {
                        name: "Giải Ba",
                        icon: <TrophyOutlined style={{ color: "#CD7F32" }} />,
                      },
                      honorable: {
                        name: "Giải Khuyến Khích",
                        icon: <TrophyOutlined style={{ color: "#4A90E2" }} />,
                      },
                    };

                    return (
                      <Collapse.Panel
                        key={award.id}
                        header={
                          <div className="flex items-center">
                            {awardTypeMap[award.awardType].icon}
                            <span className="ml-2 font-medium">
                              {awardTypeMap[award.awardType].name}
                            </span>
                          </div>
                        }
                      >
                        <div className="p-4">
                          <div className="mb-2">
                            <strong>Tên giải:</strong> {award.name}
                          </div>
                          <div className="mb-2">
                            <strong>Giá trị:</strong>{" "}
                            {award.prizeValue.toLocaleString()} VND
                          </div>
                          <div>
                            <strong>Mô tả:</strong> {award.description}
                          </div>
                        </div>
                      </Collapse.Panel>
                    );
                  })}
              </Collapse>
            </TabPane>

            <TabPane tab="Tiêu chí đánh giá" key="4">
              <Tabs
                defaultActiveKey="preliminary"
                tabPosition={window.innerWidth < 576 ? "top" : "left"}
                size={window.innerWidth < 768 ? "small" : "default"}
              >
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
                  <Collapse>
                    {groupedReferees.map((item) => (
                      <Collapse.Panel
                        key={item.referee?.email}
                        header={
                          <div className="flex items-center">
                            <UserOutlined style={{ color: "#1890ff" }} />
                            <span className="ml-2 font-medium">
                              {item.referee?.fullName}
                            </span>
                            <div className="ml-auto">
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
                        }
                      >
                        <div className="p-4">
                          <div className="mb-2">
                            <strong>Email:</strong> {item.referee?.email}
                          </div>

                          <div className="mb-2">
                            <strong>Được phân công bởi:</strong>{" "}
                            {item.assignedBy?.fullName}
                          </div>
                        </div>
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                );
              })()}
            </TabPane>

            <TabPane tab="Vòng thi" key="6" icon={<FieldTimeOutlined />}>
              {(() => {
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
                      return "Vòng Đánh Giá";
                    case "Final":
                      return "Vòng Chung Kết";
                    default:
                      return type;
                  }
                };

                // Convert to array for rendering
                const groupedRounds = Object.entries(roundsByType)
                  .map(([type, rounds]) => ({
                    type,
                    translatedType: translateRoundType(type),
                    rounds: rounds.sort((a, b) => a.roundOrder - b.roundOrder),
                  }))
                  .sort((a, b) => {
                    const order = { Preliminary: 1, Evaluation: 2, Final: 3 };
                    return order[a.type] - order[b.type];
                  });

                return (
                  <div>
                    {groupedRounds.map((group) => (
                      <div key={group.type} className="mb-6">
                        <h3 className="text-lg font-medium mb-3">
                          {group.translatedType}
                        </h3>
                        <Collapse>
                          {group.rounds.map((round) => (
                            <Collapse.Panel
                              key={round.id}
                              header={
                                <div className="flex justify-between items-center">
                                  <span>
                                    Vòng {round.roundOrder} -{" "}
                                    {group.translatedType}
                                  </span>
                                </div>
                              }
                            >
                              <div className="p-2">
                                {round.numberOfRegistrationToAdvance !==
                                  null && (
                                  <p>
                                    <strong>Số lượng cá qua vòng:</strong>{" "}
                                    {round.numberOfRegistrationToAdvance}
                                  </p>
                                )}
                              </div>
                            </Collapse.Panel>
                          ))}
                        </Collapse>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </TabPane>
          </Tabs>
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
        width={520}
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
