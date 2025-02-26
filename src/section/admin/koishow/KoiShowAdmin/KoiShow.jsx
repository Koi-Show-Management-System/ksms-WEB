import React, { useState } from "react";
import { Button, Table, Input, DatePicker, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import NoKoiShow from "../../../../assets/NoKoiShow.png";
import { useNavigate } from "react-router-dom";

function KoiShow() {
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const [data, setData] = useState([
    {
      key: "1",
      id: "1",
      showName: "Triển lãm Cá Koi 2025",
      date: "29/05/2025",
      participants: "684/1000",
      status: "Đang diễn ra",
    },
    {
      key: "2",
      id: "2",
      showName: "Triển lãm Cá Koi 2024",
      date: "29/05/2024",
      participants: "680/1000",
      status: "Hoàn thành",
    },
  ]);

  const handleStatusChange = (record) => {
    const newData = data.map((item) => {
      if (item.key === record.key) {
        return {
          ...item,
          status: item.status === "Hoàn thành" ? "Đang diễn ra" : "Hoàn thành",
        };
      }
      return item;
    });
    setData(newData);
  };

  const getFilteredData = () => {
    return data.filter((item) => {
      const matchName = item.showName
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchDate = selectedDate
        ? item.date === selectedDate.format("DD/MM/YYYY")
        : true;
      return matchName && matchDate;
    });
  };

  const handleSearch = () => {
    console.log(
      "Tìm kiếm với:",
      searchText,
      selectedDate?.format("DD/MM/YYYY")
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: "Tên Triển Lãm",
      dataIndex: "showName",
      key: "showName",
      sorter: (a, b) => a.showName.localeCompare(b.showName),
      render: (text, record) => (
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => navigate(`/admin/koiShow/detail/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Số Người Tham Gia",
      dataIndex: "participants",
      key: "participants",
      sorter: (a, b) => {
        const [aCount] = a.participants.split("/");
        const [bCount] = b.participants.split("/");
        return parseInt(aCount) - parseInt(bCount);
      },
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status, record) => (
        <Tag
          color={status === "Hoàn thành" ? "success" : "processing"}
          className="rounded-full px-3 py-1 cursor-pointer"
          onClick={() => handleStatusChange(record)}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: () => (
        <div className="flex items-center space-x-2">
          {/* Edit Button */}
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-gray-500 hover:text-blue-500"
          />
          {/* Delete Button */}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-gray-500 hover:text-red-500"
            danger
          />
        </div>
      ),
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
        dataSource={getFilteredData()}
        className="bg-white rounded-lg shadow-sm"
        locale={{
          emptyText: (
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-bold">
                Không có triển lãm nào hôm nay
              </h3>
              <img
                src={NoKoiShow}
                alt="No shows"
                className="w-64 h-64 object-contain"
              />
            </div>
          ),
        }}
      />
    </div>
  );
}

export default KoiShow;
