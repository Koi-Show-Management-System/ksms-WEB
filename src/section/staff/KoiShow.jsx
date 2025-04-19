import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Tag,
  Spin,
  message,
  Pagination,
  Input,
  DatePicker,
  Space,
  Row,
  Col,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
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
      ellipsis: true,
    },
    {
      title: "Ngày Bắt Đầu",
      dataIndex: "startExhibitionDate",
      key: "startExhibitionDate",
      sorter: (a, b) =>
        new Date(a.startExhibitionDate) - new Date(b.startExhibitionDate),
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
      responsive: ["md"],
    },
    {
      title: "SL tối thiểu",
      dataIndex: "minParticipants",
      key: "minParticipants",
      render: (value) => value || "0",
      responsive: ["lg"],
    },
    {
      title: "SL tối đa",
      dataIndex: "maxParticipants",
      key: "maxParticipants",
      render: (value) => value || "0",
      responsive: ["lg"],
    },
    {
      title: "Địa Điểm",
      dataIndex: "location",
      key: "location",
      ellipsis: true,
      responsive: ["md"],
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
    },
  ];

  return (
    <div className="px-2 md:px-4">
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="mb-2 text-sm">Tìm kiếm triển lãm:</div>
            <Input
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              className="w-full"
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="mb-2 text-sm">Ngày:</div>
            <Space className="w-full">
              <DatePicker
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                size="large"
                className="w-full"
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                className="bg-blue-500"
                onClick={handleSearch}
                size="large"
              >
                Tìm kiếm
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
      <div className="overflow-x-auto">
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
          className="bg-white rounded-lg shadow-sm"
          locale={{
            emptyText: (
              <div className="flex flex-col items-center justify-center py-8">
                <h3 className="text-xl font-bold">Không có triển lãm nào</h3>
                <img
                  src={NoKoiShow}
                  alt="No shows"
                  className="w-48 h-48 md:w-64 md:h-64 object-contain"
                />
              </div>
            ),
          }}
          scroll={{ x: "max-content" }}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
        <span className="text-sm">{`1-${koiShows.length} của ${totalItems}`}</span>
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={pageSize}
          showSizeChanger
          onChange={handlePageChange}
          size="small"
          className="text-center"
        />
      </div>
    </div>
  );
}

export default KoiShow;
