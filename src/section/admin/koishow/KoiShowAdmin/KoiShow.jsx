import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Tag,
  notification,
  Pagination,
  Input,
  DatePicker,
  Select,
  Modal,
  Form,
  Input as AntInput,
  Space,
} from "antd";
import {
  EditOutlined,
  SearchOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import NoKoiShow from "../../../../assets/NoKoiShow.png";
import { useNavigate } from "react-router-dom";
import useKoiShow from "../../../../hooks/useKoiShow";
import dayjs from "dayjs";
import { Loading } from "../../../../components";
import Cookies from "js-cookie";
import useAuth from "../../../../hooks/useAuth";

function KoiShow() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [localData, setLocalData] = useState([]);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const { checkRole } = useAuth();
  const userRole = Cookies.get("__role");

  const {
    koiShows,
    isLoading,
    error,
    fetchKoiShowList,
    currentPage,
    pageSize,
    totalItems,
    updateKoiShowStatus,
  } = useKoiShow();

  useEffect(() => {
    fetchKoiShowList(currentPage, pageSize);
  }, []);

  useEffect(() => {
    if (koiShows && koiShows.length > 0) {
      const formattedData = koiShows.map((item) => ({
        key: item.id,
        id: item.id,
        name: item.name,
        startDate: item.startDate,
        registrationFee: item.registrationFee,
        location: item.location,
        status: item.status,
        minParticipants: item.minParticipants,
        maxParticipants: item.maxParticipants,
      }));
      setLocalData(formattedData);
    }
  }, [koiShows]);

  useEffect(() => {
    handleSearch();
  }, [searchText, selectedDate, localData]);

  const handleSearch = () => {
    const filtered = localData.filter((item) => {
      const matchName = item.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchDate = selectedDate
        ? dayjs(item.startExhibitionDate).format("DD/MM/YYYY") ===
          selectedDate.format("DD/MM/YYYY")
        : true;

      return matchName && matchDate;
    });
    setFilteredData(filtered);
  };

  const handlePageChange = (page, size) => {
    fetchKoiShowList(page, size);
  };

  const handleStatusChange = (status, showId) => {
    // Find the current show to check its status
    const currentShow = localData.find((item) => item.id === showId);

    // Nếu trạng thái không nằm trong 3 trạng thái có thể cập nhật, không cho phép thay đổi
    if (
      currentShow &&
      !["pending", "internalpublished", "published"].includes(
        currentShow.status
      )
    ) {
      notification.error({
        message: "Không thể thay đổi",
        description: "Không thể cập nhật trạng thái ở giai đoạn này",
        placement: "topRight",
      });
      return;
    }

    // Các kiểm tra trạng thái hiện có
    if (currentShow && currentShow.status === "cancelled") {
      notification.error({
        message: "Không thể thay đổi",
        description: "Không thể cập nhật trạng thái khi triển lãm đã bị hủy",
        placement: "topRight",
      });
      return;
    }

    if (
      currentShow &&
      currentShow.status === "published" &&
      status === "pending"
    ) {
      notification.error({
        message: "Không thể thay đổi",
        description: "Không thể chuyển trạng thái từ khi đã công bố",
        placement: "topRight",
      });
      return;
    }

    if (
      currentShow &&
      currentShow.status === "internalpublished" &&
      status === "pending"
    ) {
      notification.error({
        message: "Không thể thay đổi",
        description: "Không thể chuyển trạng thái từ khi đã công bố nội bộ",
        placement: "topRight",
      });
      return;
    }

    // Store current and new status information
    setSelectedShowId(showId);
    setSelectedStatus(status);
    setCurrentStatus(currentShow.status);

    // Show appropriate modal
    if (status === "cancelled") {
      setIsModalOpen(true);
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  const updateStatus = async (showId, status, reason = "") => {
    try {
      setLocalData((prevData) =>
        prevData.map((item) =>
          item.id === showId ? { ...item, status: status } : item
        )
      );

      setFilteredData((prevData) =>
        prevData.map((item) =>
          item.id === showId ? { ...item, status: status } : item
        )
      );

      const result = await updateKoiShowStatus(showId, status, reason);

      if (result.success) {
        notification.success({
          message: "Thành công",
          description: `Cập nhật trạng thái triển lãm thành ${getStatusLabel(status)}`,
          placement: "topRight",
        });

        notification.warning({
          message: "Lưu ý",
          description:
            "Khi đã cập nhật trạng thái, bạn sẽ không thể quay lại trạng thái trước đó",
          placement: "topRight",
          duration: 5,
        });

        await fetchKoiShowList(currentPage, pageSize);
      } else {
        notification.error({
          message: "Lỗi",
          description: result.message || "Cập nhật trạng thái thất bại",
          placement: "topRight",
        });
        await fetchKoiShowList(currentPage, pageSize);
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra: " + error.message,
        placement: "topRight",
      });
      await fetchKoiShowList(currentPage, pageSize);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      updateStatus(selectedShowId, selectedStatus, values.cancellationReason);
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleConfirmStatusChange = () => {
    updateStatus(selectedShowId, selectedStatus);
    setIsConfirmModalOpen(false);
  };

  const statusOptions = [
    { value: "pending", label: "Chờ duyệt", color: "orange" },
    { value: "internalpublished", label: "Đã công bố nội bộ", color: "blue" },
    { value: "published", label: "Đã công bố", color: "green" },
    { value: "upcoming", label: "Sắp diễn ra", color: "cyan" },
    { value: "inprogress", label: "Đang diễn ra", color: "purple" },
    { value: "finished", label: "Đã kết thúc", color: "gray" },
    { value: "cancelled", label: "Đã hủy", color: "red" },
  ];

  const getAvailableStatusOptions = (currentStatus) => {
    // Chỉ cho phép cập nhật 3 trạng thái đầu
    if (currentStatus === "pending") {
      return statusOptions.filter((option) =>
        ["internalpublished"].includes(option.value)
      );
    } else if (currentStatus === "internalpublished") {
      return statusOptions.filter((option) =>
        ["internalpublished", "published", "cancelled"].includes(option.value)
      );
    } else if (currentStatus === "published") {
      return statusOptions.filter((option) =>
        ["published", "cancelled"].includes(option.value)
      );
    } else {
      // Các trạng thái khác không cho phép thay đổi
      return statusOptions.filter((option) => option.value === currentStatus);
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  const handleNavigation = (recordId, recordStatus) => {
    if (userRole === "Admin") {
      navigate(`/admin/koiShow/detail/${recordId}?status=${recordStatus}`);
    } else if (userRole === "Manager") {
      navigate(`/manager/koiShow/detail/${recordId}?status=${recordStatus}`);
    } else {
      // Fallback hoặc thông báo lỗi
      notification.error({
        message: "Lỗi phân quyền",
        description: "Bạn không có quyền truy cập trang này",
        placement: "topRight",
      });
    }
  };

  if (isLoading && localData.length === 0) return <Loading />;
  if (error && localData.length === 0) {
    return <p className="text-red-500 text-center">Không thể tải dữ liệu.</p>;
  }

  const columns = [
    {
      title: "Tên Sự Kiện",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => handleNavigation(record.id, record.status)}
        >
          {text}
        </span>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Ngày Bắt Đầu",
      dataIndex: "startDate",
      key: "startDate",
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
      responsive: ["sm", "md", "lg", "xl"],
    },
    {
      title: "Số lượng tối thiểu",
      dataIndex: "minParticipants",
      key: "minParticipants",
      render: (value) => value || "0",
      responsive: ["md", "lg", "xl"],
    },
    {
      title: "Số lượng tối đa",
      dataIndex: "maxParticipants",
      key: "maxParticipants",
      render: (value) => value || "0",
      responsive: ["md", "lg", "xl"],
    },
    {
      title: "Địa Điểm",
      dataIndex: "location",
      key: "location",
      responsive: ["md", "lg", "xl"],
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status, record) => {
        const availableOptions = getAvailableStatusOptions(status);
        const statusOption = statusOptions.find(
          (option) => option.value === status
        );

        // Get the Vietnamese label for the current status
        const statusLabel = statusOption ? statusOption.label : status;
        const statusColor = statusOption ? statusOption.color : "black";

        return (
          <>
            <style>
              {`
                .status-select-${record.id} .ant-select-selection-item {
                  color: ${statusColor} !important;
                  font-weight: 500;
                }
              `}
            </style>
            <Select
              value={statusLabel}
              style={{ width: "100%", minWidth: 120 }}
              className={`status-select-${record.id}`}
              onChange={(value, option) => {
                // Get status code from key since we're showing labels
                const statusCode = option.key;
                handleStatusChange(statusCode, record.id);
              }}
              dropdownStyle={{ minWidth: 150 }}
              disabled={
                !["pending", "internalpublished", "published"].includes(status)
              }
            >
              {availableOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.label}>
                  <span style={{ color: opt.color, fontWeight: 500 }}>
                    {opt.label}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </>
        );
      },
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];

  return (
    <div className="">
      <div className="mb-6 rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div className="flex-1">
            <div className="mb-2 text-sm">Tìm kiếm triển lãm:</div>
            <Input
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="w-full"
            />
          </div>
          <div className="flex-1 sm:flex-initial">
            <div className="mb-2 text-sm">Ngày:</div>
            <Space.Compact className="w-full">
              <DatePicker
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className="w-full sm:w-36 md:w-48"
                suffixIcon={<CalendarOutlined />}
              />
              <Button
                type="primary"
                className="bg-blue-500"
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
            </Space.Compact>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={false}
          scroll={{ x: true }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <h3 className="text-lg sm:text-xl font-bold">
                  Không có triển lãm nào
                </h3>
                <img
                  src={NoKoiShow}
                  alt="No shows"
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 object-contain"
                />
              </div>
            ),
          }}
          className="min-w-full"
          size="middle"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 p-3 rounded-lg justify-center sm:justify-between">
        <span className="text-sm text-gray-500 text-center sm:text-left">{`1-${filteredData.length} của ${totalItems}`}</span>
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={pageSize}
          showSizeChanger
          onChange={handlePageChange}
          size="default"
          className="self-center sm:self-auto"
        />
      </div>

      <Modal
        title="Lý do hủy triển lãm"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        width={520}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="cancellationReason"
            label="Lý do hủy"
            rules={[
              { required: true, message: "Vui lòng nhập lý do hủy triển lãm" },
            ]}
          >
            <AntInput.TextArea
              rows={4}
              placeholder="Nhập lý do hủy triển lãm"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận thay đổi trạng thái"
        open={isConfirmModalOpen}
        onOk={handleConfirmStatusChange}
        onCancel={() => setIsConfirmModalOpen(false)}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        width={520}
        centered
      >
        <p>
          Bạn có chắc chắn muốn thay đổi trạng thái từ "
          {getStatusLabel(currentStatus)}" thành "
          {getStatusLabel(selectedStatus)}"?
        </p>
        <p className="text-red-500 font-medium">
          Lưu ý: Khi đã cập nhật trạng thái, bạn sẽ không thể quay lại trạng
          thái trước đó.
        </p>
      </Modal>
    </div>
  );
}

export default KoiShow;
