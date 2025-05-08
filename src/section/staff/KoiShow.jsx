import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Tag,
  notification,
  Pagination,
  Input,
  DatePicker,
  Space,
  Row,
  Col,
} from "antd";
import { SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import NoKoiShow from "../../assets/NoKoiShow.png";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useKoiShow from "../../hooks/useKoiShow";
import { Loading } from "../../components";
import Cookies from "js-cookie";
import useAuth from "../../hooks/useAuth";

function KoiShow() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [localData, setLocalData] = useState([]);
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
    reset,
  } = useKoiShow();

  useEffect(() => {
    reset();
    fetchKoiShowList(currentPage, pageSize);

    return () => {
      reset();
    };
  }, [userRole]);

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
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
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
        .includes(searchText.toLowerCase().trim());

      const matchDate = selectedDate
        ? dayjs(item.startDate).format("DD/MM/YYYY") ===
          selectedDate.format("DD/MM/YYYY")
        : true;

      return matchName && matchDate;
    });
    setFilteredData(filtered);
  };

  const handlePageChange = (page, size) => {
    fetchKoiShowList(page, size);
  };

  const handleNavigation = (recordId) => {
    if (userRole === "Staff") {
      navigate(`/staff/koiShow/detail/${recordId}`);
    } else if (userRole === "Referee") {
      navigate(`/referee/koiShow/detail/${recordId}`);
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
      ellipsis: true,
    },
    {
      title: "Ngày Bắt Đầu",
      dataIndex: "startDate",
      key: "startDate",
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
      responsive: ["xs", "sm", "md", "lg", "xl"],
      align: "center",
    },
    {
      title: "Địa Điểm",
      dataIndex: "location",
      key: "location",
      responsive: ["xs", "sm", "md", "lg", "xl"],
      ellipsis: true,
    },
    {
      title: "Ngày Tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => {
        if (!date) return "N/A";
        const dateObj = new Date(date);
        return `${dateObj.toLocaleDateString("vi-VN")} ${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
      },
      responsive: ["md", "lg", "xl"],
      align: "center",
    },
    {
      title: "Cập Nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      render: (date) => {
        if (!date) return "N/A";
        const dateObj = new Date(date);
        return `${dateObj.toLocaleDateString("vi-VN")} ${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
      },
      responsive: ["md", "lg", "xl"],
      align: "center",
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => {
        const statusMap = {
          pending: { label: "Chờ duyệt", color: "orange" },
          internalpublished: { label: "Đã công bố nội bộ", color: "blue" },
          published: { label: "Đã công bố", color: "green" },
          upcoming: { label: "Sắp diễn ra", color: "cyan" },
          inprogress: { label: "Đang diễn ra", color: "purple" },
          finished: { label: "Đã kết thúc", color: "gray" },
          cancelled: { label: "Đã hủy", color: "red" },
        };

        const statusInfo = statusMap[status] || {
          label: status,
          color: "default",
        };

        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
      },
      responsive: ["xs", "sm", "md", "lg", "xl"],
      width: "16%",
    },
  ];

  return (
    <div className="rounded-lg shadow-sm space-y-5">
      <div className="pb-2 border-b">
        <Row gutter={[24, 16]} align="bottom">
          <Col xs={24} md={16}>
            <div className="mb-2 font-medium">Tìm kiếm triển lãm:</div>
            <Input
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="w-full"
              size="large"
            />
          </Col>
          <Col xs={24} md={8}>
            <div className="mb-2 font-medium">Ngày:</div>
            <div className="flex space-x-2">
              <DatePicker
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className="flex-1"
                suffixIcon={<CalendarOutlined />}
                size="large"
              />
              <Button
                type="primary"
                className="bg-blue-500"
                onClick={handleSearch}
                size="large"
              >
                Tìm kiếm
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center justify-center py-10">
                <h3 className="text-lg font-bold mb-4">
                  Không có triển lãm nào
                </h3>
                <img
                  src={NoKoiShow}
                  alt="No shows"
                  className="w-32 h-32 object-contain"
                />
              </div>
            ),
          }}
          className="w-full"
          size="middle"
          rowClassName="hover:bg-gray-50"
        />
      </div>

      <div className="flex justify-between items-center p-4 border-t">
        <span className="text-sm text-gray-500">{`${filteredData.length > 0 ? 1 : 0}-${filteredData.length} của ${totalItems}`}</span>
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={pageSize}
          showSizeChanger
          onChange={handlePageChange}
          size="default"
          className="text-right"
          showTotal={(total, range) => `${range[0]}-${range[1]} của ${total}`}
        />
      </div>
    </div>
  );
}

export default KoiShow;
