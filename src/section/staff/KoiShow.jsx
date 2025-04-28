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
  } = useKoiShow();

  useEffect(() => {
    fetchKoiShowList(currentPage, pageSize);
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchText, selectedDate, koiShows]);

  const handleSearch = () => {
    const filtered = koiShows.filter((item) => {
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

  if (isLoading) return <Loading />;
  if (error) {
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
      dataIndex: "startExhibitionDate",
      key: "startExhibitionDate",
      sorter: (a, b) =>
        new Date(a.startExhibitionDate) - new Date(b.startExhibitionDate),
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
      responsive: ["sm", "md", "lg", "xl"],
    },
    {
      title: "SL tối thiểu",
      dataIndex: "minParticipants",
      key: "minParticipants",
      render: (value) => value || "0",
      responsive: ["md", "lg", "xl"],
    },
    {
      title: "SL tối đa",
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
    },
  ];

  return (
    <div>
      <div className="mb-6 rounded-lg shadow-sm py-3">
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
          dataSource={filteredData.map((item) => ({
            key: item.id,
            id: item.id,
            name: item.name,
            startExhibitionDate: item.startExhibitionDate,
            registrationFee: item.registrationFee,
            location: item.location,
            minParticipants: item.minParticipants,
            maxParticipants: item.maxParticipants,
            status: item.status,
          }))}
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
    </div>
  );
}

export default KoiShow;
