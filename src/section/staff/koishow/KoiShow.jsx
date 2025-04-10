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
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import NoKoiShow from "../../../assets/NoKoiShow.png";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useKoiShow from "../../../hooks/useKoiShow";
import { Loading } from "../../../components";

function KoiShow() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
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

  if (isLoading) return <Loading />;
  if (error) {
    message.error("Lỗi tải dữ liệu!");
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
          onClick={() => navigate(`/staff/koiShow/detail/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Ngày Bắt Đầu",
      dataIndex: "startExhibitionDate",
      key: "startExhibitionDate",
      sorter: (a, b) =>
        new Date(a.startExhibitionDate) - new Date(b.startExhibitionDate),
      render: (date) => new Date(date).toLocaleDateString("vi-VN"), // Hiển thị dạng DD/MM/YYYY
    },
    {
      title: "Số lượng tối thiểu",
      dataIndex: "minParticipants",
      key: "minParticipants",
      render: (value) => value || "0",
    },
    {
      title: "Số lượng tối đa",
      dataIndex: "maxParticipants",
      key: "maxParticipants",
      render: (value) => value || "0",
    },

    {
      title: "Địa Điểm",
      dataIndex: "location",
      key: "location",
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
    <div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="mb-2 text-sm">Tìm kiếm triển lãm:</div>
          <Input
            placeholder="Tìm kiếm..."
            className="max-w-md"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 text-sm">Ngày:</div>
          <div className="flex gap-2">
            <DatePicker
              placeholder="Chọn ngày"
              className="w-96"
              format="DD/MM/YYYY"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />
            <Button
              type="primary"
              className="bg-blue-500"
              onClick={handleSearch}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>
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
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-bold">Không có triển lãm nào</h3>
              <img
                src={NoKoiShow}
                alt="No shows"
                className="w-64 h-64 object-contain"
              />
            </div>
          ),
        }}
      />

      <div className="flex justify-end items-center mt-4">
        <span>{`1-${koiShows.length} của ${totalItems}`}</span>
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={pageSize}
          showSizeChanger
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default KoiShow;
