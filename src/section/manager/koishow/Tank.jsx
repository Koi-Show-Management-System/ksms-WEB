import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Card,

  Tooltip,
  Input as AntInput,
  Tag,
  notification,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,

} from "@ant-design/icons";
import useTank from "../../../hooks/useTank";
import useCategory from "../../../hooks/useCategory";

const { Option } = Select;
const { Search } = AntInput;

function Tank({ showId }) {
  const {
    tanks,
    isLoading,
    error,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    fetchTanks,
    createNewTank,
    updateExistingTank,
    selectedTank,
    setSelectedTank,
    clearSelectedTank,
    isModalVisible,
    setModalVisible,
  } = useTank();

  // Tạo instance của form
  const [form] = Form.useForm();

  // Theo dõi xem modal đã được render chưa
  const [isFormMounted, setIsFormMounted] = useState(false);

  // State cho tìm kiếm
  const [searchText, setSearchText] = useState("");
  const [filteredTanks, setFilteredTanks] = useState([]);
  const { categories, fetchCategories } = useCategory();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  useEffect(() => {
    fetchCategories(showId);
  }, [showId]);

  // Lấy danh sách bể cá khi component được tải hoặc showId thay đổi

  useEffect(() => {
    if (selectedCategoryId) {
      fetchTanks(selectedCategoryId, 1, 10);
    }
  }, [selectedCategoryId, fetchTanks]);

  // Xử lý tìm kiếm
  useEffect(() => {
    if (!tanks) return;

    if (searchText) {
      const filtered = tanks.filter(
        (tank) =>
          tank.name.toLowerCase().includes(searchText.toLowerCase()) ||
          tank.location.toLowerCase().includes(searchText.toLowerCase()) ||
          (tank.waterType &&
            tank.waterType.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredTanks(filtered);
    } else {
      setFilteredTanks(tanks);
    }
  }, [searchText, tanks]);

  useEffect(() => {
    if (isModalVisible) {
      setIsFormMounted(true);

      if (selectedTank) {
        setTimeout(() => {
          form.setFieldsValue({
            competitionCategoryId: selectedTank.id,
            name: selectedTank.name,
            capacity: selectedTank.capacity,
            waterType: selectedTank.waterType,
            temperature: selectedTank.temperature,
            phLevel: selectedTank.phlevel,
            size: selectedTank.size,
            location: selectedTank.location,
            status: selectedTank.status,
          });
        }, 100); // Độ trễ nhỏ để đảm bảo form đã được tải
      } else {
        form.resetFields();
      }
    }
  }, [isModalVisible, selectedTank, form]);

  const showCreateModal = () => {
    form.resetFields();
    clearSelectedTank();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    clearSelectedTank();
    setTimeout(() => {
      setSelectedTank(record);
    }, 0);
  };

  const handleCancel = () => {
    form.resetFields();
    setModalVisible(false);
  };

  const handleSubmit = async (values) => {
    try {
      if (!selectedTank) {
        values.koiShowId = showId;

        const result = await createNewTank(values);
        if (result.success) {
          notification.success({
            message: "Thành công",
            description: "Tạo bể cá thành công",
          });
          setModalVisible(false);
          fetchTanks(showId, currentPage, pageSize);
        } else {
          notification.error({
            message: "Lỗi",
            description: "Không thể tạo bể cá",
          });
        }
      } else {
        // Thêm showId vào values để updateExistingTank có thể fetch lại danh sách
        values.showId = showId;

        // Sử dụng id của tank để cập nhật
        const result = await updateExistingTank(selectedTank.id, values);

        if (result.success) {
          notification.success({
            message: "Thành công",
            description: "Cập nhật bể cá thành công",
          });
          setModalVisible(false);
        } else {
          notification.error({
            message: "Lỗi",
            description: "Không thể cập nhật bể cá",
          });
        }
      }
    } catch (error) {
      console.error("Lỗi xác thực biểu mẫu:", error);
      notification.error({
        message: "Lỗi",
        description: "Đã xảy ra lỗi khi xử lý yêu cầu của bạn",
      });
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleTableChange = (pagination) => {
    fetchTanks(showId, pagination.current, pagination.pageSize);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      sorter: (a, b) => a.capacity - b.capacity,
    },
    {
      title: "Loại Nước",
      dataIndex: "waterType",
      key: "waterType",
    },
    {
      title: "Nhiệt Độ (°C)",
      dataIndex: "temperature",
      key: "temperature",
      render: (temp) => (temp ? temp.toFixed(2) : "N/A"),
    },
    {
      title: "Độ pH",
      dataIndex: "phlevel",
      key: "phLevel",
    },
    {
      title: "Kích Thước (cm)",
      dataIndex: "size",
      key: "size",
      render: (size) => (size ? size.toFixed(2) : "N/A"),
    },
    {
      title: "Vị Trí",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "";
        let text = "";

        switch (status) {
          case "available":
            color = "green";
            text = "Sẵn Sàng";
            break;
          case "occupied":
            color = "blue";
            text = "Đang Sử Dụng";
            break;
          case "maintenance":
            color = "orange";
            text = "Bảo Trì";
            break;
          case "cleaning":
            color = "cyan";
            text = "Đang Dọn Dẹp";
            break;
          case "damaged":
            color = "red";
            text = "Hư Hỏng";
            break;
          case "outOfService":
            color = "gray";
            text = "Ngưng Phục Vụ";
            break;
          default:
            color = "default";
            text = status;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <div
              className="cursor-pointer text-blue-500 hover:text-blue-700"
              onClick={() => handleEdit(record)}
            >
              <EditOutlined />
            </div>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex justify-between items-center w-full">
            {/* <Search
              placeholder="Tìm kiếm bể cá"
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 250 }}
            /> */}
            <Select
              placeholder="Chọn hạng mục "
              style={{ width: 250 }}
              allowClear
              onChange={(value) => setSelectedCategoryId(value)}
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              Thêm Bể Cá
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTanks || tanks}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total} mục`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Sử dụng key để buộc Modal và Form render lại khi selectedTank thay đổi */}
      <Modal
        key={selectedTank ? `edit-${selectedTank.koiShowId}` : "create-new"}
        title={selectedTank ? "Chỉnh Sửa Bể Cá" : "Tạo Bể Cá Mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        width={700}
        destroyOnClose={true}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {selectedTank ? "Cập Nhật" : "Tạo Mới"}
          </Button>,
        ]}
        afterClose={() => {
          setIsFormMounted(false);
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            waterType: "Fresh",
            status: "available",
          }}
          onFinish={handleSubmit}
          preserve={false}
        >
          <Form.Item
            name="competitionCategoryId"
            label="Hạng mục"
            rules={[{ required: true, message: "Vui lòng chọn hạng mục!" }]}
          >
            <Select
              placeholder="Chọn hạng mục"
              onChange={(value) => setSelectedCategoryId(value)}
              allowClear
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên Bể Cá"
            rules={[{ required: true, message: "Vui lòng nhập tên bể cá" }]}
          >
            <Input placeholder="Nhập tên bể cá" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="capacity"
              label="Sức chứa"
              rules={[{ required: true, message: "Vui lòng nhập sức chứa" }]}
            >
              <InputNumber
                min={0}
                max={14}
                style={{ width: "100%" }}
                placeholder="Nhập sức chứa"
              />
            </Form.Item>

            <Form.Item
              name="waterType"
              label="Loại Nước"
              rules={[{ required: true, message: "Vui lòng chọn loại nước" }]}
            >
              <Select placeholder="Chọn loại nước">
                <Option value="Fresh">Nước Ngọt</Option>
                <Option value="Salt">Nước Mặn</Option>
                <Option value="Brackish">Nước Lợ</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="temperature"
              label="Nhiệt Độ (°C)"
              rules={[{ required: true, message: "Vui lòng nhập nhiệt độ" }]}
            >
              <InputNumber
                min={0}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="Nhập nhiệt độ"
              />
            </Form.Item>

            <Form.Item
              name="phLevel"
              label="Độ pH"
              rules={[{ required: true, message: "Vui lòng nhập độ pH" }]}
            >
              <InputNumber
                min={0}
                max={14}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="Nhập độ pH"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="size"
              label="Kích Thước (cm)"
              rules={[{ required: true, message: "Vui lòng nhập kích thước" }]}
            >
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: "100%" }}
                placeholder="Nhập kích thước (cm)"
              />
            </Form.Item>

            <Form.Item
              name="location"
              label="Vị Trí"
              rules={[{ required: true, message: "Vui lòng nhập vị trí" }]}
            >
              <Input placeholder="Nhập vị trí bể cá" />
            </Form.Item>
          </div>

          <Form.Item
            name="status"
            label="Trạng Thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="available">Sẵn Sàng</Option>
              <Option value="occupied">Đang Sử Dụng</Option>
              <Option value="maintenance">Bảo Trì</Option>
              <Option value="cleaning">Đang Dọn Dẹp</Option>
              <Option value="damaged">Hư Hỏng</Option>
              <Option value="outOfService">Ngưng Phục Vụ</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Tank;
