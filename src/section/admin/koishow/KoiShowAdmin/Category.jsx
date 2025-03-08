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
} from "@ant-design/icons";
import useCategory from "../../../../hooks/useCategory";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

function Category({ showId }) {
  const [searchText, setSearchText] = useState("");
  const [filterVariety, setFilterVariety] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form] = Form.useForm();

  const { categories, isLoading, error, fetchCategories, getCategoryDetail } =
    useCategory();

  useEffect(() => {
    fetchCategories(showId, 1, 10);
  }, [showId]);

  useEffect(() => {
    if (error) {
      message.error("Failed to load categories");
      console.error("Error fetching categories:", error);
    }
  }, [error]);

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const handleFilterVariety = (value) => {
    setFilterVariety(value);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleCreate = (values) => {
    const newCategory = {
      key: String(categories.length + 1),
      ...values,
      participatingKoi: 0,
    };
    setIsModalVisible(false);
    form.resetFields();
    message.success("Category created successfully");
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
      title: "Danh Mục Kích Thước",
      key: "sizeCategory",
      sorter: (a, b) => {
        return a.sizeMin - b.sizeMin;
      },
      render: (_, record) => (
        <span>
          <Typography.Text className="flex justify-center">
            {record.sizeMin}-{record.sizeMax} cm
          </Typography.Text>
        </span>
      ),
      width: 200,
    },
    {
      title: "Giống",
      key: "variety",
      render: (_, record) => {
        // Check if varieties exists and has items
        if (
          !record.varieties ||
          !Array.isArray(record.varieties) ||
          record.varieties.length === 0
        ) {
          return <span>N/A</span>;
        }

        // Join all variety names
        return <span>{record.varieties.join(", ")}</span>;
      },
      filters: [
        { text: "Kohaku", value: "Kohaku" },
        { text: "Showa", value: "Showa" },
        { text: "Sanke", value: "Sanke" },
        { text: "Showa Sanshoku", value: "Showa Sanshoku" },
      ],
      onFilter: (value, record) => {
        if (
          !record.varieties ||
          !Array.isArray(record.varieties) ||
          record.varieties.length === 0
        ) {
          return false;
        }

        return record.varieties.some((variety) => variety === value);
      },
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

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showModal}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Tạo mới
        </Button>
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

      {/* Create Category Modal */}
      <Modal
        title="Tạo Danh Mục Mới"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="categoryName"
            label="Tên Danh Mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            name="sizeCategory"
            label="Danh Mục Kích Thước"
            rules={[
              { required: true, message: "Vui lòng chọn danh mục kích thước!" },
            ]}
          >
            <Select placeholder="Chọn danh mục kích thước">
              <Option value="Dưới 20 cm">Dưới 20 cm</Option>
              <Option value="20-30 cm">20-30 cm</Option>
              <Option value="30-50 cm">30-50 cm</Option>
              <Option value="Trên 50 cm">Trên 50 cm</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="variety"
            label="Giống"
            rules={[{ required: true, message: "Vui lòng chọn giống!" }]}
          >
            <Select placeholder="Chọn giống">
              <Option value="Kohaku">Kohaku</Option>
              <Option value="Showa">Showa</Option>
              <Option value="Sanke">Sanke</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng Thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="Hoạt động">Hoạt động</Option>
              <Option value="Không hoạt động">Không hoạt động</Option>
            </Select>
          </Form.Item>

          <Form.Item className="flex justify-end mb-0">
            <Button onClick={handleCancel} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-blue-500">
              Tạo mới
            </Button>
          </Form.Item>
        </Form>
      </Modal>

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
              <List
                dataSource={selectedCategory.refereeAssignments || []}
                renderItem={(item) => (
                  <List.Item>
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          {item.refereeAccount?.fullName}
                        </div>
                        <Tag
                          color={
                            item.roundType === "Preliminary"
                              ? "orange"
                              : item.roundType === "Evaluation"
                                ? "blue"
                                : item.roundType === "Final"
                                  ? "green"
                                  : "default"
                          }
                        >
                          {item.roundType}
                        </Tag>
                      </div>
                      <p>
                        <strong>Email:</strong> {item.refereeAccount?.email}
                      </p>
                      <p>
                        <strong>Vai trò:</strong> {item.refereeAccount?.role}
                      </p>
                      <p>
                        <strong>Được phân công bởi:</strong>{" "}
                        {item.assignedByNavigation?.fullName}
                      </p>
                      <p>
                        <strong>Thời gian phân công:</strong>{" "}
                        {new Date(item.assignedAt).toLocaleString()}
                      </p>
                    </div>
                  </List.Item>
                )}
              />
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
